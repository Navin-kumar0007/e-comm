"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Search, Truck, Phone, Mail } from "lucide-react";
import { saveSupplierAction, type SupplierInput } from "@/app/actions/admin-purchasing";
import { PageHeader, Panel, SidePanel, Field, Empty, Stat, inputCls, btnPrimary, btnSecondary, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

type Supplier = SupplierInput & { id: string; poCount: number; spend: number; due: number; lastOrder: string | null; isActive: boolean };

const BLANK: SupplierInput = { name: "", contactName: "", phone: "", email: "", gstin: "", address: "", state: "Karnataka", leadDays: 7, notes: "", isActive: true };

export function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<SupplierInput | null>(null);
  const [pending, start] = useTransition();

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? suppliers.filter((x) => `${x.name} ${x.contactName ?? ""} ${x.phone ?? ""} ${x.gstin ?? ""}`.toLowerCase().includes(s)) : suppliers;
  }, [suppliers, q]);

  const set = (k: keyof SupplierInput, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const save = () =>
    start(async () => {
      const res = await saveSupplierAction(form!);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Supplier saved");
      setForm(null);
      router.refresh();
    });

  const active = suppliers.filter((s) => s.isActive);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        subtitle="Who you buy from, their GSTIN and how long they take to deliver."
        actions={<button className={btnPrimary} onClick={() => setForm({ ...BLANK })}><Plus className="h-4 w-4" /> Add supplier</button>}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Active suppliers" value={active.length} />
        <Stat label="Bought so far" value={inr(suppliers.reduce((s, x) => s + x.spend, 0))} hint="All purchase orders, incl. GST" />
        <Stat label="Unpaid to suppliers" value={inr(suppliers.reduce((s, x) => s + x.due, 0))} tone={suppliers.some((x) => x.due > 0) ? "warn" : undefined} hint="Payments are recorded in Phase 3" />
      </div>

      <Panel
        title="All suppliers"
        action={
          <div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or GSTIN" className="w-full bg-transparent text-sm outline-none" />
          </div>
        }
      >
        {list.length === 0 ? (
          <Empty icon={<Truck className="h-8 w-8" />} title={suppliers.length ? "No match" : "No suppliers yet"}>
            Add the people you buy dry fruits, seeds, jars and labels from. Purchase orders and batches will show who supplied what.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30"><tr>
                <th className={thCls}>Supplier</th><th className={thCls}>Contact</th><th className={thCls}>GSTIN</th>
                <th className={`${thCls} text-right`}>Lead time</th><th className={`${thCls} text-right`}>Orders</th><th className={`${thCls} text-right`}>Bought</th><th className={thCls}>Last order</th><th className={thCls}></th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {list.map((s) => (
                  <tr key={s.id} className={s.isActive ? "hover:bg-muted/20" : "opacity-50"}>
                    <td className={tdCls}>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.state ?? ""}{s.isActive ? "" : " · Inactive"}</p>
                    </td>
                    <td className={tdCls}>
                      {s.contactName && <p>{s.contactName}</p>}
                      {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Phone className="h-3 w-3" />{s.phone}</a>}
                      {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Mail className="h-3 w-3" />{s.email}</a>}
                    </td>
                    <td className={`${tdCls} font-mono text-xs`}>{s.gstin || <span className="font-sans text-amber-700">Not registered</span>}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{s.leadDays} days</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{s.poCount}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{inr(s.spend)}</td>
                    <td className={tdCls}>{dateFmt(s.lastOrder)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      <Link href={`/admin/purchases/new?supplier=${s.id}`} className="mr-2 text-xs font-semibold text-[#6E1A2C] hover:underline">New PO</Link>
                      <button onClick={() => setForm({ ...s })} className="text-xs font-medium text-muted-foreground hover:text-foreground">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <SidePanel
        open={!!form}
        onOpenChange={(o) => !o && setForm(null)}
        title={form?.id ? "Edit supplier" : "Add supplier"}
        description="GSTIN lets you claim back the GST you pay on purchases."
        footer={<>
          <button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button>
          <button className={btnPrimary} onClick={save} disabled={pending || !form?.name}>{pending ? "Saving…" : "Save supplier"}</button>
        </>}
      >
        {form && (
          <div className="space-y-3">
            <Field label="Business name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Shree Dry Fruits Traders" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact person"><input className={inputCls} value={form.contactName ?? ""} onChange={(e) => set("contactName", e.target.value)} /></Field>
              <Field label="Phone"><input className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} inputMode="tel" /></Field>
            </div>
            <Field label="Email"><input className={inputCls} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} type="email" /></Field>
            <Field label="GSTIN" hint="Leave empty if the supplier is not GST registered. GST you pay them then counts as cost.">
              <input className={`${inputCls} font-mono uppercase`} value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} />
            </Field>
            <Field label="Address"><textarea className={`${inputCls} h-20 py-2`} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State"><input className={inputCls} value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} /></Field>
              <Field label="Delivery time (days)" hint="Used for reorder suggestions"><input className={inputCls} type="number" min={0} value={form.leadDays ?? 7} onChange={(e) => set("leadDays", Number(e.target.value))} /></Field>
            </div>
            <Field label="Notes"><textarea className={`${inputCls} h-16 py-2`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Payment terms, quality notes…" /></Field>
            {form.id && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#6E1A2C]" checked={form.isActive ?? true} onChange={(e) => set("isActive", e.target.checked)} /> Active supplier</label>
            )}
          </div>
        )}
      </SidePanel>
    </div>
  );
}
