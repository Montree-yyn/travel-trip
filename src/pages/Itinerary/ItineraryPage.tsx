import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button, EmptyState, GlassCard } from "@/components/ui";
import { CURRENT_DAY_INDEX } from "@/data/app-state";
import { sampleTrip } from "@/data/sample-trip";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentItinerary } from "@/hooks/usePersistentItinerary";
import { usePersistedSet } from "@/hooks/usePersistedSet";
import { useTranslation } from "@/i18n";
import type { EditableTimelineItem } from "@/types/trip";

import { ActivityEditorDialog } from "./components/ActivityEditorDialog";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { DaySelector } from "./components/DaySelector";
import { JourneyBudgetPanel } from "./components/JourneyBudgetPanel";
import { JourneyChecklistPanel } from "./components/JourneyChecklistPanel";
import { JourneyHeader } from "./components/JourneyHeader";
import { JourneyTabs, type JourneyTab } from "./components/JourneyTabs";
import { JourneyTicketsPanel } from "./components/JourneyTicketsPanel";
import { MoveActivityDialog } from "./components/MoveActivityDialog";
import { MoveSwapDayDialog, type DayMoveMode } from "./components/MoveSwapDayDialog";

export function ItineraryPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<JourneyTab>("itinerary");
  const [selectedDay, setSelectedDay] = useState(CURRENT_DAY_INDEX);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<EditableTimelineItem | null>(null);
  const [selectedActivityDay, setSelectedActivityDay] = useState(CURRENT_DAY_INDEX);
  const [movingActivity, setMovingActivity] = useState<{
    activity: EditableTimelineItem;
    fromDayNumber: number;
  } | null>(null);
  const [dayActionMode, setDayActionMode] = useState<DayMoveMode | null>(null);
  const [successToastMessage, setSuccessToastMessage] = useState("");
  const [dragTargetDay, setDragTargetDay] = useState<number | null>(null);
  const [dayDragTarget, setDayDragTarget] = useState<number | null>(null);
  const [undoMove, setUndoMove] = useState<{
    activityId: string;
    fromDayNumber: number;
    toDayNumber: number;
    fromIndex: number;
  } | null>(null);
  const [undoDayMove, setUndoDayMove] = useState<{
    mode: "move" | "swap";
    sourceDayNumber: number;
    targetDayNumber: number;
  } | null>(null);
  const { items: bookmarkIds, toggle: toggleBookmark } = usePersistedSet(
    `travel-trip-bookmarks:${sampleTrip.id}`,
  );

  const fallbackDays = useMemo(() => (Array.isArray(sampleTrip.itinerary) ? sampleTrip.itinerary : []), []);
  const {
    days: itineraryDays,
    error: plannerError,
    addActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    moveActivityToDay,
    moveDayActivities,
    swapDayActivities,
  } = usePersistentItinerary(fallbackDays);
  const status: "ready" | "error" = itineraryDays.length > 0 ? "ready" : "error";
  const fallbackDayNumber = itineraryDays[0]?.dayNumber ?? CURRENT_DAY_INDEX;
  const safeSelectedDay = itineraryDays.some((d) => d.dayNumber === selectedDay) ? selectedDay : fallbackDayNumber;

  useEffect(() => {
    if (!successToastMessage) return;
    const timeout = window.setTimeout(() => setSuccessToastMessage(""), undoMove || undoDayMove ? 4200 : 2400);
    return () => window.clearTimeout(timeout);
  }, [successToastMessage, undoDayMove, undoMove]);

  if (status === "error") {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("empty.itinerary.title")}
        description={t("empty.itinerary.description")}
      />
    );
  }

  const day = itineraryDays.find((d) => d.dayNumber === safeSelectedDay) ?? itineraryDays[0];
  if (!day) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t("itinerary.unavailableTitle")}
        description={t("itinerary.dayUnavailableDescription")}
      />
    );
  }

  const totalDays = Math.max(sampleTrip.days, itineraryDays.length, 1);
  const timelineItems = day.timeline;

  function openAddActivity() {
    setSelectedActivity(null);
    setSelectedActivityDay(day.dayNumber);
    setEditorMode("add");
  }

  function openEditActivity(item: EditableTimelineItem) {
    setSelectedActivity(item);
    setSelectedActivityDay(day.dayNumber);
    setEditorMode("edit");
  }

  function closeEditor() {
    setEditorMode(null);
    setSelectedActivity(null);
  }

  function openMoveActivity(item: EditableTimelineItem) {
    setMovingActivity({ activity: item, fromDayNumber: day.dayNumber });
  }

  function closeMoveDialog() {
    setMovingActivity(null);
  }

  function confirmMoveActivity(toDayNumber: number) {
    if (!movingActivity) return false;
    const moved = moveActivityToDay(movingActivity.fromDayNumber, toDayNumber, movingActivity.activity.id);
    if (moved) {
      setSuccessToastMessage("Activity moved successfully");
      setUndoMove(null);
      setUndoDayMove(null);
    }
    return moved;
  }

  function dropActivity(activityId: string, toDayNumber: number, insertIndex?: number) {
    const fromIndex = timelineItems.findIndex((item) => item.id === activityId);
    if (fromIndex < 0) return false;
    if (toDayNumber === day.dayNumber && (insertIndex === fromIndex || insertIndex === fromIndex + 1)) {
      return false;
    }
    const moved = moveActivityToDay(day.dayNumber, toDayNumber, activityId, insertIndex);
    if (moved) {
      setSuccessToastMessage("Activity moved");
      setUndoMove({
        activityId,
        fromDayNumber: day.dayNumber,
        toDayNumber,
        fromIndex,
      });
      setUndoDayMove(null);
    }
    return moved;
  }

  function undoLastActivityMove() {
    if (!undoMove) return;
    const undone = moveActivityToDay(
      undoMove.toDayNumber,
      undoMove.fromDayNumber,
      undoMove.activityId,
      undoMove.fromIndex,
    );
    if (undone) {
      setUndoMove(null);
      setSuccessToastMessage("");
    }
  }

  function confirmDayAction(targetDayNumber: number) {
    if (!dayActionMode) return false;
    const success = dayActionMode === "move"
      ? moveDayActivities(day.dayNumber, targetDayNumber)
      : swapDayActivities(day.dayNumber, targetDayNumber);
    if (success) {
      setSuccessToastMessage(dayActionMode === "move" ? "Day moved successfully" : "Days swapped successfully");
      setUndoMove(null);
      setUndoDayMove(null);
    }
    return success;
  }

  function dropDay(sourceDayNumber: number, targetDayNumber: number) {
    if (sourceDayNumber === targetDayNumber) return false;
    const targetDay = itineraryDays.find((item) => item.dayNumber === targetDayNumber);
    if (!targetDay) return false;

    const mode = targetDay.timeline.length === 0 ? "move" : "swap";
    const success = mode === "move"
      ? moveDayActivities(sourceDayNumber, targetDayNumber)
      : swapDayActivities(sourceDayNumber, targetDayNumber);

    if (success) {
      setSuccessToastMessage("Day moved");
      setUndoMove(null);
      setUndoDayMove({ mode, sourceDayNumber, targetDayNumber });
    }
    return success;
  }

  function undoLastDayMove() {
    if (!undoDayMove) return;
    const undone = undoDayMove.mode === "move"
      ? moveDayActivities(undoDayMove.targetDayNumber, undoDayMove.sourceDayNumber)
      : swapDayActivities(undoDayMove.sourceDayNumber, undoDayMove.targetDayNumber);
    if (undone) {
      setUndoDayMove(null);
      setSuccessToastMessage("");
    }
  }

  return (
    <div className="relative flex flex-col gap-4 pb-28">
      <JourneyHeader
        trip={sampleTrip}
        day={day}
        totalDays={totalDays}
        onMoveDay={() => setDayActionMode("move")}
        onSwapDay={() => setDayActionMode("swap")}
      />
      <JourneyTabs value={activeTab} onChange={setActiveTab} />

      {activeTab === "itinerary" && (
        <>
          <DaySelector
            days={itineraryDays}
            selected={safeSelectedDay}
            dragTargetDay={dragTargetDay}
            dayDragTarget={dayDragTarget}
            onDayDragTargetChange={setDayDragTarget}
            onDropDay={dropDay}
            onSelect={setSelectedDay}
          />

          <motion.div
            key={day.dayNumber}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {day.tips && day.tips.length > 0 && (
              <motion.div variants={riseIn} className="mx-5">
                <GlassCard padding="md" className="flex gap-3">
                  <Lightbulb size={18} className="mt-0.5 shrink-0 text-accent-strong" />
                  <div className="flex flex-col gap-1">
                    {day.tips.map((tip) => (
                      <p key={tip} className="text-xs text-ink-muted">
                        {tip}
                      </p>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {plannerError && (
              <motion.div variants={riseIn} className="mx-5">
                <GlassCard padding="md" className="text-sm font-semibold text-red-500">
                  {plannerError}
                </GlassCard>
              </motion.div>
            )}

            <motion.div variants={riseIn} className="mx-5">
              <Button fullWidth onClick={openAddActivity}>
                <Plus size={16} />
                Add Activity
              </Button>
            </motion.div>

            <ActivityTimeline
              dayNumber={day.dayNumber}
              city={day.city}
              items={timelineItems}
              bookmarkIds={bookmarkIds}
              onToggleBookmark={toggleBookmark}
              onSelectActivity={openEditActivity}
              onMoveActivity={(activityId, direction) => moveActivity(day.dayNumber, activityId, direction)}
              onRequestMoveActivity={openMoveActivity}
              onDragTargetDayChange={setDragTargetDay}
              onDropActivity={dropActivity}
              onDeleteActivity={deleteActivity}
            />
          </motion.div>

          <ActivityEditorDialog
            open={editorMode !== null}
            mode={editorMode ?? "add"}
            activity={selectedActivity}
            selectedDayNumber={selectedActivityDay}
            days={itineraryDays}
            onClose={closeEditor}
            onSave={(fromDayNumber, toDayNumber, activity) => {
              if (editorMode === "edit" && selectedActivity) {
                return updateActivity(selectedActivity.id, fromDayNumber, toDayNumber, activity);
              }
              return addActivity(toDayNumber, activity);
            }}
            onDelete={deleteActivity}
          />

          <MoveActivityDialog
            open={movingActivity !== null}
            activity={movingActivity?.activity ?? null}
            currentDayNumber={movingActivity?.fromDayNumber ?? day.dayNumber}
            days={itineraryDays}
            onClose={closeMoveDialog}
            onConfirm={confirmMoveActivity}
          />

          <MoveSwapDayDialog
            open={dayActionMode !== null}
            mode={dayActionMode ?? "move"}
            sourceDayNumber={day.dayNumber}
            days={itineraryDays}
            onClose={() => setDayActionMode(null)}
            onConfirm={confirmDayAction}
          />

          <AnimatePresence>
            {successToastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed inset-x-0 bottom-28 z-[60] mx-auto flex max-w-md justify-center px-5 md:max-w-lg lg:max-w-xl"
              >
                <div className="glass-surface-strong glass-shadow-lg flex items-center gap-3 rounded-pill px-4 py-3 text-sm font-bold text-ink">
                  <span>{successToastMessage}</span>
                  {undoMove && successToastMessage === "Activity moved" && (
                    <button
                      type="button"
                      onClick={undoLastActivityMove}
                      className="rounded-pill bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong"
                    >
                      Undo
                    </button>
                  )}
                  {undoDayMove && successToastMessage === "Day moved" && (
                    <button
                      type="button"
                      onClick={undoLastDayMove}
                      className="rounded-pill bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {activeTab === "tickets" && <JourneyTicketsPanel />}
      {activeTab === "budget" && <JourneyBudgetPanel />}
      {activeTab === "checklist" && <JourneyChecklistPanel />}
    </div>
  );
}

export default ItineraryPage;
