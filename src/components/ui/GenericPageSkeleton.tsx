import { Skeleton } from "./Skeleton";

export function GenericPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}
