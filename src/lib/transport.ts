import { Bus, Car, Footprints, Plane, Ship, TrainFront, type LucideIcon } from "lucide-react";

import type { TransportMethod } from "@/types/transport";

export const TRANSPORT_ICONS: Record<TransportMethod, LucideIcon> = {
  train: TrainFront,
  bus: Bus,
  walk: Footprints,
  boat: Ship,
  car: Car,
  plane: Plane,
};
