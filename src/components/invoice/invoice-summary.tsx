// Easy-to-read bill summary shown above the full invoice on phones (the A4 invoice is shrunk to fit).

const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAID: Record<string, string> = { COD: "Cash on delivery", ONLINE: "Paid online", CASH: "Paid in cash", UPI: "Paid by UPI", CARD: "Paid by card" };

export function InvoiceSummary({ order }: {
  order: {
    invoiceNumber: string | null;
    paidAt?: Date | null;
    createdAt: Date;
    total: number;
    paymentMethod: string;
    items: Array<{ productName: string; weight: string; quantity: number; price: number; product?: { name: string } | null }>;
  };
}) {
  const date = new Date(order.paidAt ?? order.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
  return (
    <section className="rounded-xl border border-border bg-white p-4 text-sm md:hidden print:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#9A6E2A]">{order.invoiceNumber ? "Tax invoice" : "Order summary"}</p>
          {order.invoiceNumber && <p className="font-mono font-semibold">{order.invoiceNumber}</p>}
          <p className="text-muted-foreground">{date} · {PAID[order.paymentMethod] ?? order.paymentMethod}</p>
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums">{inr(order.total)}</p>
      </div>
      <ul className="mt-3 divide-y divide-border border-t border-border">
        {order.items.map((i, k) => (
          <li key={k} className="flex justify-between gap-3 py-2">
            <span className="min-w-0">{i.product?.name ?? i.productName} <span className="text-muted-foreground">{i.weight} × {i.quantity}</span></span>
            <span className="shrink-0 tabular-nums">{inr(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">The full GST invoice is below. Pinch to zoom, or tap Print / Save PDF to keep a copy.</p>
    </section>
  );
}
