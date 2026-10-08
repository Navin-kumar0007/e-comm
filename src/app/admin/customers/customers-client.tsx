"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Building2, Plus, Users } from "lucide-react";
import { saveBusinessCustomerAction, type BusinessCustomerInput } from "@/app/actions/admin-customers";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

const TABS = [
  { key: "all", label: "All" },
  { key: "buyers", label: "Have ordered" },
  { key: "wholesale", label: "Wholesale / shops" },
] as const;

const blank = (): BusinessCustomerInput => ({ name: "", email: "", phone: "", businessName: "", gstin: "", wholesaleDiscount: 10, address: "", city: "", state: "Karnataka", pincode: "", customerType: "WHOLESALE" });

export default function CustomersClient({ initialCustomers, initialQuery = "", canEdit = false }: { initialCustomers: any[]; initialQuery?: string; canEdit?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(initialQuery);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [form, setForm] = useState<BusinessCustomerInput | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return initialCustomers.filter((c) => {
      if (tab === "buyers" && !c.orders) return false;
      if (tab === "wholesale" && c.customerType !== "WHOLESALE") return false;
      return !s || `${c.name} ${c.email} ${c.phone ?? ""} ${c.businessName ?? ""} ${c.gstin ?? ""}`.toLowerCase().includes(s);
    });
  }, [initialCustomers, q, tab]);

  const buyers = initialCustomers.filter((c) => c.orders > 0);
  const wholesale = initialCustomers.filter((c) => c.customerType === "WHOLESALE");
  const set = (k: keyof BusinessCustomerInput, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const save = () => start(async () => {
    const res = await saveBusinessCustomerAction(form!);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success("Customer saved");
    setForm(null);
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Everyone who has an account or has ordered, plus shops and wholesale buyers with their GSTIN and discount."
        actions={canEdit && <button className={btnPrimary} onClick={() => setForm(blank())}><Plus className="h-4 w-4" /> Add wholesale buyer</button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Accounts" value={initialCustomers.length} />
        <Stat label="Have ordered" value={buyers.length} />
        <Stat label="Wholesale buyers" value={wholesale.length} />
        <Stat label="Average spend" value={inr(buyers.length ? buyers.reduce((s, c) => s + c.spent, 0) / buyers.length : 0)} hint="Per customer who ordered" />
      </div>

      <Panel
        title={<div className="flex gap-1">{TABS.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg px-3 py-1 text-sm font-medium ${tab === t.key ? "bg-[#6E1A2C] text-white" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</button>)}</div>}
        action={<div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-border px-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone, GSTIN" className="w-full bg-transparent text-sm outline-none" /></div>}
      >
        {list.length === 0 ? <Empty icon={<Users className="h-8 w-8" />} title="No customers found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr><th className={thCls}>Customer</th><th className={thCls}>Contact</th><th className={`${thCls} text-right`}>Orders</th><th className={`${thCls} text-right`}>Spent</th><th className={thCls}>Last order</th><th className={thCls}>Type</th><th className={thCls}></th></tr></thead>
              <tbody className="divide-y divide-border/60">
                {list.slice(0, 300).map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className={tdCls}>
                      {c.businessName && <p className="flex items-center gap-1 font-semibold"><Building2 className="h-3.5 w-3.5 text-[#c9a45a]" />{c.businessName}</p>}
                      <p className={c.businessName ? "text-xs text-muted-foreground" : "font-medium"}>{c.name}</p>
                      {c.gstin && <p className="font-mono text-[11px] text-muted-foreground">{c.gstin}</p>}
                    </td>
                    <td className={tdCls}><p className="text-xs">{c.email}</p><p className="text-xs text-muted-foreground">{c.phone ?? ""}{c.city ? ` · ${c.city}` : ""}</p></td>
                    <td className={`${tdCls} text-right tabular-nums`}>{c.orders}</td>
                    <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(c.spent)}</td>
                    <td className={tdCls}>{dateFmt(c.lastOrder)}</td>
                    <td className={tdCls}>
                      {c.status === "Staff" ? <StatusPill status="ORDERED" label="Staff" /> : c.customerType === "WHOLESALE" ? <StatusPill status="RECEIVED" label={`Wholesale${c.wholesaleDiscount ? ` · ${c.wholesaleDiscount}% off` : ""}`} /> : <StatusPill status="DRAFT" label="Retail" />}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      {canEdit && c.status !== "Staff" && <button className={btnGhost} onClick={() => setForm({ id: c.id, name: c.name, email: c.email, phone: c.phone, businessName: c.businessName, gstin: c.gstin, wholesaleDiscount: c.wholesaleDiscount, address: c.address, city: c.city, state: c.state, pincode: c.pincode, customerType: c.customerType })}>{c.customerType === "WHOLESALE" ? "Edit" : "Make wholesale"}</button>}
                      {canEdit && c.customerType === "WHOLESALE" && <Link href={`/admin/orders/new?customer=${c.id}`} className={btnGhost}>New order</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length > 300 && <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">Showing 300 of {list.length}. Search to narrow down.</p>}
          </div>
        )}
      </Panel>

      <SidePanel open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "Customer details" : "Add wholesale buyer"} description="Shops, offices, caterers and resellers. Their GSTIN is printed on invoices so they can claim the GST."
        footer={<><button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !form?.name || !form?.email} onClick={save}>Save</button></>}>
        {form && (
          <div className="space-y-3">
            <Field label="Customer type">
              <select className={inputCls} value={form.customerType} onChange={(e) => set("customerType", e.target.value)}>
                <option value="WHOLESALE">Wholesale / shop</option><option value="RETAIL">Retail</option>
              </select>
            </Field>
            <Field label="Business name"><input className={inputCls} value={form.businessName ?? ""} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Sri Lakshmi Stores" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact person"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Phone"><input className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} inputMode="tel" /></Field>
            </div>
            <Field label="Email" hint={form.id ? undefined : "If they already have an account with this email, it is updated."}><input className={inputCls} type="email" disabled={!!form.id} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN"><input className={`${inputCls} font-mono uppercase`} maxLength={15} value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></Field>
              <Field label="Usual discount %" hint="Applied on manual orders"><input type="number" min={0} max={60} step={0.5} className={inputCls} value={form.wholesaleDiscount ?? ""} onChange={(e) => set("wholesaleDiscount", e.target.value === "" ? null : Number(e.target.value))} /></Field>
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
