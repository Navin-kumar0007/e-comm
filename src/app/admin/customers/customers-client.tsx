"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Building2, Plus, Users, Download } from "lucide-react";
import { saveBusinessCustomerAction, type BusinessCustomerInput } from "@/app/actions/admin-customers";
import type { CustomerRow, Segment } from "@/lib/customers";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

const SEGMENTS: Array<{ key: "all" | Segment; label: string; hint: string }> = [
  { key: "all", label: "All", hint: "" },
  { key: "repeat", label: "Repeat", hint: "2+ orders" },
  { key: "vip", label: "Top spenders", hint: "₹5,000+ spent" },
  { key: "new", label: "New", hint: "First order in the last 30 days" },
  { key: "inactive", label: "Gone quiet", hint: "No order for 60+ days" },
  { key: "codRisk", label: "Returned parcels", hint: "At least one undelivered (RTO) order" },
  { key: "wholesale", label: "Wholesale", hint: "Shops and resellers" },
  { key: "noOrders", label: "No orders yet", hint: "Account, never ordered" },
];

const blank = (): BusinessCustomerInput => ({ name: "", email: "", phone: "", businessName: "", gstin: "", wholesaleDiscount: 10, address: "", city: "", state: "Karnataka", pincode: "", customerType: "WHOLESALE" });

