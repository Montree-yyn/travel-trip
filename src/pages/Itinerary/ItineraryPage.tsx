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
    const timeout = window.setTimeout(() => setSuccessToastMessage(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [successToastMessage]);

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
    }
    return moved;
  }

  function confirmDayAction(targetDayNumber: number) {
    if (!dayActionMode) return false;
    const success = dayActionMode === "move"
      ? moveDayActivities(day.dayNumber, targetDayNumber)
      : swapDayActivities(day.dayNumber, targetDayNumber);
    if (success) {
      setSuccessToastMessage(dayActionMode === "move" ? "Day moved successfully" : "Days swapped successfully");
    }
    return success;
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
          <DaySelector days={itineraryDays} selected={safeSelectedDay} onSelect={setSelectedDay} />

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
                <div className="glass-surface-strong glass-shadow-lg rounded-pill px-4 py-3 text-sm font-bold text-ink">
                  {successToastMessage}
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
