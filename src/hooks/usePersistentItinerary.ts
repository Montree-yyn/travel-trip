import {
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import {
  createBlankActivity,
  type EditableTripDay,
  readItineraryPlannerDays,
} from "@/lib/itineraryPlanner";
import {
  getActiveTripId,
  sanitizeFirestoreData,
  sharedTripCollection,
  sharedTripSubDoc,
} from "@/sync/sharedTrip";
import type { EditableTimelineItem, TripDay, Weekday } from "@/types/trip";

type ItineraryDocument = Partial<EditableTimelineItem> & {
  dayNumber?: number;
  date?: string;
  weekday?: Weekday;
  title?: string;
  theme?: string;
  city?: string;
  order?: number;
};

const metadataDocId = "__meta";

function replaceDay(days: EditableTripDay[], dayNumber: number, update: (day: EditableTripDay) => EditableTripDay) {
  return days.map((day) => (day.dayNumber === dayNumber ? update(day) : day));
}

function isWeekday(value: unknown): value is Weekday {
  return (
    value === "Sunday" ||
    value === "Monday" ||
    value === "Tuesday" ||
    value === "Wednesday" ||
    value === "Thursday" ||
    value === "Friday" ||
    value === "Saturday"
  );
}

function seedDayShell(day: TripDay): EditableTripDay {
  return {
    ...day,
    timeline: [],
  };
}

function fallbackEditableDays(fallbackDays: TripDay[]) {
  return readItineraryPlannerDays(fallbackDays);
}

function normalizeItineraryDoc(snapshot: QueryDocumentSnapshot) {
  if (snapshot.id === metadataDocId) return null;
  const data = snapshot.data() as ItineraryDocument;
  if (typeof data.dayNumber !== "number" || typeof data.time !== "string" || typeof data.activity !== "string") {
    return null;
  }
  const activityFields = { ...data } as Partial<EditableTimelineItem> & Record<string, unknown>;
  delete activityFields.dayNumber;
  delete activityFields.date;
  delete activityFields.weekday;
  delete activityFields.title;
  delete activityFields.theme;
  delete activityFields.city;
  delete activityFields.order;
  delete activityFields.tripId;
  delete activityFields.createdAt;
  delete activityFields.updatedAt;
  delete activityFields.createdBy;
  delete activityFields.updatedBy;

  return {
    id: snapshot.id,
    dayNumber: data.dayNumber,
    date: typeof data.date === "string" ? data.date : "",
    weekday: isWeekday(data.weekday) ? data.weekday : "Monday",
    title: typeof data.title === "string" ? data.title : `Day ${data.dayNumber}`,
    theme: typeof data.theme === "string" ? data.theme : "",
    city: typeof data.city === "string" ? data.city : "",
    order: typeof data.order === "number" ? data.order : 0,
    activity: {
      ...activityFields,
      id: snapshot.id,
      time: data.time,
      activity: data.activity,
    },
  };
}

function buildDaysFromSnapshot(snapshotDocs: QueryDocumentSnapshot[], fallbackDays: TripDay[]) {
  if (snapshotDocs.length === 0) return fallbackEditableDays(fallbackDays);

  const daysByNumber = new Map<number, EditableTripDay>();
  for (const day of fallbackDays) {
    daysByNumber.set(day.dayNumber, seedDayShell(day));
  }

  const activityDocs = snapshotDocs
    .map(normalizeItineraryDoc)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeItineraryDoc>> => item !== null)
    .sort((left, right) => left.dayNumber - right.dayNumber || left.order - right.order || left.activity.time.localeCompare(right.activity.time));

  for (const item of activityDocs) {
    const currentDay = daysByNumber.get(item.dayNumber);
    const day = currentDay ?? {
      dayNumber: item.dayNumber,
      date: item.date,
      weekday: item.weekday,
      title: item.title,
      theme: item.theme || item.city,
      city: item.city,
      highlights: [],
      food: [],
      timeline: [],
    };

    daysByNumber.set(item.dayNumber, {
      ...day,
      date: item.date || day.date,
      weekday: item.weekday || day.weekday,
      title: item.title || day.title,
      theme: item.theme || day.theme,
      city: item.city || day.city,
      timeline: [...day.timeline, item.activity],
    });
  }

  return [...daysByNumber.values()].sort((left, right) => left.dayNumber - right.dayNumber);
}