export default function CustomersClient({ initialCustomers, initialQuery = "", initialSegment = "all", canEdit = false }: { initialCustomers: CustomerRow[]; initialQuery?: string; initialSegment?: string; canEdit?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(initialQuery);
  const [seg, setSeg] = useState<"all" | Segment>((SEGMENTS.some((s) => s.key === initialSegment) ? initialSegment : "all") as any);
  const [form, setForm] = useState<BusinessCustomerInput | null>(null);

  const counts = useMemo(() => Object.fromEntries(SEGMENTS.map((s) => [s.key, s.key === "all" ? initialCustomers.length : initialCustomers.filter((c) => c.segments.includes(s.key as Segment)).length])), [initialCustomers]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    return initialCustomers.filter((c) => {
      if (seg !== "all" && !c.segments.includes(seg)) return false;
      if (!s) return true;
      return `${c.name} ${c.email ?? ""} ${c.businessName ?? ""}`.toLowerCase().includes(s) || (digits.length >= 4 && (c.phone ?? "").includes(digits));
    });
  }, [initialCustomers, q, seg]);

  const buyers = initialCustomers.filter((c) => c.orders > 0);
  const repeat = initialCustomers.filter((c) => c.orders >= 2).length;
  const set = (k: keyof BusinessCustomerInput, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const save = () => start(async () => {
    const res = await saveBusinessCustomerAction(form!);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success("Customer saved");
    setForm(null);
    router.refresh();
  });

  const exportList = async () => {
    const { downloadExcel } = await import("@/lib/excel");
    await downloadExcel(`customers-${seg}`, "Customers", ["Name", "Business", "Phone", "Email", "Orders", "Spent", "First order", "Last order", "Returned (RTO)", "WhatsApp offers", "Type"],
      list.map((c) => [c.name, c.businessName, c.phone, c.email, c.orders, c.spend, c.firstOrder?.slice(0, 10), c.lastOrder?.slice(0, 10), c.rto, c.whatsappOffers ? "Yes" : "No", c.customerType]), [5]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Everyone who has ordered (online, by phone or at the shop) or has an account, matched by phone number."
        actions={<>
          <button className={btnSecondary} onClick={exportList} disabled={!list.length}><Download className="h-4 w-4" /> Excel</button>
          {canEdit && <button className={btnPrimary} onClick={() => setForm(blank())}><Plus className="h-4 w-4" /> Add wholesale buyer</button>}
        </>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Customers" value={initialCustomers.length} hint={`${buyers.length} have ordered`} />
        <Stat label="Come back" value={buyers.length ? `${Math.round((repeat / buyers.length) * 100)}%` : "—"} hint={`${repeat} ordered 2+ times`} />
        <Stat label="Average spend" value={inr(buyers.length ? buyers.reduce((s, c) => s + c.spend, 0) / buyers.length : 0)} hint="Per customer who ordered" />
        <Stat label="Can receive WhatsApp offers" value={initialCustomers.filter((c) => c.whatsappOffers).length} hint="Gave consent" />
      </div>

      <Panel
        title={<div className="flex flex-wrap gap-1">{SEGMENTS.map((s) => <button key={s.key} title={s.hint} onClick={() => setSeg(s.key)} className={`rounded-lg px-2.5 py-1 text-sm font-medium ${seg === s.key ? "bg-[#6E1A2C] text-white" : "text-muted-foreground hover:text-foreground"}`}>{s.label} <span className="text-xs opacity-70">{counts[s.key]}</span></button>)}</div>}
        action={<div className="flex h-9 w-60 items-center gap-2 rounded-lg border border-border px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, email" className="w-full bg-transparent text-sm outline-none" /></div>}
      >
        {list.length === 0 ? <Empty icon={<Users className="h-8 w-8" />} title="No customers here" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr><th className={thCls}>Customer</th><th className={thCls}>Contact</th><th className={`${thCls} text-right`}>Orders</th><th className={`${thCls} text-right`}>Spent</th><th className={thCls}>Last order</th><th className={thCls}>Tags</th><th className={thCls}></th></tr></thead>
              <tbody className="divide-y divide-border/60">
                {list.slice(0, 400).map((c) => (
                  <tr key={c.key} className="hover:bg-muted/20">
                    <td className={tdCls}>
                      <Link href={`/admin/customers/${encodeURIComponent(c.key)}`} className="font-semibold text-[#6E1A2C] hover:underline">
                        {c.businessName ? <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-[#c9a45a]" />{c.businessName}</span> : c.name}
                      </Link>
                      {c.businessName && <p className="text-xs text-muted-foreground">{c.name}</p>}
                      {!c.hasAccount && <p className="text-[11px] text-muted-foreground">Guest (no account)</p>}
                    </td>
                    <td className={tdCls}><p className="text-xs">{c.phone ?? "—"}</p><p className="text-xs text-muted-foreground">{c.email ?? ""}</p></td>
                    <td className={`${tdCls} text-right tabular-nums`}>{c.orders}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(c.spend)}</td>
                    <td className={tdCls}>{dateFmt(c.lastOrder)}</td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1">
                        {c.segments.includes("vip") && <StatusPill status="RECEIVED" label="Top spender" />}
                        {c.segments.includes("repeat") && <StatusPill status="ORDERED" label="Repeat" />}
                        {c.segments.includes("codRisk") && <StatusPill status="CANCELLED" label={`RTO ${c.rto}`} />}
                        {c.segments.includes("inactive") && <StatusPill status="DRAFT" label="Gone quiet" />}
                        {c.customerType === "WHOLESALE" && <StatusPill status="PARTIAL" label="Wholesale" />}
                        {c.shop > 0 && <StatusPill status="NONE" label="Shop" />}
                      </div>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      {canEdit && c.customerType === "WHOLESALE" && c.userId && <Link href={`/admin/orders/new?customer=${c.userId}`} className={btnGhost}>New order</Link>}
                      {canEdit && c.customerType !== "WHOLESALE" && c.email && <button className={btnGhost} onClick={() => setForm({ ...blank(), id: c.userId ?? undefined, name: c.name, email: c.email!, phone: c.phone ?? "" })}>Make wholesale</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length > 400 && <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">Showing 400 of {list.length}. Search or pick a group to narrow down.</p>}
          </div>
        )}
      </Panel>

      <SidePanel open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "Wholesale details" : "Add wholesale buyer"} description="Shops, offices, caterers and resellers. Their GSTIN is printed on invoices so they can claim the GST."
        footer={<><button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !form?.name || !form?.email} onClick={save}>Save</button></>}>
        {form && (
          <div className="space-y-3">
            <Field label="Business name"><input className={inputCls} value={form.businessName ?? ""} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Sri Lakshmi Stores" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact person"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Phone"><input className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} inputMode="tel" /></Field>
            </div>
            <Field label="Email"><input className={inputCls} type="email" disabled={!!form.id} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN"><input className={`${inputCls} font-mono uppercase`} maxLength={15} value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></Field>
              <Field label="Usual discount %" hint="Applied on manual and counter orders"><input type="number" min={0} max={60} step={0.5} className={inputCls} value={form.wholesaleDiscount ?? ""} onChange={(e) => set("wholesaleDiscount", e.target.value === "" ? null : Number(e.target.value))} /></Field>
            </div>
            <Field label="Address"><textarea className={`${inputCls} h-16 py-2`} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="City"><input className={inputCls} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="State"><input className={inputCls} value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} /></Field>
              <Field label="Pincode"><input className={inputCls} inputMode="numeric" maxLength={6} value={form.pincode ?? ""} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} /></Field>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
