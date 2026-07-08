import { motion, useAnimation, type PanInfo } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  children: ReactNode;
  /** Visible height (px) of the sheet content area when collapsed. */
  peekHeight?: number;
  /** Visible height (px) of the sheet content area when expanded. */
  expandedHeight?: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  className?: string;
}

/** A draggable, glass-surfaced sheet that snaps between a peek and expanded height. */
export function BottomSheet({
  children,
  peekHeight = 180,
  expandedHeight = 460,
  expanded,
  onExpandedChange,
  className,
}: BottomSheetProps) {
  const controls = useAnimation();
  const travel = expandedHeight - peekHeight;

  useEffect(() => {
    controls.start({ y: expanded ? 0 : travel });
  }, [expanded, travel, controls]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const shouldExpand = info.offset.y < -travel / 3 || info.velocity.y < -400;
    const shouldCollapse = info.offset.y > travel / 3 || info.velocity.y > 400;
    if (shouldExpand) onExpandedChange(true);
    else if (shouldCollapse) onExpandedChange(false);
    else controls.start({ y: expanded ? 0 : travel });
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: travel }}
      dragElastic={0.06}
      animate={controls}
      initial={{ y: travel }}
      onDragEnd={handleDragEnd}
      transition={{ type: "spring", stiffness: 420, damping: 42 }}
      style={{ height: expandedHeight }}
      className={cn(
        "glass-surface-strong glass-shadow-lg absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-4xl",
        className,
      )}
    >
      <button
        aria-label={expanded ? "Collapse sheet" : "Expand sheet"}
        onClick={() => onExpandedChange(!expanded)}
        className="group flex shrink-0 cursor-grab touch-none items-center justify-center py-3 active:cursor-grabbing"
      >
        <span className="h-1.5 w-10 rounded-pill bg-ink/15 transition-colors group-active:bg-ink/25" />
      </button>
      <div className="relative flex-1 overflow-hidden">
        <div className="no-scrollbar h-full overflow-y-auto overscroll-contain">{children}</div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[rgb(var(--surface))]/60 to-transparent" />
      </div>
    </motion.div>
  );
}
