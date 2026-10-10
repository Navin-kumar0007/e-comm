"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Megaphone, Sparkles, Image as ImageIcon, LayoutList, MessageCircle, Phone, Search, FileText, History, ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2, Upload, RotateCcw, ExternalLink,
} from "lucide-react";
import { resetContentAction, restoreContentVersionAction, saveContentAction } from "@/app/actions/admin-content";
import { HOME_SECTIONS, type ContentKey } from "@/lib/site-content-shared";
import { PageHeader, Panel, Field, inputCls, btnPrimary, btnSecondary, btnGhost } from "@/components/admin/ui";

const TABS: Array<{ key: ContentKey | "history"; label: string; icon: any; page: string }> = [
  { key: "announcement", label: "Announcement bar", icon: Megaphone, page: "/" },
  { key: "hero", label: "Home page hero", icon: Sparkles, page: "/" },
  { key: "banners", label: "Offer banners", icon: ImageIcon, page: "/" },
  { key: "sections", label: "Home page sections", icon: LayoutList, page: "/" },
  { key: "popup", label: "WhatsApp popup", icon: MessageCircle, page: "/" },
  { key: "contact", label: "Contact & social", icon: Phone, page: "/" },
  { key: "seo", label: "Google search (SEO)", icon: Search, page: "/" },
  { key: "policies", label: "Policy pages", icon: FileText, page: "/privacy-policy" },
  { key: "history", label: "History", icon: History, page: "/" },
];
const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function WebsiteEditor({ data, initialTab }: { data: any; initialTab?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<string>(TABS.some((t) => t.key === initialTab) ? initialTab! : "announcement");
  const [values, setValues] = useState<Record<string, any>>(data.values);
  const [policy, setPolicy] = useState<"privacy" | "terms" | "shipping" | "returns">("privacy");
  const [uploading, setUploading] = useState<string | null>(null);
  const v = values[tab];
  const set = (patch: any) => setValues((all) => ({ ...all, [tab]: Array.isArray(all[tab]) ? patch : { ...all[tab], ...patch } }));
  const meta = TABS.find((t) => t.key === tab)!;
  const updated = data.updated.find((u: any) => u.key === tab);

  const save = () => start(async () => {
    const res = await saveContentAction(tab as ContentKey, values[tab]);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    setValues((all) => ({ ...all, [tab]: (res as any).value }));
    toast.success("Saved. It's live on the website now.");
    router.refresh();
  });
  const reset = () => start(async () => {
    if (!window.confirm("Put this back to how the website was built? You can undo it from History.")) return;
    await resetContentAction(tab as ContentKey);
    toast.success("Back to default");
    window.location.reload();
  });

  const upload = async (file: File, field: "image" | "mobileImage", index: number) => {
    setUploading(`${index}-${field}`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed");
      set(values.banners.map((b: any, i: number) => (i === index ? { ...b, [field]: json.url } : b)));
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Website editor" subtitle="Change offers, banners and text on the shop without code. Saving makes it live immediately; every version is kept so you can undo." />
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <Panel className="h-fit">
          <nav className="p-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium ${tab === t.key ? "bg-[#6E1A2C] text-white" : "text-foreground/80 hover:bg-muted"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
        </Panel>

        {tab === "history" ? (
          <Panel title="Saved versions">
            {data.versions.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nothing saved yet.</p> : (
              <ul className="divide-y divide-border/60 text-sm">
                {data.versions.map((h: any) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span><b>{TABS.find((t) => t.key === h.key)?.label ?? h.key}</b> <span className="text-muted-foreground">· {h.createdBy.split(":").pop()} · {when(h.createdAt)}</span></span>
                    <button className={btnGhost} disabled={pending} onClick={() => start(async () => { const r = await restoreContentVersionAction(h.id); if ("error" in r && r.error) toast.error(r.error); else { toast.success("Restored"); window.location.reload(); } })}><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : (
          <Panel
            title={meta.label}
            action={<div className="flex items-center gap-2">
              {updated && <span className="hidden text-xs text-muted-foreground sm:inline">Last saved {when(updated.at)}</span>}
              <a href={tab === "policies" ? `/${policy === "privacy" ? "privacy-policy" : policy === "shipping" ? "shipping-policy" : policy}` : meta.page} target="_blank" rel="noreferrer" className={btnSecondary}><ExternalLink className="h-4 w-4" /> View</a>
            </div>}
          >
            <div className="space-y-5 p-5">
              {tab === "announcement" && (<>
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-[#6E1A2C]" checked={v.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Show the bar</label>
                <div className="space-y-3">
                  {v.messages.map((m: any, i: number) => (
                    <div key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_140px_100px_auto]">
                      <input className={inputCls} value={m.text} maxLength={80} placeholder="e.g. DIWALI SALE · 20% OFF" onChange={(e) => set({ messages: v.messages.map((x: any, j: number) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                      <input className={inputCls} value={m.link ?? ""} placeholder="Link, e.g. /shop" onChange={(e) => set({ messages: v.messages.map((x: any, j: number) => (j === i ? { ...x, link: e.target.value } : x)) })} />
                      <input className={inputCls} value={m.linkText ?? ""} placeholder="Link text" maxLength={20} onChange={(e) => set({ messages: v.messages.map((x: any, j: number) => (j === i ? { ...x, linkText: e.target.value } : x)) })} />
                      <button aria-label="Remove message" className="rounded p-2 text-muted-foreground hover:bg-red-50 hover:text-red-700" onClick={() => set({ messages: v.messages.filter((_: any, j: number) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {v.messages.length < 5 && <button className={btnGhost} onClick={() => set({ messages: [...v.messages, { text: "" }] })}><Plus className="h-3.5 w-3.5" /> Add message</button>}
                </div>
                <p className="text-xs text-muted-foreground">Computers show every message. Phones show one: the first message that has a link, otherwise the first.</p>
                <div className="overflow-hidden rounded-xl bg-[#3a0d18] px-4 py-2 text-center text-xs font-semibold tracking-wide text-[#e9c987]">
                  {v.enabled ? v.messages.filter((m: any) => m.text).map((m: any) => `${m.text}${m.link ? ` ${m.linkText || "Shop"}` : ""}`).join("   |   ") : "Bar is hidden"}
                </div>
              </>)}

              {tab === "hero" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Small line above the title"><input className={inputCls} value={v.eyebrow} maxLength={60} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
                  <Field label="Title" hint="On computers it splits onto two lines before the last word"><input className={inputCls} value={v.title} maxLength={60} onChange={(e) => set({ title: e.target.value })} /></Field>
                  <Field label="Text under the title" className="sm:col-span-2"><textarea className={`${inputCls} h-20 py-2`} value={v.subtitle} maxLength={240} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
                  <Field label="Main button text"><input className={inputCls} value={v.primaryText} maxLength={30} onChange={(e) => set({ primaryText: e.target.value })} /></Field>
                  <Field label="Main button link"><input className={inputCls} value={v.primaryLink} onChange={(e) => set({ primaryLink: e.target.value })} placeholder="/shop or /category/dates" /></Field>
                  <Field label="Second button text"><input className={inputCls} value={v.secondaryText} maxLength={30} onChange={(e) => set({ secondaryText: e.target.value })} /></Field>
                  <Field label="Second button link"><input className={inputCls} value={v.secondaryLink} onChange={(e) => set({ secondaryLink: e.target.value })} /></Field>
                  <div className="jaali rounded-2xl p-6 text-white sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e9c987]">{v.eyebrow}</p>
                    <p className="mt-1 font-serif text-4xl font-bold">{v.title}</p>
                    <p className="mt-2 max-w-md text-sm text-white/85">{v.subtitle}</p>
                    <div className="mt-3 flex gap-2"><span className="rounded-lg bg-[#c9a45a] px-4 py-2 text-sm font-bold text-[#2a0a12]">{v.primaryText}</span><span className="rounded-lg border border-[#c9a45a] px-4 py-2 text-sm font-bold">{v.secondaryText}</span></div>
                  </div>
                </div>
              )}

              {tab === "banners" && (<>
                <p className="text-sm text-muted-foreground">Banners show under the hero on the home page. Wide images work best (about 1600 × 500 px); add a taller one for phones (about 800 × 600 px). Set dates and a banner switches itself on and off.</p>
                {v.map((b: any, i: number) => (
                  <div key={b.id ?? i} className="space-y-3 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-[#6E1A2C]" checked={b.enabled} onChange={(e) => set(v.map((x: any, j: number) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> Show</label>
                      <div className="flex gap-1">
                        <button aria-label="Move up" className={btnGhost} disabled={i === 0} onClick={() => { const n = [...v]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(n); }}><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button aria-label="Move down" className={btnGhost} disabled={i === v.length - 1} onClick={() => { const n = [...v]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set(n); }}><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button aria-label="Remove banner" className={btnGhost} onClick={() => set(v.filter((_: any, j: number) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["image", "mobileImage"] as const).map((f) => (
                        <div key={f} className="space-y-1.5">
                          <span className="text-[12px] font-semibold text-foreground/80">{f === "image" ? "Image (computer)" : "Image for phones (optional)"}</span>
                          {b[f] ? <img src={b[f]} alt="" className="h-28 w-full rounded-lg border border-border object-cover" /> : <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">No image</div>}
                          <label className={`${btnSecondary} cursor-pointer`}><Upload className="h-4 w-4" /> {uploading === `${i}-${f}` ? "Uploading…" : b[f] ? "Replace" : "Upload"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], f, i)} />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Link when tapped"><input className={inputCls} value={b.link ?? ""} placeholder="/shop or /product/badam-almonds" onChange={(e) => set(v.map((x: any, j: number) => (j === i ? { ...x, link: e.target.value } : x)))} /></Field>
                      <Field label="Description (for screen readers and Google)"><input className={inputCls} value={b.alt} onChange={(e) => set(v.map((x: any, j: number) => (j === i ? { ...x, alt: e.target.value } : x)))} /></Field>
                      <Field label="Show from (optional)"><input type="datetime-local" className={inputCls} value={b.startsAt ?? ""} onChange={(e) => set(v.map((x: any, j: number) => (j === i ? { ...x, startsAt: e.target.value } : x)))} /></Field>
                      <Field label="Hide after (optional)"><input type="datetime-local" className={inputCls} value={b.endsAt ?? ""} onChange={(e) => set(v.map((x: any, j: number) => (j === i ? { ...x, endsAt: e.target.value } : x)))} /></Field>
                    </div>
                  </div>
                ))}
                {v.length < 8 && <button className={btnSecondary} onClick={() => set([...v, { id: `b${Date.now()}`, image: "", alt: "", enabled: true }])}><Plus className="h-4 w-4" /> Add banner</button>}
              </>)}

              {tab === "sections" && (<>
                <p className="text-sm text-muted-foreground">Order the blocks on the home page, or hide one. The hero is always first.</p>
                <ul className="space-y-2">
                  {v.order.map((k: string, i: number) => {
                    const hidden = v.hidden.includes(k);
                    return (
                      <li key={k} className={`flex items-center justify-between rounded-xl border border-border px-4 py-2.5 ${hidden ? "opacity-50" : ""}`}>
                        <span className="text-sm font-medium">{HOME_SECTIONS.find((s) => s.key === k)?.label ?? k}</span>
                        <span className="flex gap-1">
                          <button aria-label="Move up" className={btnGhost} disabled={i === 0} onClick={() => { const n = [...v.order]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set({ order: n }); }}><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button aria-label="Move down" className={btnGhost} disabled={i === v.order.length - 1} onClick={() => { const n = [...v.order]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set({ order: n }); }}><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button className={btnGhost} onClick={() => set({ hidden: hidden ? v.hidden.filter((x: string) => x !== k) : [...v.hidden, k] })}>{hidden ? <><Eye className="h-3.5 w-3.5" /> Show</> : <><EyeOff className="h-3.5 w-3.5" /> Hide</>}</button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>)}

              {tab === "popup" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-[#6E1A2C]" checked={v.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Show the WhatsApp offer popup to new visitors</label>
                  <Field label="Heading"><input className={inputCls} value={v.title} maxLength={60} onChange={(e) => set({ title: e.target.value })} /></Field>
                  <Field label="Show after (seconds)" hint="Later is less annoying; 8–15 s works well"><input type="number" min={2} max={120} className={inputCls} value={v.delaySeconds} onChange={(e) => set({ delaySeconds: Number(e.target.value) })} /></Field>
                  <Field label="Text" className="sm:col-span-2"><input className={inputCls} value={v.text} maxLength={160} onChange={(e) => set({ text: e.target.value })} /></Field>
                  <p className="text-xs text-muted-foreground sm:col-span-2">The welcome code itself (ROYAL10) is sent by the approved WhatsApp template. Each visitor sees the popup once.</p>
                </div>
              )}

              {tab === "contact" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone shown on the site"><input className={inputCls} value={v.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
                  <Field label="Email shown on the site"><input className={inputCls} value={v.email} onChange={(e) => set({ email: e.target.value })} /></Field>
                  <Field label="Shop address (footer)" className="sm:col-span-2"><textarea className={`${inputCls} h-16 py-2`} value={v.address} onChange={(e) => set({ address: e.target.value })} /></Field>
                  <Field label="Footer tagline" className="sm:col-span-2"><input className={inputCls} value={v.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
                  <Field label="Instagram link"><input className={inputCls} value={v.instagram} placeholder="https://instagram.com/…" onChange={(e) => set({ instagram: e.target.value })} /></Field>
                  <Field label="YouTube link"><input className={inputCls} value={v.youtube} placeholder="https://youtube.com/@…" onChange={(e) => set({ youtube: e.target.value })} /></Field>
                  <Field label="Facebook link"><input className={inputCls} value={v.facebook} placeholder="https://facebook.com/…" onChange={(e) => set({ facebook: e.target.value })} /></Field>
                  <p className="text-xs text-muted-foreground sm:col-span-2">Invoices, GST details and the WhatsApp number used for messages are set in Settings, not here.</p>
                </div>
              )}

              {tab === "seo" && (<>
                <Field label={`Home page title on Google (${v.homeTitle.length}/60 recommended)`}><input className={inputCls} value={v.homeTitle} maxLength={70} onChange={(e) => set({ homeTitle: e.target.value })} /></Field>
                <Field label={`Home page description on Google (${v.homeDescription.length}/160)`}><textarea className={`${inputCls} h-20 py-2`} value={v.homeDescription} maxLength={170} onChange={(e) => set({ homeDescription: e.target.value })} /></Field>
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-xs text-[#1a7f37]">www.spicynuts.in</p>
                  <p className="text-lg text-[#1a0dab]">{v.homeTitle}</p>
                  <p className="text-sm text-[#4d5156]">{v.homeDescription}</p>
                </div>
                <p className="text-xs text-muted-foreground">Google updates its results on its own schedule, usually within a few days.</p>
              </>)}

              {tab === "policies" && (<>
                <div className="flex flex-wrap gap-1">
                  {([["privacy", "Privacy"], ["terms", "Terms"], ["shipping", "Shipping"], ["returns", "Returns & refunds"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setPolicy(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${policy === k ? "bg-[#6E1A2C] text-white" : "bg-muted/60"}`}>{l}{v[k]?.trim() ? " ✎" : ""}</button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Leave empty to keep the built-in page. Formatting: <code># Heading</code>, <code>- bullet</code>, <code>**bold**</code>, <code>[link](/page)</code>, blank line for a new paragraph. Ask your CA or lawyer to check legal wording.</p>
                <textarea className={`${inputCls} h-[420px] py-2 font-mono text-[13px]`} value={v[policy]} onChange={(e) => set({ [policy]: e.target.value })} placeholder={"# Shipping Policy\n\nWe ship across India within 1–2 working days…"} />
              </>)}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                <button className={btnGhost} disabled={pending} onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset to default</button>
                <button className={btnPrimary} disabled={pending} onClick={save}>{pending ? "Saving…" : "Save & publish"}</button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
