import type { FlightsData } from "@/types/flight";

import flightsDataJson from "./flights.json";

export const flightsData = flightsDataJson as FlightsData;
export const flightSegments = flightsData.segments;
export const outboundFlight = flightSegments.find((flight) => flight.direction === "outbound") ?? flightSegments[0]!;
export const returnFlight = flightSegments.find((flight) => flight.direction === "return") ?? flightSegments[1] ?? flightSegments[0]!;
