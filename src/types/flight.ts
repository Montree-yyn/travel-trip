export type FlightDirection = "outbound" | "return";

export interface FlightEndpoint {
  date: string;
  time: string;
  airport: string;
  airportCode: string;
  terminal: string;
  city: string;
}

export interface FlightSegment {
  id: string;
  direction: FlightDirection;
  label: string;
  airline: string;
  flightNumber: string;
  bookingReference?: string;
  notes?: string;
  pdfFileName?: string;
  pdfDataUrl?: string;
  pdf?: BookingPdfMetadata;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  transitTime: string;
  baggage: string;
}

export interface BookingPdfMetadata {
  fileName: string;
  storagePath: string;
  downloadURL: string;
  uploadedAt: string;
}

export interface FlightBaggageSummary {
  checked: string;
  cabin: string;
}

export interface AirportMapTarget {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal: string;
  latitude?: number;
  longitude?: number;
}

export interface FlightsData {
  bookingReference: string;
  passengers: string[];
  baggage: FlightBaggageSummary;
  airports: AirportMapTarget[];
  segments: FlightSegment[];
}
