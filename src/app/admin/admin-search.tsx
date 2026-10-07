"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Package, User, CornerDownLeft } from "lucide-react";
import { adminSearchAction, type SearchHit } from "@/app/actions/admin-search";

const ICONS = { order: ShoppingCart, product: Package, customer: User } as const;
const GROUP_LABEL = { order: "Orders", product: "Products", customer: "Customers" } as const;

/** Header search: orders (no., phone, email, invoice, AWB), products (name, SKU, barcode), customers. */
export function AdminSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();

  // Ctrl/⌘ + K focuses the box from anywhere in the admin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search; a scanner typing a barcode + Enter also lands here.
  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await adminSearchAction(q);
        setHits(res);
        setActive(0);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const visible = q.trim().length < 2 ? [] : hits;
  const go = (hit?: SearchHit) => {
    if (!hit) return;
    setOpen(false);
    setQ("");
    setHits([]);
    router.push(hit.href);
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, visible.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); go(visible[active]); }
            if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
          }}
          placeholder="Search orders, phone, AWB, products, barcodes…"
          aria-label="Search the admin"
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{pending ? "Searching…" : "No matches"}</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {visible.map((h, i) => {
                const Icon = ICONS[h.kind];
                const newGroup = i === 0 || visible[i - 1].kind !== h.kind;
                return (
                  <li key={`${h.kind}-${h.id}`}>
                    {newGroup && <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{GROUP_LABEL[h.kind]}</p>}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(h)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left ${i === active ? "bg-muted" : ""}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{h.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>
                      </span>
                      {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
