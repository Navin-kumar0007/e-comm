import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { estimateOrderWeight, parseAddress } from "@/lib/shipping/service";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { BRAND_PHONE_DISPLAY } from "@/lib/contact";
import { PrintToolbar, ShippingLabel, PackingSlip, PickList, type PrintOrder } from "../print-docs";

const DOCS = {
  invoices: { title: "Tax invoices", page: "A4", note: "A4 paper" },
  labels: { title: "Shipping labels", page: "4in 6in", note: "4 × 6 in thermal labels" },
  packing: { title: "Packing slips", page: "4in 6in", note: "4 × 6 in thermal labels" },
  picklist: { title: "Pick list", page: "A4", note: "A4 paper" },
} as const;
type DocKey = keyof typeof DOCS;

export default async function PrintPage({ params, searchParams }: { params: Promise<{ doc: string }>; searchParams: Promise<{ ids?: string }> }) {
  await requirePagePermission("orders.view");
  const { doc } = await params;
  if (!(doc in DOCS)) notFound();
  const kind = doc as DocKey;
  const ids = ((await searchParams).ids || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200);

  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "asc" },
      include: {
        items: { include: { product: { include: { variants: true } } } },
        shipments: { where: { type: "FORWARD", status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    getStoreSettings(),
  ]);

  const pageStyle = kind === "invoices" || kind === "picklist"
    ? `@page { size: A4; margin: 8mm; }`
    : `@page { size: 4in 6in; margin: 0; } .sheet-4x6 { page-break-after: always; break-after: page; }`;

  const data: PrintOrder[] = orders.map((o: any) => {
    const ship = o.shipments[0];
    return {
      id: o.id,
      ref: `NW-${o.id.slice(-8).toUpperCase()}`,
      invoiceNumber: o.invoiceNumber,
      createdAt: o.createdAt.toISOString(),
      paymentMethod: o.paymentMethod,
      total: o.total,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      address: parseAddress(o),
      weightGrams: ship?.weightGrams ?? estimateOrderWeight(o.items, settings),
      dims: `${settings.packageLengthCm}×${settings.packageBreadthCm}×${settings.packageHeightCm} cm`,
      awb: ship?.awb ?? null,
      courierName: ship?.courierName ?? null,
      courierLabelUrl: ship?.labelUrl ?? null,
      items: o.items.map((i: any) => {
        const variant = i.variantId ? i.product?.variants?.find((v: any) => v.id === i.variantId) : null;
        return {
          name: i.productName || i.product?.name || "Item",
          pack: i.weight,
          quantity: i.quantity,
          sku: variant?.sku ?? null,
          barcode: variant?.barcode ?? i.product?.barcode ?? null,
        };
      }),
    };
  });

  const sender = {
    name: settings.legalName || settings.storeName,
    address: settings.pickupAddress
      ? `${settings.pickupAddress}, ${settings.pickupCity ?? ""} ${settings.pickupState ?? ""} ${settings.pickupPincode ?? ""}`.replace(/\s+/g, " ").trim()
      : settings.businessAddress || "",
    phone: settings.pickupPhone || BRAND_PHONE_DISPLAY,
    gstin: settings.gstin,
  };
  const courierLabels = data.filter((o) => o.courierLabelUrl).length;

  return (
    <div>
      <style>{pageStyle}</style>
      <PrintToolbar
        title={DOCS[kind].title}
        count={kind === "picklist" ? 1 : data.length}
        note={`${DOCS[kind].note}${kind === "labels" && courierLabels ? ` · ${courierLabels} booked via courier: their label has routing codes, use it when available` : ""}`}
      />
      {data.length === 0 && <p className="text-sm text-muted-foreground">No orders selected.</p>}

      {kind === "invoices" &&
        orders.map((o: any) => (
          <div key={o.id} className="mb-8 flex justify-center print:mb-0 print:block" style={{ breakAfter: "page" }}>
            <InvoiceDocument order={o} settings={settings} notes={o.invoiceNotes || undefined} />
          </div>
        ))}
      {kind === "labels" && data.map((o) => <ShippingLabel key={o.id} o={o} sender={sender} />)}
      {kind === "packing" && data.map((o) => <PackingSlip key={o.id} o={o} />)}
      {kind === "picklist" && data.length > 0 && <PickList orders={data} />}
    </div>
  );
}
