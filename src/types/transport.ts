export type TransportMethod = "train" | "bus" | "walk" | "boat" | "car" | "plane";

export interface TransportStation {
  id: string;
  name: string;
  city: string;
  lines: string[];
}

export interface TransportRoute {
  id: string;
  day?: number;
  from: string;
  to: string;
  method: TransportMethod;
  line?: string;
  duration: string;
  cost?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface TransportData {
  icocaTip: string;
  routes: TransportRoute[];
  stations: TransportStation[];
}
