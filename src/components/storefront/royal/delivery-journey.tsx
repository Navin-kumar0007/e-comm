import { Check, Clock, Package, PackageCheck, Truck, Home } from "lucide-react";

export type JourneyStep = { key: string; label: string; note?: string };

export const JOURNEY: JourneyStep[] = [
  { key: "placed", label: "Order placed" },
  { key: "packed", label: "Packed in Bidar" },
  { key: "shipped", label: "With the courier" },
  { key: "out", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];
const ICONS = [Clock, Package, Truck, PackageCheck, Home];

/**
 * The order's road from Bidar to the customer: a gold rail fills up to the current step,
 * the current step glows saffron and a small van rides on it. Horizontal from tablet up,
 * vertical on phones. `current` is the index of the step the order is on.
 */
export function DeliveryJourney({ current, steps = JOURNEY, tone = "light" }: { current: number; steps?: JourneyStep[]; tone?: "light" | "dark" }) {
  const n = steps.length, pct = n > 1 ? (Math.min(current, n - 1) / (n - 1)) * 100 : 0;
  const dark = tone === "dark";
  const idle = dark ? "border-white/30 bg-white/5 text-white/70" : "border-border bg-card text-muted-foreground";
  const label = (on: boolean, done: boolean) => (on ? (dark ? "text-white" : "text-foreground") : done ? (dark ? "text-brand-gold" : "text-primary") : dark ? "text-white/65" : "text-muted-foreground");
  return (
    <div>
      {/* tablet and up: horizontal rail */}
      <div className="relative hidden sm:block">
        <div className={`absolute left-[10%] right-[10%] top-[22px] h-[4px] rounded-full ${dark ? "bg-white/15" : "bg-muted"}`}>
          <span className="journey-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#b8893a] via-[#f6e2a8] to-[#e9c987]" style={{ width: `${pct}%` }} />
          {current < n - 1 && (
            <span className="van-glide absolute -top-[30px] -translate-x-1/2 text-primary" style={{ left: `${pct}%` }} aria-hidden="true"><Truck className="h-5 w-5" /></span>
          )}
        </div>
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => {
            const done = i < current, on = i === current, Icon = ICONS[i] ?? Package;
            return (
              <li key={s.key} className="flex flex-col items-center text-center" aria-current={on ? "step" : undefined}>
                <span className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-all ${on ? (dark ? "pulse-ring scale-110 border-[#f6e2a8] bg-[#f6e2a8] text-[#3a0a12]" : "pulse-ring scale-110 border-brand-gold bg-primary text-white") : done ? "medallion h-11 w-11 border-transparent" : idle}`}>
                  {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
                </span>
                <span className={`mt-2.5 text-[13px] font-bold ${label(on, done)}`}>{s.label}</span>
                {s.note && <span className={`mt-0.5 text-xs ${dark ? "text-white/65" : "text-muted-foreground"}`}>{s.note}</span>}
              </li>
            );
          })}
        </ol>
      </div>
      {/* phones: vertical rail */}
      <ol className="relative sm:hidden">
        <span className={`absolute bottom-5 left-[21px] top-5 w-[3px] rounded-full ${dark ? "bg-white/15" : "bg-muted"}`}>
          <span className="journey-fill-y absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-[#b8893a] via-[#f6e2a8] to-[#e9c987]" style={{ height: `${pct}%` }} />
        </span>
        {steps.map((s, i) => {
          const done = i < current, on = i === current, Icon = ICONS[i] ?? Package;
          return (
            <li key={s.key} className="relative flex items-center gap-4 py-2" aria-current={on ? "step" : undefined}>
              <span className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 ${on ? (dark ? "pulse-ring border-[#f6e2a8] bg-[#f6e2a8] text-[#3a0a12]" : "pulse-ring border-brand-gold bg-primary text-white") : done ? "medallion h-11 w-11 border-transparent" : idle}`}>
                {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${label(on, done)}`}>{s.label}</span>
                {s.note && <span className={`block text-xs ${dark ? "text-white/65" : "text-muted-foreground"}`}>{s.note}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
