"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { getWhatsAppTemplateStatusAction } from "@/app/actions/whatsapp-actions";

type Status = Awaited<ReturnType<typeof getWhatsAppTemplateStatusAction>>;

export function TemplateStatus() {
  const [data, setData] = useState<Status | null>(null);
  useEffect(() => {
    getWhatsAppTemplateStatusAction().then(setData).catch(() => {});
  }, []);
  if (!data) return null;

  const missing = data.templates.filter((t) => !t.configuredAs).length;
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-heading font-bold">Message templates (Meta approval)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data.provider === "META"
            ? missing
              ? `${missing} template(s) not set up. Until they are, those messages only reach customers who messaged you in the last 24 hours.`
              : "All templates are set up."
            : data.provider === "TWILIO"
            ? "Using Twilio — templates are managed in Twilio Content Builder."
            : "WhatsApp isn't connected yet — messages are only logged (simulated)."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Submit each body exactly as shown in Meta Business Manager → WhatsApp Manager → Message templates (language: English), then set the approved name in the environment variable shown.
        </p>
      </div>
      <div className="divide-y divide-border/50">
        {data.templates.map((t) => (
          <div key={t.key} className="py-3 text-sm space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {t.configuredAs ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
              <span className="font-medium">{t.key}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.category}</span>
              <code className="text-[11px] text-muted-foreground">{t.env}{t.configuredAs ? ` = ${t.configuredAs}` : ""}</code>
            </div>
            <div className="flex items-start gap-2">
              <p className="flex-1 text-muted-foreground font-mono text-xs bg-muted/40 rounded-lg p-2">{t.body}</p>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Copied"); }}
                className="p-2 rounded-lg hover:bg-muted"
                aria-label="Copy template text"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Sample values: {t.example.join(" | ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
