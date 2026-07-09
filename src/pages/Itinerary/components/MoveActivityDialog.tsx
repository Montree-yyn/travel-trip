import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import type { EditableTripDay } from "@/lib/itineraryPlanner";
import type { EditableTimelineItem } from "@/types/trip";

export function MoveActivityDialog({
  open,
  activity,
  currentDayNumber,
  days,
  onClose,
  onConfirm,
}: {
  open: boolean;
  activity: EditableTimelineItem | null;
  currentDayNumber: number;
  days: EditableTripDay[];
  onClose: () => void;
  onConfirm: (toDayNumber: number) => boolean;
}) {
  const [selectedDayNumber, setSelectedDayNumber] = useState(currentDayNumber);
  const selectedDay = days.find((day) => day.dayNumber === selectedDayNumber);
  const canMove = Boolean(activity && selectedDayNumber !== currentDayNumber);

  useEffect(() => {
    if (!open) return;
    setSelectedDayNumber(currentDayNumber);
  }, [currentDayNumber, open]);

  function handleConfirm() {
    if (!canMove) return;
    if (onConfirm(selectedDayNumber)) onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <GlassCard elevated padding="none" className="flex max-h-[calc(100dvh-env(safe-area-inset-bottom)-112px)] flex-col overflow-hidden rounded-4xl">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/30 px-5 py-4 dark:border-white/10">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-accent-strong">Move Activity</p>
                  <h2 className="line-clamp-1 text-xl font-semibold text-ink">{activity?.activity ?? "Activity"}</h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label="Close move activity dialog" onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
                {days.map((day) => {
                  const isCurrent = day.dayNumber === currentDayNumber;
                  const isSelected = day.dayNumber === selectedDayNumber;

                  return (
                    <button
                      key={day.dayNumber}
                      type="button"
                      onClick={() => setSelectedDayNumber(day.dayNumber)}
                      className={[
                        "flex min-h-13 items-center justify-between gap-3 rounded-2xl px-4 text-left transition",
                        isSelected ? "bg-accent-soft text-accent-strong ring-2 ring-accent/35" : "glass-surface text-ink",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">Day {day.dayNumber}</span>
                        <span className="mt-0.5 block truncate text-xs font-semibold opacity-70">{day.city}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {isCurrent && (
                          <span className="rounded-pill bg-white/70 px-2 py-1 text-[0.625rem] font-bold text-accent-strong dark:bg-white/10">
                            Current
                          </span>
                        )}
                        {isSelected && <Check size={17} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/30 px-5 py-4 dark:border-white/10">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  Cancel
                </Button>
                <Button fullWidth disabled={!canMove || !selectedDay} onClick={handleConfirm}>
                  Move
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
