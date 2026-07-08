import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-2xl",
} as const;

const GRADIENTS = [
  "from-[#FFB4C6] to-[#E8548B]",
  "from-[#FFD3A6] to-[#FF7AA2]",
  "from-[#C9B6FF] to-[#FF8FB1]",
  "from-[#9EE7E0] to-[#5FB6D9]",
] as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: keyof typeof SIZE_CLASSES;
  ring?: boolean;
}

/** Deterministic gradient + initials avatar (or an image, if `src` is provided). */
export function Avatar({ name, src, size = "md", ring = true, className, ...props }: AvatarProps) {
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        `bg-gradient-to-br ${gradient}`,
        ring && "ring-2 ring-bg-elevated",
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </span>
  );
}
