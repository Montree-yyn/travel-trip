import { GlassCard, Skeleton } from "@/components/ui";

export function PlaceDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="mx-5 h-56 rounded-4xl" />
      <div className="grid grid-cols-3 gap-3 px-5">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
      <GlassCard padding="md" className="mx-5 flex flex-col gap-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </GlassCard>
    </div>
  );
}