function findDay(days: EditableTripDay[], dayNumber: number) {
  return days.find((day) => day.dayNumber === dayNumber);
}

function serializeActivity({
  day,
  activity,
  order,
  tripId,
  uid,
  isCreate,
}: {
  day: EditableTripDay;
  activity: EditableTimelineItem;
  order: number;
  tripId: string;
  uid: string;
  isCreate?: boolean;
}) {
  return sanitizeFirestoreData({
    ...activity,
    tripId,
    dayNumber: day.dayNumber,
    date: day.date,
    weekday: day.weekday,
    title: day.title,
    theme: day.theme,
    city: day.city,
    order,
    createdAt: isCreate ? serverTimestamp() : undefined,
    updatedAt: serverTimestamp(),
    createdBy: isCreate ? uid : undefined,
    updatedBy: uid,
  });
}

async function writeAllItineraryDays({
  days,
  tripId,
  uid,
}: {
  days: EditableTripDay[];
  tripId: string;
  uid: string;
}) {
  const itineraryRef = sharedTripCollection(tripId, "itinerary");
  const batch = writeBatch(itineraryRef.firestore);
  batch.set(
    sharedTripSubDoc(tripId, "itinerary", metadataDocId),
    sanitizeFirestoreData({
      kind: "metadata",
      tripId,
      initializedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    }),
    { merge: true },
  );

  for (const day of days) {
    day.timeline.forEach((activity, order) => {
      batch.set(
        sharedTripSubDoc(tripId, "itinerary", activity.id),
        serializeActivity({ day, activity, order, tripId, uid, isCreate: true }),
        { merge: true },
      );
    });
  }
  await batch.commit();
}

async function migrateLegacyItineraryIfNeeded(uid: string, tripId: string, fallbackDays: TripDay[]) {
  const itineraryRef = sharedTripCollection(tripId, "itinerary");
  const existing = await getDocs(itineraryRef);
  if (!existing.empty) return;

  const days = fallbackEditableDays(fallbackDays);
  await writeAllItineraryDays({ days, tripId, uid });
}

