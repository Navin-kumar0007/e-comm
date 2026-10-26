"use client";

import "./command.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, IndianRupee, PackageCheck, RotateCcw, ShoppingCart, Star, Truck, Users } from "lucide-react";
import { StockSkyline, type StockItem } from "./stock-skyline";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const day = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

const ICONS = { rupee: IndianRupee, cart: ShoppingCart, users: Users, alert: AlertTriangle, pack: PackageCheck, truck: Truck, returns: RotateCcw, star: Star };
type IconKey = keyof typeof ICONS;

export type DashboardData = {
  firstName: string;
  range: string;
  ranges: Array<{ key: string; label: string }>;
  periodLabel: string;
  denied: boolean;
  showReports: boolean;
  actions: Array<{ label: string; value: number; href: string; icon: IconKey; hint?: string; calm?: string }>;
  kpis: Array<{ label: string; value: number; money?: boolean; percent?: boolean; empty?: boolean; ring?: number; hint: string; icon: IconKey; delta: number | null; spark?: number[] }>;
  codShare: number;
  orders: number;
  daily: Array<{ date: string; revenue: number; orders: number }>;
  lowStock: Array<{ id: string; name: string; label: string; stock: number }>;
  topProducts: Array<{ id: string; name: string; qty: number; revenue: number; margin: number | null }>;
  recent: Array<{ id: string; customerName: string; total: number; status: string; statusLabel: string; createdAt: string }>;
  stock: StockItem[];
};

/** Number that counts up once when it first appears. Writes to the DOM directly so React doesn't re-render per frame. */
const FORMAT = { inr, int: (n: number) => Math.round(n).toLocaleString("en-IN"), pct: (n: number) => `${Math.round(n)}%` };

