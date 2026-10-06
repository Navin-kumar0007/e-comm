"use client";

import { useState } from "react";

type Point = { date: string; revenue: number; orders: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const day = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** "Nice" axis maximum: 1, 2 or 5 × 10^n at or above the data max. */
function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v)!;
}

export function SalesChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const ticks = [max, max / 2, 0];
  const labelEvery = Math.ceil(data.length / 6);
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="flex gap-2">
        {/* y axis */}
        <div className="flex flex-col justify-between h-44 text-[10px] text-muted-foreground tabular-nums text-right w-12 shrink-0 -my-1.5">
          {ticks.map((t) => <span key={t}>{inr(t)}</span>)}
        </div>

        <div className="relative flex-1 h-44">
          {/* recessive grid */}
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-dashed border-border/60" style={{ top: `${(1 - t / max) * 100}%` }} />
          ))}

          {/* bars, anchored to the baseline, 2px gaps */}
          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={d.date}
                className="relative flex-1 h-full flex items-end cursor-default"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${day(d.date)}: ${inr(d.revenue)}, ${d.orders} orders`}
              >
                <div
                  className={`w-full rounded-t-[4px] transition-opacity ${hover === null || hover === i ? "opacity-100" : "opacity-40"} bg-[#1e7a52] dark:bg-[#3fa776]`}
                  style={{ height: d.revenue > 0 ? `max(2px, ${(d.revenue / max) * 100}%)` : 0 }}
                />
              </div>
            ))}
          </div>

          {active && hover !== null && (
            <div
              className="absolute -top-2 z-10 pointer-events-none px-3 py-2 rounded-lg bg-popover text-popover-foreground border shadow-md text-xs whitespace-nowrap"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: "translate(-50%, -100%)" }}
            >
              <p className="font-semibold">{day(active.date)}</p>
              <p className="tabular-nums">{inr(active.revenue)} · {active.orders} order{active.orders === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      </div>

      {/* x axis */}
      <div className="flex gap-[2px] ml-14 mt-1.5 text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 text-center truncate">{i % labelEvery === 0 ? day(d.date) : ""}</span>
        ))}
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">View as table</summary>
        <div className="max-h-48 overflow-y-auto mt-2">
          <table className="w-full tabular-nums">
            <thead className="text-muted-foreground"><tr><th className="text-left py-1">Date</th><th className="text-right">Orders</th><th className="text-right">Sales</th></tr></thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-t border-border/30"><td className="py-1">{day(d.date)}</td><td className="text-right">{d.orders}</td><td className="text-right">{inr(d.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
