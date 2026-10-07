import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Package, Truck, CheckCircle, Clock, RotateCcw, IndianRupee } from 'lucide-react';
import { OrderActions } from './order-actions';
import { getStoreSettings } from '@/lib/store-settings';
import { CUSTOMER_CANCELLABLE, ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status-rules';
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from '@/lib/shipping/status';

export const metadata = {
  title: 'My Orders - Spicy Nuts',
};

function OrderTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'PENDING', label: 'Order Placed', icon: Clock },
    { id: 'PROCESSING', label: 'Processing', icon: Package },
    { id: 'CONFIRMED', label: 'Packed', icon: Package },
    { id: 'SHIPPED', label: 'Shipped', icon: Truck },
    { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  const currentIndex = Math.max(0, steps.findIndex(s => s.id === status));

  return (
    <div className="relative mt-6 mb-8">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />
      <div 
        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000" 
        style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
      />
      
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'bg-background border-white/20 text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function withinReturnWindow(deliveredAt: Date, windowMs: number) {
  return Date.now() - new Date(deliveredAt).getTime() <= windowMs;
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        shipments: { where: { status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' }, take: 1 },
        refunds: { orderBy: { createdAt: 'desc' } },
        returnRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    getStoreSettings(),
  ]);
  const windowMs = settings.returnWindowHours * 60 * 60 * 1000;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-8 text-primary">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-xl">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground">When you place orders, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Order <span className="font-mono text-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-xl font-bold text-secondary">₹{order.total.toFixed(2)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                    order.status === 'DELIVERED' ? 'bg-primary/20 text-primary border border-primary/30' :
                    ['CANCELLED', 'EXPIRED', 'RTO', 'RETURNED'].includes(order.status) ? 'bg-destructive/20 text-destructive border border-destructive/30' :
                    'bg-secondary/20 text-secondary border border-secondary/30'
                  }`}>
                    {(ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status).toUpperCase()}
                  </span>
                </div>
              </div>

              {!['CANCELLED', 'EXPIRED', 'RTO', 'RETURNED'].includes(order.status) && (
                <OrderTimeline status={order.status} />
              )}
              
              {(order.trackingNumber || order.trackingUrl) && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Tracking Information</p>
                    {order.shipments[0] && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.shipments[0].courierName} · {SHIPMENT_STATUS_LABELS[order.shipments[0].status as ShipmentStatus] ?? order.shipments[0].status}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      {order.trackingUrl ? (
                        <a 
                          href={order.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {order.trackingNumber || "Track your order"}
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">{order.trackingNumber}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {order.refunds.length > 0 && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 text-sm space-y-1">
                  <p className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Refunds</p>
                  {order.refunds.map((r) => (
                    <p key={r.id}>
                      ₹{r.amount.toFixed(2)} — {r.status === 'PROCESSED' ? 'Refunded' : r.status === 'FAILED' ? 'Failed (we are retrying)' : r.method === 'MANUAL' ? 'Pending — we will contact you for bank/UPI details' : 'Processing (5-7 business days)'}
                    </p>
                  ))}
                </div>
              )}

              {order.returnRequests[0] && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 text-sm">
                  <p className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Return Request</p>
                  <p className="mt-1">
                    {({ REQUESTED: 'Under review', APPROVED: 'Approved — refund/replacement on the way', REJECTED: 'Not approved', RESOLVED: order.returnRequests[0].resolution === 'REPLACEMENT' ? 'Replacement sent' : 'Refund issued' } as Record<string, string>)[order.returnRequests[0].status] ?? order.returnRequests[0].status}
                  </p>
                  {order.returnRequests[0].adminNote && <p className="text-xs text-muted-foreground mt-1">{order.returnRequests[0].adminNote}</p>}
                </div>
              )}

              <OrderActions
                orderId={order.id}
                canCancel={CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus) && !order.shipments.some((s) => !['CREATED', 'PICKUP_SCHEDULED'].includes(s.status))}
                canReturn={
                  order.status === 'DELIVERED' &&
                  withinReturnWindow(order.deliveredAt ?? order.updatedAt, windowMs) &&
                  !order.returnRequests.some((r) => ['REQUESTED', 'APPROVED'].includes(r.status))
                }
                returnHours={settings.returnWindowHours}
              />

              <div className="mt-6 flex gap-4">
                <a href={`/track/${order.id}`} className="text-sm font-medium text-primary hover:underline underline-offset-4">Track Order</a>
                <a href={`/account/orders/invoice/${order.id}`} target="_blank" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Download Invoice</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
