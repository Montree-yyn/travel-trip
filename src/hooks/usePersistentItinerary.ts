import { useCallback, useEffect, useState } from "react";

import {
  createBlankActivity,
  type EditableTripDay,
  PLANNER_SYNC_EVENT,
  readItineraryPlannerDays,
  writeItineraryPlannerDays,
} from "@/lib/itineraryPlanner";
import type { EditableTimelineItem, TripDay } from "@/types/trip";

function replaceDay(days: EditableTripDay[], dayNumber: number, update: (day: EditableTripDay) => EditableTripDay) {
  return days.map((day) => (day.dayNumber === dayNumber ? update(day) : day));
}

export function usePersistentItinerary(fallbackDays: TripDay[]) {
  const [days, setDays] = useState(() => readItineraryPlannerDays(fallbackDays));
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => setDays(readItineraryPlannerDays(fallbackDays));
    window.addEventListener(PLANNER_SYNC_EVENT, sync);
    return () => window.removeEventListener(PLANNER_SYNC_EVENT, sync);
  }, [fallbackDays]);

  const persist = useCallback((nextDays: EditableTripDay[]) => {
    try {
      writeItineraryPlannerDays(nextDays);
      setDays(nextDays);
      setError("");
      return true;
    } catch {
      setError("Could not save itinerary changes. Your existing plan is still available.");
      return false;
    }
  }, []);

  const addActivity = useCallback(
    (dayNumber: number, input?: Partial<EditableTimelineItem>) => {
      const nextActivity = { ...createBlankActivity(), ...input };
      return persist(
        days.map((day) =>
          day.dayNumber === dayNumber ? { ...day, timeline: [...day.timeline, nextActivity] } : day,
        ),
      );
    },
    [days, persist],
  );

  const updateActivity = useCallback(
    (activityId: string, fromDayNumber: number, toDayNumber: number, input: EditableTimelineItem) => {
      const withoutActivity = days.map((day) => ({
        ...day,
        timeline: day.timeline.filter((item) => item.id !== activityId),
      }));

      const sourceDay = days.find((day) => day.dayNumber === fromDayNumber);
      const sourceIndex = sourceDay?.timeline.findIndex((item) => item.id === activityId) ?? -1;

      return persist(
        withoutActivity.map((day) => {
          if (day.dayNumber !== toDayNumber) return day;
          const timeline = [...day.timeline];
          const insertIndex = fromDayNumber === toDayNumber && sourceIndex >= 0
            ? Math.min(sourceIndex, timeline.length)
            : timeline.length;
          timeline.splice(insertIndex, 0, input);
          return { ...day, timeline };
        }),
      );
    },
    [days, persist],
  );

  const deleteActivity = useCallback(
    (activityId: string) =>
      persist(
        days.map((day) => ({
          ...day,
          timeline: day.timeline.filter((item) => item.id !== activityId),
        })),
      ),
    [days, persist],
  );

  const moveActivity = useCallback(
    (dayNumber: number, activityId: string, direction: "up" | "down") => {
      const day = days.find((item) => item.dayNumber === dayNumber);
      const index = day?.timeline.findIndex((item) => item.id === activityId) ?? -1;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (!day || index < 0 || nextIndex < 0 || nextIndex >= day.timeline.length) return false;

      return persist(
        replaceDay(days, dayNumber, (currentDay) => {
          const timeline = [...currentDay.timeline];
          const [activity] = timeline.splice(index, 1);
          if (activity) timeline.splice(nextIndex, 0, activity);
          return { ...currentDay, timeline };
        }),
      );
    },
    [days, persist],
  );

  return {
    days,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
  };
}
