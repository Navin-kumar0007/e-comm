"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, KeyRound, Copy, RotateCcw } from "lucide-react";
import { confirmTwoStepAction, disableTwoStepAction, newBackupCodesAction, resetStaffTwoStepAction, startTwoStepSetupAction } from "@/app/actions/admin-security";
import { PageHeader, Panel, Field, StatusPill, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, dateFmt } from "@/components/admin/ui";

export function SecurityClient({ status }: { status: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [setup, setSetup] = useState<{ secret: string; url: string } | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [offCode, setOffCode] = useState("");
  const on = !!status.me.enabledAt;

  const begin = () => start(async () => { setSetup(await startTwoStepSetupAction()); setCode(""); });
  const confirm = () => start(async () => {
    const res = await confirmTwoStepAction(code);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    setCodes(res.backupCodes ?? null);
    setSetup(null);
    toast.success("Two-step login is on");
    router.refresh();
  });
  const turnOff = () => start(async () => {
    const res = await disableTwoStepAction(offCode);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    setOffCode("");
    toast.success("Two-step login is off");
    router.refresh();
  });
  const regen = () => start(async () => {
    const res = await newBackupCodesAction(offCode);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    setCodes(res.backupCodes ?? null);
    setOffCode("");
    router.refresh();
  });
  const reset = (id: string, email: string) => start(async () => {
    const res = await resetStaffTwoStepAction(id);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success(`Two-step login reset for ${email}`);
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Login security" subtitle="Two-step login asks for a code from your phone after the password, so a stolen password alone can't open the admin." />

      {codes && (
        <Panel title={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-[#c9a45a]" /> Your backup codes</span>} className="border-[#c9a45a]">
          <div className="space-y-3 p-4">
            <p className="text-sm">Each code works once, if you lose your phone. Save them somewhere safe (not on the same phone). They won&apos;t be shown again.</p>
            <div className="grid max-w-md grid-cols-2 gap-2 font-mono text-lg">{codes.map((c) => <span key={c} className="rounded-lg bg-muted/50 px-3 py-1.5 text-center">{c}</span>)}</div>
            <div className="flex gap-2">
              <button className={btnSecondary} onClick={() => { navigator.clipboard.writeText(codes.join("\n")); toast.success("Copied"); }}><Copy className="h-4 w-4" /> Copy</button>
              <button className={btnPrimary} onClick={() => setCodes(null)}>I&apos;ve saved them</button>
            </div>
          </div>
        </Panel>
      )}

      <Panel title={<span className="flex items-center gap-2">{on ? <ShieldCheck className="h-4 w-4 text-emerald-700" /> : <ShieldOff className="h-4 w-4 text-amber-700" />} Your two-step login</span>}
        action={<StatusPill status={on ? "OK" : "SOON"} label={on ? `On since ${dateFmt(status.me.enabledAt)}` : "Off"} />}>
        <div className="space-y-4 p-4">
          {!on && !setup && (
            <>
              <p className="text-sm text-muted-foreground">You need an authenticator app on your phone: Google Authenticator or Microsoft Authenticator (free).</p>
              <button className={btnPrimary} disabled={pending} onClick={begin}><ShieldCheck className="h-4 w-4" /> Turn on two-step login</button>
            </>
          )}
          {setup && (
            <div className="flex flex-wrap gap-6">
              <div className="rounded-xl border border-border bg-white p-3"><QRCode value={setup.url} size={168} /></div>
              <div className="max-w-sm space-y-3 text-sm">
                <ol className="list-decimal space-y-1 pl-5">
                  <li>In the app, tap <b>+</b> and <b>Scan a QR code</b>.</li>
                  <li>Scan this code. &quot;Spicy Nuts Admin&quot; appears with a 6-digit number.</li>
                  <li>Type that number below.</li>
                </ol>
                <p className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key: <span className="select-all break-all font-mono text-foreground">{setup.secret}</span></p>
                <Field label="6-digit code">
                  <div className="flex gap-2">
                    <input className={`${inputCls} w-32 font-mono tracking-widest`} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                    <button className={btnPrimary} disabled={pending || code.length !== 6} onClick={confirm}>Confirm</button>
                    <button className={btnSecondary} onClick={() => setSetup(null)}>Cancel</button>
                  </div>
                </Field>
              </div>
            </div>
          )}
          {on && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Each browser asks for a code once every 12 hours. Backup codes left: <b className="text-foreground">{status.me.backupLeft}</b>.</p>
              <Field label="Code from your app (to change settings)">
                <div className="flex flex-wrap gap-2">
                  <input className={`${inputCls} w-36 font-mono tracking-widest`} maxLength={9} value={offCode} onChange={(e) => setOffCode(e.target.value.toUpperCase())} placeholder="123456" />
                  <button className={btnSecondary} disabled={pending || offCode.length < 6} onClick={regen}><RotateCcw className="h-4 w-4" /> New backup codes</button>
                  <button className={`${btnSecondary} text-red-700`} disabled={pending || offCode.length < 6} onClick={turnOff}><ShieldOff className="h-4 w-4" /> Turn off</button>
                </div>
              </Field>
            </div>
          )}
        </div>
      </Panel>

      {status.canManage && (
        <Panel title="Staff">
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr><th className={thCls}>Name</th><th className={thCls}>Role</th><th className={thCls}>Two-step login</th><th className={thCls}></th></tr></thead>
            <tbody className="divide-y divide-border/60">
              {status.staff.map((s: any) => (
                <tr key={s.id}>
                  <td className={tdCls}><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></td>
                  <td className={tdCls}>{s.roleName}</td>
                  <td className={tdCls}><StatusPill status={s.totpEnabledAt ? "OK" : "SOON"} label={s.totpEnabledAt ? "On" : "Off"} /></td>
                  <td className={`${tdCls} text-right`}>{s.totpEnabledAt && s.id !== status.me.id && <button className={btnGhost} disabled={pending} onClick={() => reset(s.id, s.email)}>Reset (lost phone)</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">Ask every staff member who handles money or customer data to turn it on from this page.</p>
        </Panel>
      )}
    </div>
  );
}
