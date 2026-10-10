"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldHalf, Plus, Eraser, Check, X } from "lucide-react";
import { closePrivacyRequestAction, createPrivacyRequestAction, eraseCustomerAction } from "@/app/actions/admin-privacy";
import { PageHeader, Panel, Stat, SidePanel, Field, Empty, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, dateFmt } from "@/components/admin/ui";

const TYPE: Record<string, string> = { ACCESS: "Copy of data", CORRECTION: "Correct data", ERASURE: "Delete account", WITHDRAW: "Withdraw consent" };

export function PrivacyClient({ rows }: { rows: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ email: string; phone: string; type: "ACCESS" | "CORRECTION" | "ERASURE" | "WITHDRAW"; details: string } | null>(null);
  const [confirmErase, setConfirmErase] = useState<string | null>(null);
  const open = rows.filter((r) => r.status === "OPEN");
  const overdue = open.filter((r) => new Date(r.dueAt).getTime() < Date.now());
  const run = (fn: () => Promise<any>, ok: string) => start(async () => {
    const res = await fn();
    if (res && "error" in res && res.error) { toast.error(res.error); return; }
    toast.success(ok);
    setForm(null); setConfirmErase(null);
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Privacy requests" subtitle="Customers' requests to see, correct or delete their data (DPDP Act). Answer each within 90 days; aim for 30."
        actions={<button className={btnPrimary} onClick={() => setForm({ email: "", phone: "", type: "ERASURE", details: "" })}><Plus className="h-4 w-4" /> Log a request</button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Open" value={open.length} tone={open.length ? "warn" : undefined} />
        <Stat label="Overdue" value={overdue.length} tone={overdue.length ? "bad" : undefined} hint="Past the 90-day limit" />
        <Stat label="Completed" value={rows.filter((r) => r.status === "DONE").length} />
      </div>
      <Panel title="Requests">
        {rows.length === 0 ? <Empty icon={<ShieldHalf className="h-8 w-8" />} title="No requests yet">Customers can download their data or ask for deletion from their account page. Requests by email or phone can be logged here.</Empty> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={thCls}>Received</th><th className={thCls}>Customer</th><th className={thCls}>Request</th><th className={thCls}>Answer by</th><th className={thCls}>Status</th><th className={thCls}></th></tr></thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => {
                const late = r.status === "OPEN" && new Date(r.dueAt).getTime() < Date.now();
                const key = (r.phone || "").replace(/\D/g, "").slice(-10) || r.email;
                return (
                  <tr key={r.id}>
                    <td className={tdCls}>{dateFmt(r.createdAt)}</td>
                    <td className={tdCls}>{key ? <Link className="font-medium text-[#6E1A2C] hover:underline" href={`/admin/customers/${encodeURIComponent(key)}`}>{r.email ?? r.phone}</Link> : "—"}{r.email && r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}</td>
                    <td className={tdCls}>{TYPE[r.type] ?? r.type}{r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}{r.note && <p className="text-xs text-emerald-700">{r.note}</p>}</td>
                    <td className={`${tdCls} ${late ? "font-semibold text-red-700" : ""}`}>{r.status === "OPEN" ? dateFmt(r.dueAt) : "—"}</td>
                    <td className={tdCls}><StatusPill status={r.status === "DONE" ? "RECEIVED" : r.status === "REJECTED" ? "CANCELLED" : late ? "CANCELLED" : "PARTIAL"} label={r.status === "OPEN" ? (late ? "Overdue" : "Open") : r.status === "DONE" ? "Done" : "Rejected"} /></td>
                    <td className={`${tdCls} whitespace-nowrap text-right`}>
                      {r.status === "OPEN" && (<>
                        {r.type === "ERASURE" && <button className={btnGhost} onClick={() => setConfirmErase(r.id)}><Eraser className="h-3.5 w-3.5" /> Erase</button>}
                        {r.type !== "ERASURE" && <button className={btnGhost} disabled={pending} onClick={() => run(() => closePrivacyRequestAction(r.id, "DONE"), "Marked done")}><Check className="h-3.5 w-3.5" /> Done</button>}
                        <button className={btnGhost} disabled={pending} onClick={() => { const note = window.prompt("Reason for rejecting (shown to staff only):") ?? ""; if (note) run(() => closePrivacyRequestAction(r.id, "REJECTED", note), "Rejected"); }}><X className="h-3.5 w-3.5" /> Reject</button>
                      </>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
      <p className="text-xs text-muted-foreground">Erasing removes the account, saved addresses, WhatsApp chats and subscriptions, staff notes and price alerts. Orders and invoices stay for about 6 years because GST law requires it.</p>

      <SidePanel open={!!confirmErase} onOpenChange={(o) => !o && setConfirmErase(null)} title="Erase this customer?" description="This cannot be undone."
        footer={<><button className={btnSecondary} onClick={() => setConfirmErase(null)}>Cancel</button><button className={`${btnPrimary} bg-red-700 hover:bg-red-800`} disabled={pending} onClick={() => run(() => eraseCustomerAction(confirmErase!), "Customer data erased")}>Erase permanently</button></>}>
        <p className="text-sm">The account, saved address, WhatsApp chat history and subscriptions, notes and price alerts are deleted. Order records and invoices are kept for GST and are never used for marketing.</p>
      </SidePanel>

      <SidePanel open={!!form} onOpenChange={(o) => !o && setForm(null)} title="Log a privacy request" description="For requests that came by email, phone or in the shop."
        footer={<><button className={btnSecondary} onClick={() => setForm(null)}>Cancel</button><button className={btnPrimary} disabled={pending} onClick={() => run(() => createPrivacyRequestAction(form!), "Request logged")}>Save</button></>}>
        {form && (
          <div className="space-y-3">
            <Field label="Request">
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                {Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Phone"><input className={inputCls} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            </div>
            <Field label="Details"><textarea className={`${inputCls} h-20 py-2`} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></Field>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
