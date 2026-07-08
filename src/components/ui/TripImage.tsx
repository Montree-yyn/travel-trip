import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { resolveImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

const PALETTES = [
  "from-[#FFC6D9] via-[#FF8FB3] to-[#E8548B]",
  "from-[#B7E4C7] via-[#7FC8A9] to-[#3E8E7E]",
  "from-[#FFD9A6] via-[#FF9F68] to-[#E8654B]",
  "from-[#A6D8FF] via-[#6FB4E8] to-[#3A6FC4]",
  "from-[#D9C6FF] via-[#B48FE8] to-[#6E4FC4]",
  "from-[#FFE29A] via-[#FFB870] to-[#E88549]",
] as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface TripImageProps {
  seed: string;
  alt?: string;
  icon?: LucideIcon;
  className?: string;
  iconClassName?: string;
  priority?: boolean;
  aspectRatio?: string;
  children?: ReactNode;
}

export function TripImage({
  seed,
  alt = "",
  icon: Icon,
  className,
  iconClassName,
  priority = false,
  aspectRatio,
  children,
}: TripImageProps) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(seed);
  const palette = PALETTES[hashString(seed) % PALETTES.length];
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-gradient-to-br",
        !showImage && palette,
        className,
      )}
      style={aspectRatio ? { aspectRatio } : { minHeight: priority ? undefined : "1px" }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={800}
          height={800}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <div className="absolute -left-6 -top-8 size-28 rounded-full bg-white/25 blur-2xl animate-float" />
          <div
            className="absolute -bottom-10 -right-8 size-32 rounded-full bg-black/10 blur-2xl animate-float"
            style={{ animationDelay: "-3s" }}
          />
          {Icon && <Icon className={cn("relative mx-auto text-white/45", iconClassName)} strokeWidth={1.5} />}
        </>
      )}
      {children}
    </div>
  );
}

/** @deprecated Use TripImage — kept for backward compatibility during migration. */
export { TripImage as PhotoPlaceholder };
