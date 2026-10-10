"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck, Download, Trash2 } from "lucide-react";
import { downloadMyDataAction, requestAccountDeletionAction, updateMarketingChoicesAction } from "@/app/actions/privacy";

export function PrivacyCard({ initial }: { initial: { whatsappOffers: boolean; emailOffers: boolean; hasPhone: boolean; deletionRequestedAt: string | null } }) {
  const [pending, start] = useTransition();
  const [wa, setWa] = useState(initial.whatsappOffers);
  const [em, setEm] = useState(initial.emailOffers);
  const [asked, setAsked] = useState(!!initial.deletionRequestedAt);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const saveChoices = (next: { whatsappOffers: boolean; emailOffers: boolean }) =>
    start(async () => {
      const res = await updateMarketingChoicesAction(next);
      setWa(res.whatsappOffers);
      setEm(next.emailOffers);
      toast.success("Your choices are saved");
    });

  const download = () =>
    start(async () => {
      const json = await downloadMyDataAction();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      a.download = "my-spicy-nuts-data.json";
      a.click();
    });

  const requestDelete = () =>
    start(async () => {
      await requestAccountDeletionAction(reason);
      setAsked(true);
      setConfirming(false);
      toast.success("Request received. We'll delete your account within 30 days and email you.");
    });

  return (
    <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">Your data & privacy</h2>
      </div>
      <p className="text-sm text-muted-foreground">Order updates (confirmation, shipping, delivery) are always sent. Offers are only sent if you choose.</p>
      <div className="space-y-3 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={wa} disabled={pending || !initial.hasPhone} onChange={(e) => saveChoices({ whatsappOffers: e.target.checked, emailOffers: em })} />
          <span>Offers, new products and price drops on WhatsApp{!initial.hasPhone && <span className="block text-xs text-muted-foreground">Add a phone number to your account first.</span>}</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={em} disabled={pending} onChange={(e) => saveChoices({ whatsappOffers: wa, emailOffers: e.target.checked })} />
          <span>Offers by email</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <button type="button" onClick={download} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">
          <Download className="h-4 w-4" /> Download my data
        </button>
        {asked ? (
          <p className="text-sm text-muted-foreground">Account deletion requested. We'll complete it and email you.</p>
        ) : !confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        ) : (
          <div className="w-full space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
            <p className="font-semibold text-red-800">Delete your account?</p>
            <p className="text-red-900/80">We'll remove your account, saved address, points and marketing choices. Invoices for past orders are kept for 6 years because GST law requires it, and are never used for marketing.</p>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="h-10 w-full rounded-lg border border-red-200 bg-white px-3" />
            <div className="flex gap-2">
              <button type="button" onClick={requestDelete} disabled={pending} className="h-10 rounded-full bg-red-700 px-4 font-semibold text-white">Yes, delete my account</button>
              <button type="button" onClick={() => setConfirming(false)} className="h-10 rounded-full border border-border bg-white px-4 font-semibold">Keep it</button>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Questions or a complaint? Email spicynuts1973@gmail.com. We answer within 30 days. <a href="/privacy-policy" className="underline">Privacy Policy</a></p>
    </section>
  );
}
