import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Plus } from "lucide-react";
import { useMemo, useState } from "react";

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

export function ItineraryPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<JourneyTab>("itinerary");
  const [selectedDay, setSelectedDay] = useState(CURRENT_DAY_INDEX);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<EditableTimelineItem | null>(null);
  const [selectedActivityDay, setSelectedActivityDay] = useState(CURRENT_DAY_INDEX);
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
  } = usePersistentItinerary(fallbackDays);
  const status: "ready" | "error" = itineraryDays.length > 0 ? "ready" : "error";
  const fallbackDayNumber = itineraryDays[0]?.dayNumber ?? CURRENT_DAY_INDEX;
  const safeSelectedDay = itineraryDays.some((d) => d.dayNumber === selectedDay) ? selectedDay : fallbackDayNumber;

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

  return (
    <div className="relative flex flex-col gap-4 pb-28">
      <JourneyHeader trip={sampleTrip} day={day} totalDays={totalDays} />
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
        </>
      )}

      {activeTab === "tickets" && <JourneyTicketsPanel />}
      {activeTab === "budget" && <JourneyBudgetPanel />}
      {activeTab === "checklist" && <JourneyChecklistPanel />}
    </div>
  );
}

export default ItineraryPage;
