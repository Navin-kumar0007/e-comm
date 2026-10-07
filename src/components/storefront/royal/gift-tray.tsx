"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart-store";

export interface GiftOption {
  id: string;
  slug: string;
  name: string;
  label: string;
  image: string;
  price: number;
  weight: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Pick any 3 packs; the isometric tray fills as you choose and "Add" puts them in the cart. */
export function GiftTray({ options }: { options: GiftOption[] }) {
  const addItem = useCartStore((s) => s.addItem);
  const [picked, setPicked] = useState<string[]>(options.slice(0, 2).map((o) => o.id));
  if (options.length < 3) return null;

  const chosen = picked.map((id) => options.find((o) => o.id === id)!).filter(Boolean);
  const total = chosen.reduce((n, o) => n + o.price, 0);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-3)));

  const addTray = () => {
    chosen.forEach((o) => addItem({ productId: o.id, name: o.name, price: o.price, slug: o.slug, image: o.image, weight: o.weight }));
    toast.success("Gift tray added: 3 packs in your cart");
  };

  const tray = (big: boolean) => (
    <div className="flex items-center justify-center" style={{ perspective: 1000, height: big ? 300 : 190 }}>
      <div
        className="grid grid-cols-3 gap-2 rounded-2xl border-[3px] border-brand-gold bg-primary p-2 shadow-[10px_14px_0_#2A0A12,22px_30px_30px_rgba(0,0,0,0.45)]"
        style={{ width: big ? 320 : 220, height: big ? 205 : 142, transform: "rotateX(52deg) rotateZ(-28deg)" }}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="relative block overflow-hidden rounded-lg border-[1.5px] border-brand-gold bg-royal-deep">
            {chosen[i] ? (
              <Image src={chosen[i].image} alt="" fill sizes="110px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-brand-gold">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section id="gift" className="mx-4 mt-10 scroll-mt-28 md:container md:mx-auto md:mt-16 md:max-w-7xl md:px-6">
      <div className="jaali overflow-hidden rounded-[24px] px-4 py-6 text-white md:flex md:items-center md:gap-12 md:rounded-[30px] md:px-12 md:py-10">
        <div className="text-center md:flex-1 md:text-left">
          <span className="eyebrow text-brand-gold">Diwali gifting</span>
          <h2 className="font-heading text-[30px] font-bold leading-none md:text-[44px]">Fill a royal tray</h2>
          <p className="mt-2 text-[13.5px] text-white/85 md:text-[15px]">Pick any 3 packs. We add them to your cart together.</p>
          <div className="md:hidden">{tray(false)}</div>
          <div className="mt-1 flex flex-wrap justify-center gap-2 md:mt-5 md:justify-start">
            {options.map((o) => {
              const on = picked.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`h-9 rounded-full border-[1.5px] border-brand-gold px-3.5 text-[13px] font-bold md:h-10 md:px-4 ${on ? "bg-secondary text-secondary-foreground" : "text-white"}`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 md:justify-start md:gap-6">
            <span className="flex flex-col text-left leading-tight">
              <span className="text-xs opacity-80">{chosen.length} of 3 picked</span>
              <strong className="tnum text-lg md:text-xl">{chosen.length === 3 ? inr(total) : `Pick ${3 - chosen.length} more`}</strong>
            </span>
            <button
              onClick={addTray}
              disabled={chosen.length < 3}
              className="h-11 rounded-xl bg-secondary px-5 text-sm font-extrabold text-secondary-foreground disabled:opacity-60 md:h-12 md:px-6"
            >
              Add gift tray
            </button>
          </div>
        </div>
        <div className="hidden md:block md:flex-1">{tray(true)}</div>
      </div>
    </section>
  );
}
