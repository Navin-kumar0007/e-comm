import Link from "next/link";

/**
 * Dark lattice title band used at the top of every inner page (design board:
 * checkout / tracking headers). Sits directly under the fixed header.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  crumbs,
  children,
  compact = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  crumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`jaali pt-header text-white ${compact ? "pb-6" : "pb-8 md:pb-11"}`}>
      <div className="container mx-auto max-w-7xl px-4 pt-5 sm:px-6 md:pt-8 lg:px-8">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">›</span>}
                {c.href ? <Link href={c.href} className="hover:text-brand-gold">{c.label}</Link> : <span className="text-white">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <span className="eyebrow block text-brand-gold">{eyebrow}</span>}
        <h1 className="mt-1 font-heading text-[34px] font-bold leading-[0.95] md:text-[50px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[13.5px] text-white/80 md:text-[15px]">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
