import type { ReactNode } from "react";

import { GenericPageSkeleton } from "@/components/ui/GenericPageSkeleton";

import { useTripSync } from "./TripSyncProvider";

export function SyncGate({ children }: { children: ReactNode }) {
  const { loading } = useTripSync();

  if (loading) {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg md:max-w-lg lg:max-w-xl">
        <GenericPageSkeleton />
      </div>
    );
  }

  return children;
}