function CountUp({ to, as }: { to: number; as: keyof typeof FORMAT }) {
  const format = FORMAT[as];
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = format(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const x = Math.min(1, (now - t0) / 1400);
      el.textContent = format(to * (1 - Math.pow(1 - x, 3)));
      if (x < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, format]);
  return <span ref={ref}>{format(to)}</span>;
}

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 200, h = 44, max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 10)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const id = `sp${color.slice(1)}`;
  const last = pts[pts.length - 1]!;
  return (
    <svg className="cc-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".45" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${w} ${h} L0 ${h}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <svg className="cc-ring" viewBox="0 0 54 54" aria-hidden="true">
      <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
      <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(Math.max(0, Math.min(100, pct)) / 100) * c} ${c}`} transform="rotate(-90 27 27)" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

/** "Nice" axis maximum: 1, 2 or 5 × 10^n at or above the data max. */
function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v)!;
}

function SalesArea({ data }: { data: DashboardData["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 220, L = 52, B = 26, T = 12;
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const n = data.length;
  const x = (i: number) => (n === 1 ? (L + W) / 2 : L + (i / (n - 1)) * (W - L - 8));
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  let d = `M${x(0)} ${y(data[0]?.revenue ?? 0)}`;
  for (let i = 1; i < n; i++) {
    const cx = (x(i - 1) + x(i)) / 2;
    d += ` C${cx} ${y(data[i - 1]!.revenue)} ${cx} ${y(data[i]!.revenue)} ${x(i)} ${y(data[i]!.revenue)}`;
  }
  const every = Math.ceil(n / Math.max(3, Math.floor(W / 90)));
  const step = n > 1 ? (W - L - 8) / (n - 1) : W - L;
  const a = hover !== null ? data[hover] : null;
  return (
    <div ref={box} className="cc-chart" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily sales">
        <defs>
          <linearGradient id="ccArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4a62a" stopOpacity=".5" /><stop offset="1" stopColor="#6e1a2c" stopOpacity="0" /></linearGradient>
          <linearGradient id="ccLine" x1="0" x2="1"><stop offset="0" stopColor="#b8893a" /><stop offset=".6" stopColor="#e9c987" /><stop offset="1" stopColor="#ffc861" /></linearGradient>
        </defs>
        {[1, 0.5, 0].map((f) => (
          <g key={f}>
            <line x1={L} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,.07)" strokeDasharray="4 4" />
            <text x={L - 8} y={y(max * f) + 4} textAnchor="end">{inr(max * f)}</text>
          </g>
        ))}
        {n > 1 && <path d={`${d} L${x(n - 1)} ${H - B} L${x(0)} ${H - B}Z`} fill="url(#ccArea)" />}
        <path d={d} fill="none" stroke="url(#ccLine)" strokeWidth="3" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 8px rgba(244,166,42,.7))" }} />
        {a && hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgba(233,201,135,.4)" />
            <circle cx={x(hover)} cy={y(a.revenue)} r="6" fill="#ffc861" stroke="#2a0a10" strokeWidth="2" />
          </>
        )}
        {data.map((p, i) => (i % every === 0 || i === n - 1 ? <text key={p.date} x={x(i)} y={H - 6} textAnchor="middle">{day(p.date)}</text> : null))}
        {data.map((p, i) => (
          <rect key={p.date} className="hit" x={x(i) - step / 2} y={0} width={step} height={H - B} tabIndex={0} aria-label={`${day(p.date)}: ${inr(p.revenue)}, ${p.orders} orders`}
            onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
        ))}
      </svg>
      {a && hover !== null && (
        <div className="cc-ctip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{day(a.date)}</b>{inr(a.revenue)} · {a.orders} order{a.orders === 1 ? "" : "s"}
        </div>
      )}
      <details>
        <summary>View as table</summary>
        <div className="cc-scroll" style={{ maxHeight: 200, marginTop: 6 }}>
          <table>
            <thead><tr><th style={{ textAlign: "left" }}>Date</th><th style={{ textAlign: "right" }}>Orders</th><th style={{ textAlign: "right" }}>Sales</th></tr></thead>
            <tbody>{[...data].reverse().map((p) => <tr key={p.date}><td>{day(p.date)}</td><td style={{ textAlign: "right" }}>{p.orders}</td><td style={{ textAlign: "right" }}>{inr(p.revenue)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

const ORB: Record<IconKey, [string, string]> = {
  rupee: ["#ffe2a3", "#b8893a"], cart: ["#ffd38a", "#d9821a"], users: ["#9ff0e6", "#1d8a86"], alert: ["#ffb4a6", "#c2523a"],
  pack: ["#ffe2a3", "#b8893a"], truck: ["#9ff0e6", "#1d8a86"], returns: ["#ffb4a6", "#c2523a"], star: ["#ffd38a", "#d9821a"],
};
const SPARK_COLOR: Partial<Record<IconKey, string>> = { rupee: "#e9c987", cart: "#f4a62a" };

export function DashboardView({ data }: { data: DashboardData }) {
  const root = useRef<HTMLDivElement>(null);
  const [hello, setHello] = useState("Welcome back");

  // greeting in India time, set in the browser so the cached page never shows a stale one
  useEffect(() => {
    const h = new Date(Date.now() + 5.5 * 3600_000).getUTCHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  // cards tilt toward the pointer and a soft gold light follows it
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".cc-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      if (!card.hasAttribute("data-flat")) {
        card.style.setProperty("--rx", `${((0.5 - py) * 5).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((px - 0.5) * 7).toFixed(2)}deg`);
      }
    };
    const out = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".cc-card");
      if (card && !card.contains(e.relatedTarget as Node)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerout", out);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerout", out); };
  }, []);

  const units = data.stock.reduce((s, p) => s + Math.max(0, p.stock), 0);
  const value = data.stock.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0);
  const attention = data.stock.filter((p) => p.stock <= p.alertAt).length;
  const online = 100 - data.codShare;

  return (
    <div ref={root} className="cc">
      <div className="cc-bg" aria-hidden="true"><i className="cc-blob cc-b1" /><i className="cc-blob cc-b2" /><i className="cc-blob cc-b3" /><div className="cc-grid" /></div>

      <header className="cc-top">
        <div>
          <span className="cc-eyebrow">Spicy Nuts · Command Centre</span>
          <h1 className="cc-title">{hello}, <em>{data.firstName}</em></h1>
          <p className="cc-sub">Confirmed orders (paid online or COD), India time · compared with the previous {data.periodLabel}</p>
        </div>
        <div className="cc-tools">
          <span className="cc-chip"><i />Live from your shop</span>
          <nav className="cc-seg" aria-label="Period">
            {data.ranges.map((r) => (
              <Link key={r.key} href={`/admin?range=${r.key}`} aria-current={r.key === data.range ? "page" : undefined}>{r.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      {data.denied && <div className="cc-warnbox" role="status">Your role doesn&apos;t have access to that page. Ask the store owner if you need it.</div>}

      <section className="cc-bento" aria-label="Dashboard">
        {/* needs attention now */}
        {data.actions.map((a) => {
          const Icon = ICONS[a.icon];
          const [c1, c2] = ORB[a.icon];
          return (
            <Link key={a.label} href={a.href} className="cc-card">
              <div className="cc-row">
                <span className="cc-orb" style={{ ["--c1" as string]: c1, ["--c2" as string]: c2 }}><Icon /></span>
                {a.value > 0 ? (a.calm ? <span className="cc-delta flat">{a.calm}</span> : <span className="cc-delta warn">Needs you</span>) : <span className="cc-delta flat">All clear</span>}
              </div>
              <div className={`cc-val${a.value > 0 ? "" : " zero"}`}><CountUp to={a.value} as="int" /></div>
              <div className="cc-lbl">{a.label}</div>
              {a.hint && <div className="cc-hint">{a.hint}</div>}
            </Link>
          );
        })}

        {/* the period's numbers */}
        {data.showReports && data.kpis.map((k) => {
          const Icon = ICONS[k.icon];
          const [c1, c2] = ORB[k.icon];
          return (
            <article key={k.label} className="cc-card">
              <div className="cc-row">
                <span className="cc-orb" style={{ ["--c1" as string]: c1, ["--c2" as string]: c2 }}><Icon /></span>
                {k.delta !== null && <span className={`cc-delta ${k.delta >= 0 ? "up" : "down"}`}>{k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}%</span>}
              </div>
              <div className="cc-row" style={{ alignItems: "flex-end" }}>
                <div>
                  <div className={`cc-val${k.empty ? " zero" : ""}`}>{k.empty ? "—" : <CountUp to={k.value} as={k.money ? "inr" : k.percent ? "pct" : "int"} />}</div>
                  <div className="cc-lbl">{k.label}</div>
                </div>
                {k.ring !== undefined && <Ring pct={k.ring} color={k.icon === "alert" ? "#ff6b6b" : "#2ec4b6"} />}
              </div>
              <div className="cc-hint">{k.hint}</div>
              {k.spark && <Spark values={k.spark} color={SPARK_COLOR[k.icon] ?? "#e9c987"} />}
            </article>
          );
        })}

        {/* 3D stock shelf */}
        <article className="cc-card cc-stage cc-span3" data-flat>
          <div className="cc-h">
            <div>
              <span className="cc-eyebrow">Stock skyline · every active product</span>
              <h2>{data.stock.length} products · {FORMAT.int(units)} jars on the shelves</h2>
              <span className="cc-hint">Each column is one product; its height is the stock. Drag to turn, click a column to edit it.</span>
            </div>
            <Link href="/admin/inventory" className="cc-link">Inventory <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          <StockSkyline items={data.stock} />
          <div className="cc-stage-foot">
            <div className="cc-legend"><span><i style={{ background: "#e9c987" }} />In stock</span><span><i style={{ background: "#f4a62a" }} />At or below alert level</span><span><i style={{ background: "#ff6b6b" }} />Out or below zero</span></div>
            <div className="cc-big"><b>{inr(value)}</b><span>stock value at selling price</span></div>
          </div>
        </article>

        {/* low stock */}
        <article className="cc-card cc-side" data-flat>
          <div className="cc-h">
            <div><span className="cc-eyebrow">Restock</span><h2>Low stock</h2></div>
            <span className="cc-delta warn">{attention}</span>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="cc-empty">All products are above their alert level ✓</p>
          ) : (
            <ul className="cc-list cc-scroll">
              {data.lowStock.map((p) => (
                <li key={`${p.id}-${p.label}`}>
                  <Link href={`/admin/products/edit/${p.id}`} className="cc-item">
                    <span className={`cc-dot ${p.stock <= 0 ? "bad" : "warn"}`} />
                    <span style={{ minWidth: 0 }}><b>{p.name}</b><small>{p.label || "—"}</small></span>
                    <span className="cc-amt" style={{ color: p.stock <= 0 ? "var(--cc-red)" : "var(--cc-amber)" }}>{p.stock <= 0 ? (p.stock < 0 ? p.stock : "Out") : `${p.stock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* sales */}
        {data.showReports && (
          <article className="cc-card cc-span3" data-flat>
            <div className="cc-h">
              <div><span className="cc-eyebrow">Daily sales</span><h2>{inr(data.daily.reduce((s, p) => s + p.revenue, 0))} from {data.orders} order{data.orders === 1 ? "" : "s"}</h2></div>
            </div>
            <SalesArea data={data.daily} />
          </article>
        )}
        {data.showReports && (
          <article className="cc-card cc-side">
            <div className="cc-h"><div><span className="cc-eyebrow">How they paid</span><h2>Online vs COD</h2></div></div>
            {data.orders === 0 ? (
              <p className="cc-empty">No orders in this period</p>
            ) : (
              <div className="cc-donut">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="14" />
                  {(() => {
                    const C = 2 * Math.PI * 44, on = (online / 100) * C;
                    return (
                      <>
                        {online > 0 && <circle cx="60" cy="60" r="44" fill="none" stroke="#e9c987" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${Math.max(0, on - 3)} ${C}`} transform="rotate(-90 60 60)" style={{ filter: "drop-shadow(0 0 6px #e9c987)" }} />}
                        {data.codShare > 0 && <circle cx="60" cy="60" r="44" fill="none" stroke="#2ec4b6" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${Math.max(0, C - on - 3)} ${C}`} strokeDashoffset={-on} transform="rotate(-90 60 60)" style={{ filter: "drop-shadow(0 0 6px #2ec4b6)" }} />}
                      </>
                    );
                  })()}
                  <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">{data.orders}</text>
                  <text x="60" y="76" textAnchor="middle" fontSize="10" fill="#bba9a0">orders</text>
                </svg>
                <ul>
                  <li><i style={{ background: "#e9c987" }} />Paid online<b>{online}%</b></li>
                  <li><i style={{ background: "#2ec4b6" }} />Cash on delivery<b>{data.codShare}%</b></li>
                </ul>
              </div>
            )}
          </article>
        )}

        {/* top products */}
        {data.showReports && (
          <article className="cc-card cc-span2" data-flat>
            <div className="cc-h"><div><span className="cc-eyebrow">Best sellers</span><h2>Top products</h2></div></div>
            {data.topProducts.length === 0 ? (
              <p className="cc-empty">No sales in this period</p>
            ) : (
              <ul className="cc-bars">
                {data.topProducts.map((p, i) => (
                  <li key={p.id}>
                    <span className="l">
                      <Link href={`/admin/products/edit/${p.id}`}>{p.name}</Link>
                      <span><b>{inr(p.revenue)}</b> · {p.qty} sold{p.margin === null ? "" : ` · ${p.margin}% margin`}</span>
                    </span>
                    <span className="cc-track"><i style={{ width: `${Math.max(3, (p.revenue / data.topProducts[0]!.revenue) * 100)}%`, animationDelay: `${i * 80}ms` }} /></span>
                  </li>
                ))}
              </ul>
            )}
            {data.topProducts.some((p) => p.margin === null) && <p className="cc-hint" style={{ marginTop: 12 }}>Margin shows once a cost price is set on the product.</p>}
          </article>
        )}

        {/* recent orders */}
        <article className={`cc-card ${data.showReports ? "cc-span2" : "cc-span4"}`} data-flat>
          <div className="cc-h">
            <div><span className="cc-eyebrow">Live</span><h2>Recent orders</h2></div>
            <Link href="/admin/orders" className="cc-link">View all <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="cc-empty">No orders yet</p>
          ) : (
            <ul className="cc-list">
              {data.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="cc-item">
                    <span className="cc-av">{initials(o.customerName)}</span>
                    <span style={{ minWidth: 0 }}><b>#{o.id.slice(-8).toUpperCase()} · {o.customerName}</b><small>{ago(o.createdAt)}</small></span>
                    <span className="cc-amt">{inr(o.total)}<br /><span className="cc-pill">{o.statusLabel}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
