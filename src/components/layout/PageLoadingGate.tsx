import type { ReactNode } from "react";

import { GenericPageSkeleton } from "@/components/ui/GenericPageSkeleton";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";

interface PageLoadingGateProps {
  children: ReactNode;
  skeleton?: ReactNode;
  durationMs?: number;
}

export function PageLoadingGate({ children, skeleton, durationMs }: PageLoadingGateProps) {
  const isLoading = useSimulatedLoading(durationMs);

  if (isLoading) return skeleton ?? <GenericPageSkeleton />;
  return children;
}
