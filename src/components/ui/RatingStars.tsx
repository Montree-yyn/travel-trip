import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export interface RatingStarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function RatingStars({ rating, size = 13, showValue = true, className }: RatingStarsProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              strokeWidth={0}
              className={filled ? "fill-accent-strong text-accent-strong" : "fill-ink/12 text-ink/12"}
            />
          );
        })}
      </span>
      {showValue && <span className="text-xs font-medium text-ink-muted">{rating.toFixed(1)}</span>}
    </span>
  );
}
