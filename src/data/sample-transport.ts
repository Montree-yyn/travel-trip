import type { TransportData } from "@/types/transport";

import transportDataJson from "./transport.json";

const transportData = transportDataJson as TransportData;

export const sampleTransportRoutes = Array.isArray(transportData.routes) ? transportData.routes : [];
export const sampleTransportStations = Array.isArray(transportData.stations) ? transportData.stations : [];
export const icocaTip = transportData.icocaTip ?? "Use your IC card for quick tap-to-ride transit access.";
