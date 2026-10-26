import { Check } from "lucide-react";

/** Cart → Details → Payment, as gold medallions joined by a rail that fills up to the current step. */
export function CheckoutSteps({ current }: { current: number }) {
  const steps = ["Cart", "Details", "Payment"];
  return (
    <ol aria-label="Checkout steps" className="mt-5 flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current, on = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={on ? "step" : undefined}>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-royal text-sm font-bold transition-colors ${done || on ? "medallion" : "border border-white/35 text-white/70"} ${on ? "pulse-ring" : ""}`}>
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={`font-royal text-xs font-bold tracking-[0.18em] ${done || on ? "text-brand-gold" : "text-white/70"}`}>{label.toUpperCase()}</span>
            {i < steps.length - 1 && (
              <span className="relative mx-1 h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
                {done && <span className="journey-fill absolute inset-0 rounded-full bg-gradient-to-r from-[#b8893a] via-[#f6e2a8] to-[#c9a45a]" />}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
