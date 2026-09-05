import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12">
        <div>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-5 w-72" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-3xl overflow-hidden border border-border/30 bg-card/60 shadow-lg">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="p-5 flex flex-col gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex items-center justify-between mt-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
