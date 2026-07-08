import { GlassCard, Skeleton } from "@/components/ui";

export function RestaurantCardSkeleton() {
  return (
    <GlassCard padding="none" className="mx-5 overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-12 shrink-0" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-pill" />
          <Skeleton className="h-6 w-20 rounded-pill" />
        </div>
      </div>
    </GlassCard>
  );
}
