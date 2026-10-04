'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { getStoreSettings } from '@/lib/store-settings';
import { getProvider, listProviders, ShippingError, SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/shipping';
import { createShipmentForOrder, syncShipment, applyShipmentUpdate, estimateOrderWeight } from '@/lib/shipping/service';
import { CANCELLABLE_SHIPMENT_STATUSES } from '@/lib/shipping/status';
import { issueRefund, markManualRefundProcessed } from '@/lib/refunds';
import { logOrderEvent } from '@/lib/order-events';

async function actor() {
  const session = await requireAdmin();
  return `admin:${session.user?.email ?? 'unknown'}`;
}

function done(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
}

function fail(e: unknown) {
  if (e instanceof ShippingError) return { error: e.message };
  console.error('[ADMIN SHIPPING]', e);
  return { error: 'Something went wrong. Check the server logs.' };
}

/** Providers + package defaults for the "Book shipment" form. */
export async function getShippingContext(orderId: string) {
  await requireAdmin();
  const settings = await getStoreSettings();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
  return {
    providers: listProviders().filter((p) => p.configured),
    defaultProvider: settings.shippingProvider,
    pickupConfigured: !!(settings.pickupAddress && settings.pickupPincode && settings.pickupPhone),
    estimatedWeightGrams: order ? estimateOrderWeight(order.items, settings) : settings.defaultPackageWeightGrams,
  };
}

/** Courier options + rates from a provider for this order's pincode. */
export async function getCourierOptionsAction(orderId: string, providerId: string, weightGrams: number) {
  await requireAdmin();
  try {
    const provider = getProvider(providerId);
    if (!provider?.checkServiceability || !provider.isConfigured()) return { options: [] };
    const settings = await getStoreSettings();
    if (!settings.pickupPincode) return { error: 'Set your pickup pincode in Settings → Shipping first.' };
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: 'Order not found' };
    const pincode = order.shippingAddress.match(/(\d{6})\s*$/)?.[1];
    if (!pincode) return { error: 'Could not read a 6-digit pincode from the shipping address.' };
    const res = await provider.checkServiceability({
      pickupPincode: settings.pickupPincode,
      deliveryPincode: pincode,
      paymentMode: order.paymentMethod === 'COD' ? 'COD' : 'PREPAID',
      orderValue: order.total,
      weightGrams,
    });
    if (!res.serviceable) return { error: `${provider.name} does not deliver to ${pincode}.` };
    return { options: res.options };
  } catch (e) {
    return fail(e);
  }
}

export async function bookShipmentAction(
  orderId: string,
  input: { providerId?: string; courierId?: string; weightGrams?: number; manual?: { awb: string; courierName: string; trackingUrl?: string } }
) {
  const who = await actor();
  try {
    const shipment = await createShipmentForOrder(orderId, input, who);
    done(orderId);
    return { success: true, awb: shipment.awb, labelUrl: shipment.labelUrl };
  } catch (e) {
    return fail(e);
  }
}

export async function syncShipmentAction(shipmentId: string) {
  const who = await actor();
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return { error: 'Shipment not found' };
    const res = await syncShipment(shipmentId, who);
    done(shipment.orderId);
    return { success: true, status: res.status };
  } catch (e) {
    return fail(e);
  }
}

/** Manual partners: admin records the courier's status (picked up, delivered, RTO...). */
export async function setShipmentStatusAction(shipmentId: string, status: string, note?: string) {
  const who = await actor();
  if (!SHIPMENT_STATUSES.includes(status as ShipmentStatus)) return { error: 'Unknown shipment status' };
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return { error: 'Shipment not found' };
    await applyShipmentUpdate(shipment, { status: status as ShipmentStatus, rawStatus: 'manual update', message: note }, who);
    done(shipment.orderId);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelShipmentAction(shipmentId: string) {
  const who = await actor();
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return { error: 'Shipment not found' };
    if (!CANCELLABLE_SHIPMENT_STATUSES.includes(shipment.status as ShipmentStatus) && shipment.provider !== 'MANUAL') {
      return { error: 'Already picked up — it can no longer be cancelled with the courier.' };
    }
    const provider = getProvider(shipment.provider);
    if (provider?.cancelShipment && shipment.awb) await provider.cancelShipment(shipment.awb);
    await prisma.shipment.update({ where: { id: shipmentId }, data: { status: 'CANCELLED' } });
    await prisma.order.update({ where: { id: shipment.orderId }, data: { trackingNumber: null, trackingUrl: null } });
    await logOrderEvent(null, { orderId: shipment.orderId, type: 'SHIPMENT', message: `Shipment ${shipment.awb || ''} cancelled — order can be re-booked`, actor: who });
    done(shipment.orderId);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function issueRefundAction(orderId: string, amount: number, reason: string) {
  const who = await actor();
  if (!reason.trim()) return { error: 'Enter a reason for the refund.' };
  const res = await issueRefund({ orderId, amount, reason: reason.trim(), actor: who });
  done(orderId);
  return res.ok ? { success: true, status: res.status } : { error: res.error };
}

export async function markRefundPaidAction(refundId: string, reference: string) {
  const who = await actor();
  const refund = await prisma.refund.findUnique({ where: { id: refundId } });
  const res = await markManualRefundProcessed(refundId, reference.trim(), who);
  if (refund) done(refund.orderId);
  return res.ok ? { success: true } : { error: res.error };
}
