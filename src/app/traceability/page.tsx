"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Package, CalendarCheck, CalendarClock, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHero } from "@/components/storefront/royal/page-hero";

interface BatchResult {
  lotNumber: string;
  productName: string;
  productSlug: string;
  pack: string | null;
  packedOn: string;
  bestBefore: string | null;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Batch lookup: the code printed on a jar shows what is in it, when it was packed and its best-before date. */
export default function TraceabilityPage() {
  const [batchNo, setBatchNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = batchNo.trim();
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch('/api/traceability/' + encodeURIComponent(code));
      if (!res.ok) { setResult(null); setNotFound(true); return; }
      setNotFound(false);
      setResult(await res.json());
    } catch (e) {
      console.error(e);
      setResult(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const rows = result
    ? [
        { icon: Package, label: 'In this jar', value: result.pack ? `${result.productName}, ${result.pack}` : result.productName },
        { icon: CalendarCheck, label: 'Packed on', value: day(result.packedOn) },
        ...(result.bestBefore ? [{ icon: CalendarClock, label: 'Best before', value: day(result.bestBefore) }] : []),
        { icon: MapPin, label: 'Graded and packed by', value: 'B.M.V. Spices & Dry Fruits, Chitguppa, Bidar, Karnataka · FSSAI Reg. No. 21224035000151' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHero
        eyebrow="Batch lookup"
        title="Check your jar's batch"
        subtitle="Type the batch number printed on your jar's label to see what is inside, when it was packed and its best-before date."
        crumbs={[{ label: "Home", href: "/" }, { label: "Batch lookup" }]}
      />

      <div className="container mx-auto max-w-2xl px-4 pt-8 md:pt-10">
        <form onSubmit={handleSearch} className="relative">
          <label htmlFor="batch-number" className="sr-only">Batch number</label>
          <Input
            id="batch-number"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            placeholder="Batch number, e.g. B2610-001"
            autoCapitalize="characters"
            className="h-14 w-full rounded-full bg-card pl-6 pr-20 text-base shadow-[var(--shadow-card)]"
          />
          <Button type="submit" disabled={loading} aria-label="Look up batch" className="absolute bottom-1.5 right-1.5 top-1.5 rounded-full px-5">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </form>

        {notFound && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            We couldn&apos;t find that batch number. Check the code printed on your jar, or WhatsApp us at +91 85500 07073 and we&apos;ll tell you when it was packed.
          </p>
        )}

        {result ? (
          <section className="lux-card rise-in mt-8 p-6 md:p-8" aria-live="polite">
            <span className="eyebrow text-brand-gold-deep">Batch {result.lotNumber}</span>
            <h2 className="mt-1 font-heading text-3xl font-bold leading-tight text-primary">{result.productName}</h2>
            <dl className="mt-5 grid gap-4">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="medallion"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <Link href={`/product/${result.productSlug}`} className="btn-buy mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm font-extrabold">
              Buy this jar again
            </Link>
          </section>
        ) : (
          !notFound && (
            <p className="mt-8 rounded-[var(--radius-card)] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              The batch number is printed next to the packing date on every Spicy Nuts label.
            </p>
          )
        )}
      </div>
    </div>
  );
}
