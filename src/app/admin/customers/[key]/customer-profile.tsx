"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Trash2, ShieldCheck, Building2, StickyNote } from "lucide-react";
import { addCustomerNoteAction, deleteCustomerNoteAction } from "@/app/actions/admin-customers";
import { PageHeader, Panel, Stat, StatusPill, inputCls, btnPrimary, btnSecondary, thCls, tdCls, inr, dateFmt } from "@/components/admin/ui";

const PURPOSE: Record<string, string> = { TERMS: "Privacy notice & terms", WHATSAPP_OFFERS: "WhatsApp offers", EMAIL_OFFERS: "Email offers", ANALYTICS: "Analytics cookies" };
const CHANNEL: Record<string, string> = { WEBSITE: "Website", SHOP: "Shop", PHONE: "Phone", WHOLESALE: "Wholesale" };
const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function CustomerProfile({ p, canPrivacy }: { p: any; canPrivacy: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const u = p.user;
  const s = p.stats;

  const addNote = () => start(async () => {
    const res = await addCustomerNoteAction(p.key, note);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    setNote("");
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Customers</Link>
      <PageHeader
        title={u?.businessName || p.name}
        subtitle={<span className="flex flex-wrap items-center gap-2">
          {u?.businessName && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{p.name}</span>}
          {u ? <StatusPill status="OK" label={`Account since ${dateFmt(u.createdAt)}`} /> : <StatusPill status="NONE" label="Guest (no account)" />}
          {u?.customerType === "WHOLESALE" && <StatusPill status="PARTIAL" label={`Wholesale${u.wholesaleDiscount ? ` · ${u.wholesaleDiscount}% off` : ""}`} />}
          {s.rto > 0 && <StatusPill status="CANCELLED" label={`${s.rto} returned undelivered`} />}
        </span>}
        actions={<>
          {p.phone && <a href={`tel:+91${p.phone}`} className={btnSecondary}><Phone className="h-4 w-4" /> Call</a>}
          {p.phone && <a href={`https://wa.me/91${p.phone}`} target="_blank" rel="noreferrer" className={btnSecondary}><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          {p.email && <a href={`mailto:${p.email}`} className={btnSecondary}><Mail className="h-4 w-4" /> Email</a>}
          {u?.customerType === "WHOLESALE" && <Link href={`/admin/orders/new?customer=${u.id}`} className={btnPrimary}>New order</Link>}
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Orders" value={s.orders} hint={s.cod ? `${s.cod} cash on delivery` : undefined} />
        <Stat label="Spent" value={inr(s.spend)} />
        <Stat label="Average order" value={inr(s.aov)} />
        <Stat label="Customer since" value={s.first ? dateFmt(s.first) : "—"} hint={s.last ? `Last order ${dateFmt(s.last)}` : undefined} />
        <Stat label="Problems" value={s.rto + s.cancelled + s.returns} hint={`${s.rto} RTO · ${s.cancelled} cancelled · ${s.returns} returns`} tone={s.rto ? "bad" : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title={`Orders (${p.orders.length})`} className="xl:col-span-2">
          {p.orders.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No orders yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Order</th><th className={thCls}>Date</th><th className={thCls}>Items</th><th className={thCls}>Status</th><th className={`${thCls} text-right`}>Total</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {p.orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-muted/20">
                      <td className={tdCls}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-[#6E1A2C] hover:underline">NW-{o.id.slice(-8).toUpperCase()}</Link><p className="text-[11px] text-muted-foreground">{CHANNEL[o.channel] ?? o.channel} · {o.paymentMethod}</p></td>
                      <td className={`${tdCls} whitespace-nowrap`}>{dateFmt(o.createdAt)}</td>
                      <td className={`${tdCls} max-w-[260px]`}><p className="truncate text-xs">{o.items.map((i: any) => `${i.productName} ${i.weight}×${i.quantity}`).join(", ")}</p></td>
                      <td className={tdCls}><StatusPill status={o.status === "DELIVERED" ? "RECEIVED" : o.status === "CANCELLED" || o.status === "RTO" ? "CANCELLED" : "ORDERED"} label={o.status.charAt(0) + o.status.slice(1).toLowerCase()} /></td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(o.total, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-[#c9a45a]" /> Staff notes</span>}>
            <div className="space-y-3 p-4">
              <div className="flex gap-2">
                <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Prefers Saturday delivery" onKeyDown={(e) => { if (e.key === "Enter" && note.trim()) addNote(); }} />
                <button className={btnPrimary} disabled={pending || !note.trim()} onClick={addNote}>Add</button>
              </div>
              {p.notes.length === 0 ? <p className="text-xs text-muted-foreground">No notes yet. Only staff see these.</p> : (
                <ul className="space-y-2">
                  {p.notes.map((n: any) => (
                    <li key={n.id} className="group rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <p>{n.note}</p>
                      <p className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">{n.createdBy.split(":").pop()} · {when(n.createdAt)}
                        <button aria-label="Delete note" className="opacity-0 group-hover:opacity-100" onClick={() => start(async () => { await deleteCustomerNoteAction(n.id, p.key); router.refresh(); })}><Trash2 className="h-3.5 w-3.5" /></button></p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel title="Addresses used">
            {p.addresses.length === 0 ? <p className="p-4 text-sm text-muted-foreground">None.</p> : (
              <ul className="divide-y divide-border/60 text-sm">{p.addresses.map((a: string) => <li key={a} className="flex gap-2 px-4 py-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{a}</li>)}</ul>
            )}
            {u?.gstin && <p className="border-t border-border/60 px-4 py-2 font-mono text-xs">GSTIN {u.gstin}</p>}
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#c9a45a]" /> Consent & privacy</span>}>
            <div className="space-y-2 p-4 text-sm">
              {u && (
                <div className="flex flex-wrap gap-1.5">
                  <StatusPill status={u.whatsappOptIn ? "OK" : "NONE"} label={`WhatsApp offers: ${u.whatsappOptIn ? "yes" : "no"}`} />
                  <StatusPill status={u.emailOptIn ? "OK" : "NONE"} label={`Email offers: ${u.emailOptIn ? "yes" : "no"}`} />
                  {u.termsAcceptedAt ? <StatusPill status="OK" label={`Terms ${dateFmt(u.termsAcceptedAt)}`} /> : <StatusPill status="SOON" label="Signed up before consent notice" />}
                </div>
              )}
              {p.consents.length > 0 && (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {p.consents.slice(0, 8).map((c: any) => <li key={c.id}>{when(c.createdAt)} · {PURPOSE[c.purpose] ?? c.purpose}: <b className={c.granted ? "text-emerald-700" : "text-red-700"}>{c.granted ? "yes" : "no"}</b> ({c.source.toLowerCase()})</li>)}
                </ul>
              )}
              {p.requests.length > 0 && <p className="text-xs">Privacy requests: {p.requests.map((r: any) => `${r.type.toLowerCase()} (${r.status.toLowerCase()})`).join(", ")} {canPrivacy && <Link href="/admin/privacy" className="font-semibold text-[#6E1A2C] underline">Open</Link>}</p>}
              {!u && p.consents.length === 0 && <p className="text-xs text-muted-foreground">Guest: details are used only for their orders.</p>}
            </div>
          </Panel>

          {p.chats.length > 0 && (
            <Panel title="WhatsApp" action={p.phone ? <Link href={`/admin/inbox?phone=${p.phone}`} className="text-xs font-semibold text-[#6E1A2C] hover:underline">Open chat</Link> : undefined}>
              <ul className="max-h-72 space-y-1.5 overflow-y-auto p-3 text-xs">
                {p.chats.slice(0, 15).map((m: any) => (
                  <li key={m.id} className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${m.type === "INBOUND" ? "bg-muted" : "ml-auto bg-[#fbf6ee]"}`}>
                    <p className="line-clamp-3 whitespace-pre-line">{m.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{when(m.createdAt)}{m.type !== "INBOUND" ? ` · ${m.status.toLowerCase()}` : ""}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