export function usePersistentItinerary(fallbackDays: TripDay[]) {
  const { user } = useAuth();
  const [days, setDays] = useState(() => fallbackEditableDays(fallbackDays));
  const [error, setError] = useState("");
  const migrationKeyRef = useRef("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setDays(fallbackEditableDays(fallbackDays));
      setError("Cloud sync is not configured. Itinerary changes may stay on this device.");
      return;
    }

    if (!user) return;

    const tripId = getActiveTripId();
    return onSnapshot(
      sharedTripCollection(tripId, "itinerary"),
      (snapshot) => {
        setDays(buildDaysFromSnapshot(snapshot.docs, fallbackDays));

        const migrationKey = `${user.uid}:${tripId}:itinerary`;
        if (snapshot.empty && migrationKeyRef.current !== migrationKey) {
          migrationKeyRef.current = migrationKey;
          void migrateLegacyItineraryIfNeeded(user.uid, tripId, fallbackDays).catch((migrationError) => {
            console.error("[travel-trip-sync] Could not migrate legacy itinerary data", migrationError);
          });
        }
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Itinerary snapshot failed", snapshotError);
        setError("Could not load the shared itinerary. Please refresh and try again.");
      },
    );
  }, [fallbackDays, user]);

  const persistActivity = useCallback(
    (nextDays: EditableTripDay[], dayNumber: number, activity: EditableTimelineItem, isCreate?: boolean) => {
      if (!user || !isFirebaseConfigured()) return;
      const tripId = getActiveTripId();
      const day = findDay(nextDays, dayNumber);
      if (!day) return;
      const order = day.timeline.findIndex((item) => item.id === activity.id);
      if (order < 0) return;

      void setDoc(
        sharedTripSubDoc(tripId, "itinerary", activity.id),
        serializeActivity({ day, activity, order, tripId, uid: user.uid, isCreate }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Itinerary save failed", saveError);
        setError("Could not save this itinerary item to the shared trip. Please try again.");
      });
    },
    [user],
  );

  const addActivity = useCallback(
    (dayNumber: number, input?: Partial<EditableTimelineItem>) => {
      const nextActivity = { ...createBlankActivity(), ...input };
      const nextDays = days.map((day) =>
        day.dayNumber === dayNumber ? { ...day, timeline: [...day.timeline, nextActivity] } : day,
      );
      setDays(nextDays);
      persistActivity(nextDays, dayNumber, nextActivity, true);
      return true;
    },
    [days, persistActivity],
  );

  const updateActivity = useCallback(
    (activityId: string, fromDayNumber: number, toDayNumber: number, input: EditableTimelineItem) => {
      const withoutActivity = days.map((day) => ({
        ...day,
        timeline: day.timeline.filter((item) => item.id !== activityId),
      }));

      const sourceDay = days.find((day) => day.dayNumber === fromDayNumber);
      const sourceIndex = sourceDay?.timeline.findIndex((item) => item.id === activityId) ?? -1;
      const nextDays = withoutActivity.map((day) => {
        if (day.dayNumber !== toDayNumber) return day;
        const timeline = [...day.timeline];
        const insertIndex = fromDayNumber === toDayNumber && sourceIndex >= 0
          ? Math.min(sourceIndex, timeline.length)
          : timeline.length;
        timeline.splice(insertIndex, 0, input);
        return { ...day, timeline };
      });

      setDays(nextDays);
      persistActivity(nextDays, toDayNumber, input);
      return true;
    },
    [days, persistActivity],
  );

  const deleteActivity = useCallback(
    (activityId: string) => {
      setDays((currentDays) =>
        currentDays.map((day) => ({
          ...day,
          timeline: day.timeline.filter((item) => item.id !== activityId),
        })),
      );

      if (!user || !isFirebaseConfigured()) return true;
      const tripId = getActiveTripId();
      void deleteDoc(sharedTripSubDoc(tripId, "itinerary", activityId)).catch((deleteError) => {
        console.error("[travel-trip-sync] Itinerary delete failed", deleteError);
        setError("Could not delete this itinerary item from the shared trip. Please try again.");
      });
      return true;
    },
    [user],
  );

  const moveActivity = useCallback(
    (dayNumber: number, activityId: string, direction: "up" | "down") => {
      const day = days.find((item) => item.dayNumber === dayNumber);
      const index = day?.timeline.findIndex((item) => item.id === activityId) ?? -1;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (!day || index < 0 || nextIndex < 0 || nextIndex >= day.timeline.length) return false;

      const nextDays = replaceDay(days, dayNumber, (currentDay) => {
        const timeline = [...currentDay.timeline];
        const [activity] = timeline.splice(index, 1);
        if (activity) timeline.splice(nextIndex, 0, activity);
        return { ...currentDay, timeline };
      });

      setDays(nextDays);

      if (user && isFirebaseConfigured()) {
        const tripId = getActiveTripId();
        const updatedDay = findDay(nextDays, dayNumber);
        if (updatedDay) {
          const batch = writeBatch(sharedTripCollection(tripId, "itinerary").firestore);
          updatedDay.timeline.forEach((activity, order) => {
            batch.set(
              sharedTripSubDoc(tripId, "itinerary", activity.id),
              serializeActivity({ day: updatedDay, activity, order, tripId, uid: user.uid }),
              { merge: true },
            );
          });
          void batch.commit().catch((saveError) => {
            console.error("[travel-trip-sync] Itinerary order save failed", saveError);
            setError("Could not save itinerary order to the shared trip. Please try again.");
          });
        }
      }

      return true;
    },
    [days, user],
  );

  const moveActivityToDay = useCallback(
    (fromDayNumber: number, toDayNumber: number, activityId: string) => {
      if (fromDayNumber === toDayNumber) return false;
      const sourceDay = days.find((item) => item.dayNumber === fromDayNumber);
      const destinationDay = days.find((item) => item.dayNumber === toDayNumber);
      const activity = sourceDay?.timeline.find((item) => item.id === activityId);
      if (!sourceDay || !destinationDay || !activity) return false;

      const nextDays = days.map((day) => {
        if (day.dayNumber === fromDayNumber) {
          return {
            ...day,
            timeline: day.timeline.filter((item) => item.id !== activityId),
          };
        }
        if (day.dayNumber === toDayNumber) {
          return {
            ...day,
            timeline: [...day.timeline.filter((item) => item.id !== activityId), activity],
          };
        }
        return day;
      });

      setDays(nextDays);

      if (user && isFirebaseConfigured()) {
        const tripId = getActiveTripId();
        const batch = writeBatch(sharedTripCollection(tripId, "itinerary").firestore);
        for (const dayNumber of [fromDayNumber, toDayNumber]) {
          const day = findDay(nextDays, dayNumber);
          if (!day) continue;
          day.timeline.forEach((nextActivity, order) => {
            batch.set(
              sharedTripSubDoc(tripId, "itinerary", nextActivity.id),
              serializeActivity({ day, activity: nextActivity, order, tripId, uid: user.uid }),
              { merge: true },
            );
          });
        }
        void batch.commit().catch((saveError) => {
          console.error("[travel-trip-sync] Itinerary day move failed", saveError);
          setError("Could not move this itinerary item to another day. Please try again.");
        });
      }

      return true;
    },
    [days, user],
  );

  const moveDayActivities = useCallback(
    (fromDayNumber: number, toDayNumber: number) => {
      if (fromDayNumber === toDayNumber) return false;
      const sourceDay = days.find((item) => item.dayNumber === fromDayNumber);
      const destinationDay = days.find((item) => item.dayNumber === toDayNumber);
      if (!sourceDay || !destinationDay) return false;

      const movedActivities = sourceDay.timeline;
      const nextDays = days.map((day) => {
        if (day.dayNumber === fromDayNumber) return { ...day, timeline: [] };
        if (day.dayNumber === toDayNumber) {
          return { ...day, timeline: [...day.timeline, ...movedActivities] };
        }
        return day;
      });

      setDays(nextDays);

      if (user && isFirebaseConfigured()) {
        const tripId = getActiveTripId();
        const batch = writeBatch(sharedTripCollection(tripId, "itinerary").firestore);
        for (const dayNumber of [fromDayNumber, toDayNumber]) {
          const day = findDay(nextDays, dayNumber);
          if (!day) continue;
          day.timeline.forEach((activity, order) => {
            batch.set(
              sharedTripSubDoc(tripId, "itinerary", activity.id),
              serializeActivity({ day, activity, order, tripId, uid: user.uid }),
              { merge: true },
            );
          });
        }
        void batch.commit().catch((saveError) => {
          console.error("[travel-trip-sync] Itinerary day move failed", saveError);
          setError("Could not move this itinerary day. Please try again.");
        });
      }

      return true;
    },
    [days, user],
  );

  const swapDayActivities = useCallback(
    (sourceDayNumber: number, targetDayNumber: number) => {
      if (sourceDayNumber === targetDayNumber) return false;
      const sourceDay = days.find((item) => item.dayNumber === sourceDayNumber);
      const targetDay = days.find((item) => item.dayNumber === targetDayNumber);
      if (!sourceDay || !targetDay) return false;

      const nextDays = days.map((day) => {
        if (day.dayNumber === sourceDayNumber) return { ...day, timeline: targetDay.timeline };
        if (day.dayNumber === targetDayNumber) return { ...day, timeline: sourceDay.timeline };
        return day;
      });

      setDays(nextDays);

      if (user && isFirebaseConfigured()) {
        const tripId = getActiveTripId();
        const batch = writeBatch(sharedTripCollection(tripId, "itinerary").firestore);
        for (const dayNumber of [sourceDayNumber, targetDayNumber]) {
          const day = findDay(nextDays, dayNumber);
          if (!day) continue;
          day.timeline.forEach((activity, order) => {
            batch.set(
              sharedTripSubDoc(tripId, "itinerary", activity.id),
              serializeActivity({ day, activity, order, tripId, uid: user.uid }),
              { merge: true },
            );
          });
        }
        void batch.commit().catch((saveError) => {
          console.error("[travel-trip-sync] Itinerary day swap failed", saveError);
          setError("Could not swap these itinerary days. Please try again.");
        });
      }

      return true;
    },
    [days, user],
  );

  return {
    days,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    moveActivityToDay,
    moveDayActivities,
    swapDayActivities,
  };
}
