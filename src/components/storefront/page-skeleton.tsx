import { Skeleton } from "@/components/ui/skeleton";

/** Maroon title band placeholder, the same height as PageHero, so nothing jumps when the page arrives. */
function HeroBand() {
  return (
    <div className="jaali pt-header pb-8 md:pb-11" aria-hidden="true">
      <div className="container mx-auto max-w-7xl px-4 pt-5 sm:px-6 md:pt-8 lg:px-8">
        <div className="h-3 w-28 rounded-full bg-white/15" />
        <div className="mt-3 h-8 w-56 rounded-[var(--radius-control)] bg-white/15 md:h-11 md:w-80" />
      </div>
    </div>
  );
}

function CardGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-card p-2.5 md:p-3.5">
          <Skeleton className="h-[138px] rounded-2xl md:h-[180px]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10" />
        </div>
      ))}
    </div>
  );
}

/** Loading screens shown the moment a link is tapped, so the app never looks frozen on a slow network. */
export function PageSkeleton({ variant }: { variant: "grid" | "product" | "list" | "rows" }) {
  // Inside a layout that already shows its own title band (account): rows only.
  if (variant === "rows") {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Loading">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-[var(--radius-card)]" />)}
      </div>
    );
  }
  if (variant === "product") {
    return (
      <div className="pb-28 md:pb-14" role="status" aria-label="Loading product">
        <div className="jaali pt-header md:hidden"><div className="h-[340px]" /></div>
        <div className="container mx-auto max-w-7xl md:grid md:grid-cols-2 md:gap-10 md:px-6 md:pt-[calc(var(--header-h)+20px)] lg:px-8">
          <Skeleton className="hidden aspect-square rounded-[var(--radius-card)] md:block" />
          <div className="relative -mt-6 flex flex-col gap-3 rounded-t-[var(--radius-sheet)] bg-background px-4 pt-5 md:mt-0 md:px-0">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="h-8 w-28" />
            <div className="grid grid-cols-3 gap-2.5"><Skeleton className="h-[104px]" /><Skeleton className="h-[104px]" /><Skeleton className="h-[104px]" /></div>
            <Skeleton className="h-14" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="pb-10" role="status" aria-label="Loading">
      <HeroBand />
      <div className="container mx-auto max-w-7xl px-4 pt-5 sm:px-6 md:pt-8 lg:px-8">
        {variant === "grid" ? (
          <CardGrid />
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[var(--radius-card)]" />)}
          </div>
        )}
      </div>
    </div>
  );
}
