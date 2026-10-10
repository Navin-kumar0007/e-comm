"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, Phone, User, Clock } from "lucide-react";
import { getConversations, getThread, sendReplyAction } from "@/app/actions/admin-inbox";
import { PageHeader, Panel, Empty, inputCls, btnPrimary, btnSecondary, inr } from "@/components/admin/ui";

const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function InboxClient({ initial, initialPhone }: { initial: any[]; initialPhone: string | null }) {
  const [convos, setConvos] = useState(initial);
  const [phone, setPhone] = useState<string | null>(initialPhone);
  const [thread, setThread] = useState<any | null>(null);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async (p: string) => {
    const t = await getThread(p);
    setThread(t);
    setConvos((cs) => cs.map((c) => (c.phone === p ? { ...c, unread: 0 } : c)));
    setTimeout(() => bottom.current?.scrollIntoView({ block: "end" }), 50);
  }, []);

  useEffect(() => { if (phone) load(phone); }, [phone, load]);
  // New messages arrive through the webhook; check every 20 s while the page is open.
  useEffect(() => {
    const t = setInterval(async () => {
      setConvos(await getConversations());
      if (phone) { const th = await getThread(phone); setThread(th); }
    }, 20000);
    return () => clearInterval(t);
  }, [phone]);

  const current = convos.find((c) => c.phone === phone);
  const send = () => start(async () => {
    const res = await sendReplyAction(phone!, text);
    if ("error" in res) { toast.error(res.error); return; }
    setText("");
    await load(phone!);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp inbox" subtitle="Messages customers send to 85500 07073, and your replies. Free replies are allowed for 24 hours after the customer's last message." />
      {convos.length === 0 ? (
        <Panel><Empty icon={<MessageCircle className="h-8 w-8" />} title="No messages yet">When customers message your WhatsApp number, their messages appear here.</Empty></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Panel className="lg:max-h-[72vh] lg:overflow-y-auto">
            <ul className="divide-y divide-border/60">
              {convos.map((c) => (
                <li key={c.phone}>
                  <button onClick={() => setPhone(c.phone)} className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left ${c.phone === phone ? "bg-[#fbf6ee]" : "hover:bg-muted/30"}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{c.name ?? `+91 ${c.phone}`}</span>
                      {c.unread > 0 && <span className="rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{c.last}</span>
                    <span className="text-[10px] text-muted-foreground">{when(c.at)}{c.canReply ? "" : " · reply window closed"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title={current ? <span className="flex items-center gap-2"><User className="h-4 w-4 text-[#c9a45a]" />{current.name ?? "Customer"} <span className="font-normal text-muted-foreground">+91 {current.phone}</span></span> : "Choose a chat"}
            action={current ? <div className="flex gap-2">
              <a href={`tel:+91${current.phone}`} className={btnSecondary}><Phone className="h-4 w-4" /> Call</a>
              <Link href={`/admin/customers/${current.phone}`} className={btnSecondary}>Profile</Link>
            </div> : undefined}
          >
            {thread && (
              <div className="flex h-[60vh] flex-col">
                {thread.orders.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-2 text-xs">
                    {thread.orders.map((o: any) => (
                      <Link key={o.id} href={`/admin/orders/${o.id}`} className="rounded-full bg-muted px-2.5 py-1 hover:bg-muted/70">
                        NW-{o.id.slice(-8).toUpperCase()} · {o.status.toLowerCase()} · {inr(o.total)}{o.codStatus === "PENDING" ? " · COD not confirmed" : ""}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="flex-1 space-y-2 overflow-y-auto bg-[#f6f3ee] p-4">
                  {thread.messages.map((m: any) => {
                    const mine = m.type !== "INBOUND";
                    return (
                      <div key={m.id} className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm ${mine ? "ml-auto bg-[#dcf8c6]" : "bg-white"}`}>
                        <p className="whitespace-pre-line break-words">{m.message}</p>
                        <p className="mt-1 text-right text-[10px] text-muted-foreground">{when(m.createdAt)}{mine ? ` · ${m.type === "REPLY" ? "reply" : m.type.toLowerCase().replace("_", " ")} · ${m.status.toLowerCase()}` : ""}</p>
                      </div>
                    );
                  })}
                  <div ref={bottom} />
                </div>
                <div className="flex gap-2 border-t border-border/60 p-3">
                  {thread.canReply ? (<>
                    <textarea className={`${inputCls} h-12 py-2`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a reply…" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); send(); } }} />
                    <button className={`${btnPrimary} h-12`} disabled={pending || !text.trim()} onClick={send}><Send className="h-4 w-4" /> Send</button>
                  </>) : (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-4 w-4" /> More than 24 hours since their last message, so WhatsApp doesn't allow a free reply. Call them, or they can message again.</p>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
