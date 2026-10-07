"use client";

// Small building blocks shared by the admin pages, in the admin's maroon-and-gold look.

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

import { inr, qtyFmt, dateFmt, isoDay, inputCls, btnPrimary, btnSecondary, btnGhost, cardCls, thCls, tdCls } from "./format";
export { inr, qtyFmt, dateFmt, isoDay, inputCls, btnPrimary, btnSecondary, btnGhost, cardCls, thCls, tdCls };

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[26px] font-semibold leading-tight tracking-tight text-[#2a0a12]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "warn" | "bad" | "good" }) {
  const color = tone === "bad" ? "text-red-700" : tone === "warn" ? "text-amber-700" : tone === "good" ? "text-emerald-700" : "text-[#2a0a12]";
  return (
    <div className={`${cardCls} p-4`}>
      <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${cardCls} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#2a0a12]">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-[12px] font-semibold text-foreground/80">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

const PILL: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ORDERED: "bg-blue-50 text-blue-700",
  PARTIAL: "bg-amber-50 text-amber-800",
  RECEIVED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  OPEN: "bg-blue-50 text-blue-700",
  POSTED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-red-100 text-red-800",
  SOON: "bg-amber-100 text-amber-800",
  OK: "bg-emerald-50 text-emerald-700",
  NONE: "bg-slate-100 text-slate-600",
  OUT: "bg-red-100 text-red-800",
  REORDER: "bg-amber-100 text-amber-800",
};
const PILL_LABEL: Record<string, string> = {
  PARTIAL: "Part received", SOON: "Expiring soon", NONE: "No expiry", OK: "Fresh", OUT: "Out of stock", REORDER: "Reorder",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${PILL[status] ?? "bg-slate-100 text-slate-700"}`}>
      {label ?? PILL_LABEL[status] ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function SidePanel({ open, onOpenChange, title, description, children, footer, wide }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`w-full gap-0 p-0 ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="font-serif text-lg text-[#2a0a12]">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="text-[#c9a45a]">{icon}</div>}
      <p className="font-semibold text-[#2a0a12]">{title}</p>
      {children && <div className="max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
