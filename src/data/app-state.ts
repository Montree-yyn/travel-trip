import { getCurrentTripDay, getNextActivity } from "@/lib/trip-progress";

import { sampleTrip } from "./sample-trip";

const currentDay = getCurrentTripDay(sampleTrip);
const nextActivity = getNextActivity(currentDay);

export const CURRENT_DAY_INDEX = Number.isFinite(currentDay.dayNumber) ? currentDay.dayNumber : 1;
export const CURRENT_ACTIVITY_INDEX = Math.max(
  0,
  Array.isArray(currentDay.timeline)
    ? currentDay.timeline.findIndex((item) => item.time === nextActivity.time && item.activity === nextActivity.activity)
    : 0,
);
