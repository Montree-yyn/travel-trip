import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowUp, Bookmark, CalendarDays, Car, Clock, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Chip, GlassCard, TripImage } from "@/components/ui";
import { staggerContainer, riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { EditableTimelineItem } from "@/types/trip";

import { buildSmartTimeline, getActivityId, inferCategoryKey } from "./activity-utils";

export interface ActivityTimelineProps {
  dayNumber: number;
  city: string;
  items: EditableTimelineItem[];
  bookmarkIds?: Set<string>;
  onToggleBookmark?: (id: string) => void;
  onSelectActivity?: (item: EditableTimelineItem) => void;
  onMoveActivity?: (activityId: string, direction: "up" | "down") => void;
  onRequestMoveActivity?: (item: EditableTimelineItem) => void;
  onDeleteActivity?: (activityId: string) => boolean;
}

export function ActivityTimeline({
  dayNumber,
  city,
  items,
  bookmarkIds = new Set<string>(),
  onToggleBookmark,
  onSelectActivity,
  onMoveActivity,
  onRequestMoveActivity,
  onDeleteActivity,
}: ActivityTimelineProps) {
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState<{
    item: EditableTimelineItem;
    activityId: string;
    index: number;
    isBookmarked: boolean;
  } | null>(null);

  function closeMenu() {
    setActiveMenu(null);
  }

  function handleDelete() {
    if (!activeMenu || !onDeleteActivity) return;
    const confirmed = window.confirm(`Delete "${activeMenu.item.activity}" from the itinerary?`);
    if (!confirmed) return;
    const deleted = onDeleteActivity(activeMenu.activityId);
    if (deleted) closeMenu();
  }

  const smartItems = buildSmartTimeline(items);

  return (
    <>
      <motion.ol
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3 px-5"
      >
        {smartItems.map((smartItem, index) => {
          const { item } = smartItem;
          const activityId = item.id || getActivityId(dayNumber, item);
          const isBookmarked = bookmarkIds.has(activityId);
          const categoryKey = inferCategoryKey(item.activity, item.notes, item.category);

          return (
            <motion.li key={activityId} variants={riseIn}>
              <GlassCard
                interactive
                padding="none"
                className={cn(
                  "flex cursor-pointer overflow-hidden",
                  smartItem.conflict && "ring-2 ring-red-400/70",
                )}
                onClick={() => onSelectActivity?.(item)}
              >
                <TripImage
                  seed={`${city}-${dayNumber}-${item.activity}`}
                  className="size-[5.75rem] shrink-0"
                  alt={item.activity}
                />

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-xs font-semibold text-accent-strong">
                        <Clock size={12} />
                        {smartItem.startTime}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-ink">
                        {item.activity}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Open activity actions"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveMenu({ item, activityId, index, isBookmarked });
                      }}
                      className="glass-surface flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="neutral" className="text-[0.6875rem]">
                      {t(categoryKey)}
                    </Chip>
                    <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-ink-muted">
                      <Clock size={12} />
                      {smartItem.durationLabel}
                    </span>
                    {smartItem.travelMinutes > 0 && (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-ink-muted">
                        <Car size={12} />
                        {smartItem.travelLabel}
                      </span>
                    )}
                    {smartItem.conflict && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-red-500/10 px-2 py-1 text-[0.6875rem] font-bold text-red-500">
                        <AlertTriangle size={12} />
                        Conflict
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[0.625rem] font-semibold text-ink-muted">
                    <span className="rounded-xl bg-ink/5 px-2 py-1">
                      End {smartItem.endTime}
                    </span>
                    <span className="rounded-xl bg-ink/5 px-2 py-1">
                      Leave {smartItem.leaveTime}
                    </span>
                    <span className="rounded-xl bg-ink/5 px-2 py-1">
                      Arrive {smartItem.arrivalTime}
                    </span>
                  </div>

                  {smartItem.gapAfterLabel && smartItem.gapAfterMinutes !== null && smartItem.gapAfterMinutes > 0 && (
                    <p className="text-[0.6875rem] font-semibold text-emerald-600">
                      Free time before next: {smartItem.gapAfterLabel}
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.li>
          );
        })}
      </motion.ol>

      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]"
            onClick={closeMenu}
          >
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="w-full max-w-md px-4"
              onClick={(event) => event.stopPropagation()}
            >
              <GlassCard elevated padding="none" className="overflow-hidden rounded-4xl">
                <div className="flex items-center justify-between gap-3 border-b border-white/30 px-5 py-4 dark:border-white/10">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-accent-strong">Activity actions</p>
                    <h2 className="line-clamp-1 text-lg font-semibold text-ink">{activeMenu.item.activity}</h2>
                  </div>
                  <button
                    type="button"
                    aria-label="Close activity actions"
                    onClick={closeMenu}
                    className="glass-surface flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="grid gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onSelectActivity?.(activeMenu.item);
                    }}
                    className="glass-surface flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold text-ink"
                  >
                    <Pencil size={17} className="text-accent-strong" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={!onMoveActivity || activeMenu.index === 0}
                    onClick={() => {
                      onMoveActivity?.(activeMenu.activityId, "up");
                      closeMenu();
                    }}
                    className="glass-surface flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold text-ink disabled:opacity-40"
                  >
                    <ArrowUp size={17} className="text-accent-strong" />
                    Move Up
                  </button>
                  <button
                    type="button"
                    disabled={!onMoveActivity || activeMenu.index === items.length - 1}
                    onClick={() => {
                      onMoveActivity?.(activeMenu.activityId, "down");
                      closeMenu();
                    }}
                    className="glass-surface flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold text-ink disabled:opacity-40"
                  >
                    <ArrowDown size={17} className="text-accent-strong" />
                    Move Down
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onRequestMoveActivity?.(activeMenu.item);
                    }}
                    className="glass-surface flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold text-ink"
                  >
                    <CalendarDays size={17} className="text-accent-strong" />
                    Move to another day...
                  </button>
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleBookmark(activeMenu.activityId);
                        closeMenu();
                      }}
                      className={cn(
                        "glass-surface flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold",
                        activeMenu.isBookmarked ? "text-accent-strong" : "text-ink",
                      )}
                    >
                      <Bookmark size={17} className={activeMenu.isBookmarked ? "fill-current text-accent-strong" : "text-accent-strong"} />
                      {activeMenu.isBookmarked ? "Unbookmark" : "Bookmark"}
                    </button>
                  )}
                  {onDeleteActivity && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="glass-surface flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold text-red-500"
                    >
                      <Trash2 size={17} />
                      Delete
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
