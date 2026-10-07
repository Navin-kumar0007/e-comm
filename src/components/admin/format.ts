// Formatters and class names shared by admin pages. No "use client": safe for server and client components.

export const inr = (n: number, digits = 0) => {
  const v = Number.isFinite(n) ? n : 0;
  const s = Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${v < 0 && Number(s.replace(/,/g, "")) !== 0 ? "−" : ""}₹${s}`;
};
export const qtyFmt = (n: number, unit?: string) =>
  `${Number(n.toFixed(3)).toLocaleString("en-IN")}${unit ? ` ${unit}` : ""}`;
export const dateFmt = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";
export const isoDay = (d: Date = new Date()) => new Date(d.getTime() + 5.5 * 36e5).toISOString().slice(0, 10);

export const inputCls = "h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-[#6E1A2C] focus:ring-2 focus:ring-[#6E1A2C]/10 disabled:opacity-50";
export const btnPrimary = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#6E1A2C] px-3.5 text-[13px] font-semibold text-white hover:bg-[#5a1424] disabled:opacity-40";
export const btnSecondary = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[13px] font-medium hover:bg-muted disabled:opacity-40";
export const btnGhost = "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-[#6E1A2C] hover:bg-[#6E1A2C]/5 disabled:opacity-40";
export const cardCls = "rounded-xl border border-border/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
export const thCls = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
export const tdCls = "px-3 py-2.5 align-top";
