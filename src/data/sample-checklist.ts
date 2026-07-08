import type { ChecklistItem } from "@/types/trip";

import checklistData from "./checklist.json";

export const sampleChecklist = (Array.isArray(checklistData) ? checklistData : []) as ChecklistItem[];
