import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import type { EditableTimelineItem } from "@/types/trip";

import type { EditableTripDay } from "@/lib/itineraryPlanner";

const CATEGORY_OPTIONS = ["Activity", "Food", "Transport", "Hotel", "Shopping", "Attraction"];

export function ActivityEditorDialog({
  open,
  mode,
  activity,
  selectedDayNumber,
  days,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: "add" | "edit";
  activity: EditableTimelineItem | null;
  selectedDayNumber: number;
  days: EditableTripDay[];
  onClose: () => void;
  onSave: (fromDayNumber: number, toDayNumber: number, activity: EditableTimelineItem) => boolean;
  onDelete: (activityId: string) => boolean;
}) {
  const [dayNumber, setDayNumber] = useState(selectedDayNumber);
  const [time, setTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Activity");
  const [duration, setDuration] = useState("60 min");
  const [notes, setNotes] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDayNumber(selectedDayNumber);
    setTime(activity?.time ?? "10:00");
    setTitle(activity?.activity ?? "");
    setLocation(activity?.location ?? "");
    setCategory(activity?.category ?? "Activity");
    setDuration(activity?.duration ?? "60 min");
    setNotes(activity?.notes ?? "");
    setTravelTime(activity?.travelTime ?? "");
    setError("");
  }, [activity, open, selectedDayNumber]);

  function handleSave() {
    const resolvedTitle = title.trim();
    if (!time) {
      setError("Choose a time for this activity.");
      return;
    }
    if (!resolvedTitle) {
      setError("Enter an activity title.");
      return;
    }

    const saved = onSave(selectedDayNumber, dayNumber, {
      id: activity?.id ?? `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      time,
      activity: resolvedTitle,
      location: location.trim() || undefined,
      category: category.trim() || undefined,
      duration: duration.trim() || undefined,
      notes: notes.trim() || undefined,
      travelTime: travelTime.trim() || undefined,
    });

    if (saved) onClose();
    else setError("Could not save this activity. Please try again.");
  }

  function handleDelete() {
    if (!activity) return;
    const confirmed = window.confirm(`Delete "${activity.activity}" from the itinerary?`);
    if (!confirmed) return;

    const deleted = onDelete(activity.id);
    if (deleted) onClose();
    else setError("Could not delete this activity. Please try again.");
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
                <div>
                  <p className="text-xs font-semibold uppercase text-accent-strong">Day planner</p>
                  <h2 className="text-xl font-semibold text-ink">{mode === "add" ? "Add activity" : "Edit activity"}</h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label="Close activity editor" onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Day</span>
                    <select
                      value={dayNumber}
                      onChange={(event) => setDayNumber(Number(event.target.value))}
                      className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                    >
                      {days.map((day) => (
                        <option key={day.dayNumber} value={day.dayNumber}>
                          Day {day.dayNumber} · {day.city}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Time</span>
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Activity title"
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Location</span>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Location"
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>

                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Category</span>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                    >
                      {CATEGORY_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Duration</span>
                    <input
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      placeholder="60 min"
                      className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Travel time</span>
                  <input
                    value={travelTime}
                    onChange={(event) => setTravelTime(event.target.value)}
                    placeholder="20 min"
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Notes"
                    rows={3}
                    className="resize-none rounded-2xl bg-ink/5 px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>

                {error && <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>}
              </div>

              <div className={mode === "edit" && activity
                ? "grid shrink-0 grid-cols-[1fr_1fr_1fr] gap-2 border-t border-white/30 px-5 py-4 dark:border-white/10"
                : "grid shrink-0 grid-cols-2 gap-2 border-t border-white/30 px-5 py-4 dark:border-white/10"}
              >
                {mode === "edit" && activity ? (
                  <>
                    <Button variant="secondary" fullWidth className="text-red-500 px-2" onClick={handleDelete}>
                      <Trash2 size={15} />
                      Delete
                    </Button>
                    <Button variant="secondary" fullWidth className="px-2" onClick={onClose}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" fullWidth onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button fullWidth onClick={handleSave}>
                  Save
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
