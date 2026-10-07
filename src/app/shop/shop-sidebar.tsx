"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PRICES = [
  { label: "All prices", value: "all" },
  { label: "Under ₹500", value: "under-500" },
  { label: "₹500 – ₹1,000", value: "500-1000" },
  { label: "Over ₹1,000", value: "over-1000" },
];

const DIETARY = [
  { label: "100% Organic", value: "organic" },
  { label: "Raw & unpolished", value: "raw" },
  { label: "Gluten-free", value: "gluten-free" },
  { label: "Vegan friendly", value: "vegan" },
];

const optionClass = (on: boolean) =>
  `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors ${
    on
      ? "bg-muted font-extrabold text-primary"
      : "text-foreground hover:bg-muted"
  }`;

function Mark({ on, round }: { on: boolean; round?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${round ? "rounded-full" : "rounded-md"} ${
        on ? "border-primary bg-primary" : "border-border bg-card"
      }`}
    >
      {on && (
        <span
          className={`h-2 w-2 bg-primary-foreground ${round ? "rounded-full" : "rounded-sm"}`}
        />
      )}
    </span>
  );
}

export function ShopSidebar({ variant }: { variant: "mobile" | "desktop" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPrice = searchParams.get("price") || "all";
  const currentDietary = searchParams.getAll("dietary");
  const activeFilterCount =
    (currentPrice !== "all" ? 1 : 0) + currentDietary.length;

  const push = (params: URLSearchParams) =>
    router.push(`${pathname}?${params.toString()}`, { scroll: false });

  const setPrice = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("price");
    else params.set("price", value);
    push(params);
  };

  const toggleDietary = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = currentDietary.includes(value)
      ? currentDietary.filter((v) => v !== value)
      : [...currentDietary, value];
    params.delete("dietary");
    next.forEach((v) => params.append("dietary", v));
    push(params);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("price");
    params.delete("dietary");
    push(params);
  };

  const filters = (
    <div className="space-y-7">
      <fieldset>
        <legend className="eyebrow mb-2 text-brand-gold-deep">Price</legend>
        <div role="radiogroup" className="space-y-1">
          {PRICES.map((p) => (
            <button
              key={p.value}
              role="radio"
              aria-checked={currentPrice === p.value}
              onClick={() => setPrice(p.value)}
              className={optionClass(currentPrice === p.value)}
            >
              <Mark on={currentPrice === p.value} round />
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-2 text-brand-gold-deep">
          Purity &amp; diet
        </legend>
        <div className="space-y-1">
          {DIETARY.map((d) => {
            const on = currentDietary.includes(d.value);
            return (
              <button
                key={d.value}
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleDietary(d.value)}
                className={optionClass(on)}
              >
                <Mark on={on} />
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="flex min-h-11 items-center text-sm font-extrabold text-brand-gold-deep"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  if (variant === "mobile") {
    return (
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] font-bold text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] overflow-y-auto rounded-t-3xl bg-background p-5"
          >
            <SheetHeader className="p-0 pb-4">
              <SheetTitle className="font-heading text-2xl text-primary">
                Filter dry fruits
              </SheetTitle>
            </SheetHeader>
            {filters}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-6 h-12 w-full rounded-2xl bg-primary font-extrabold text-primary-foreground"
            >
              Show products
            </button>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <aside aria-label="Filters" className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-[150px] rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-5 font-heading text-2xl font-bold text-primary">
          Filters
        </h2>
        {filters}
      </div>
    </aside>
  );
}
