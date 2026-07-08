import { useEffect, useState } from "react";

/**
 * Simulates an initial content load so pages can showcase skeleton states.
 * Purely presentational — no data fetching is involved.
 */
export function useSimulatedLoading(durationMs = 180) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return isLoading;
}
