import { flightsData } from "@/data/flights";
import { hotelData } from "@/data/hotel";
import { sampleTrip } from "@/data/sample-trip";
import {
  buildFlightBookingPdfStoragePath,
  buildHotelBookingPdfStoragePath,
  getFirebaseStorage,
} from "@/firebase/storage";
import type { FlightsData, FlightSegment } from "@/types/flight";
import type { HotelData } from "@/types/hotel";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

const STORAGE_KEY = `travel-trip-bookings:${sampleTrip.id}:v1`;
const MAX_BOOKING_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const BOOKING_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export interface BookingPdfMetadata {
  fileName: string;
  storagePath: string;
  downloadURL: string;
  uploadedAt: string;
}

export interface BookingData {
  flights: FlightsData;
  hotel: HotelData;
}

function fallbackBookings(): BookingData {
  return {
    flights: flightsData,
    hotel: hotelData,
  };
}

function normalizeFlightSegment(value: unknown): FlightSegment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<FlightSegment>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.direction !== "string" ||
    typeof candidate.label !== "string" ||
    typeof candidate.airline !== "string" ||
    typeof candidate.flightNumber !== "string" ||
    !candidate.departure ||
    !candidate.arrival
  ) {
    return null;
  }

  return candidate as FlightSegment;
}

function normalizeBookings(value: unknown): BookingData {
  if (!value || typeof value !== "object") return fallbackBookings();
  const candidate = value as Partial<BookingData>;
  const segments = Array.isArray(candidate.flights?.segments)
    ? candidate.flights.segments.map(normalizeFlightSegment).filter((flight): flight is FlightSegment => flight !== null)
    : flightsData.segments;

  return {
    flights: {
      ...flightsData,
      ...candidate.flights,
      segments,
      airports: Array.isArray(candidate.flights?.airports) ? candidate.flights.airports : flightsData.airports,
      passengers: Array.isArray(candidate.flights?.passengers) ? candidate.flights.passengers : flightsData.passengers,
      baggage: candidate.flights?.baggage ?? flightsData.baggage,
    },
    hotel: {
      ...hotelData,
      ...candidate.hotel,
      checkIn: candidate.hotel?.checkIn ?? hotelData.checkIn,
      checkOut: candidate.hotel?.checkOut ?? hotelData.checkOut,
      amenities: Array.isArray(candidate.hotel?.amenities) ? candidate.hotel.amenities : hotelData.amenities,
    },
  };
}

export function readBookingsFromStorage(): BookingData {
  if (typeof window === "undefined") return fallbackBookings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeBookings(JSON.parse(raw)) : fallbackBookings();
  } catch {
    return fallbackBookings();
  }
}

export function writeBookingsToStorage(bookings: BookingData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function validateBookingFile(file: File) {
  if (!BOOKING_FILE_TYPES.has(file.type)) {
    throw new Error("Please choose a PDF, JPG, PNG, or WebP booking file.");
  }

  if (file.size > MAX_BOOKING_FILE_SIZE_BYTES) {
    throw new Error("Booking file must be 10MB or smaller.");
  }
}

function isObjectNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "storage/object-not-found"
  );
}

export async function uploadBookingPdf({
  uid,
  bookingType,
  bookingId,
  file,
}: {
  uid: string;
  bookingType: "flight" | "hotel";
  bookingId: string;
  file: File;
}): Promise<BookingPdfMetadata> {
  validateBookingFile(file);

  const storagePath =
    bookingType === "flight"
      ? buildFlightBookingPdfStoragePath(uid, bookingId, file.name)
      : buildHotelBookingPdfStoragePath(uid, bookingId, file.name);
  const storageRef = ref(getFirebaseStorage(), storagePath);

  try {
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: { fileName: file.name },
    });

    return {
      fileName: file.name,
      storagePath,
      downloadURL: await getDownloadURL(storageRef),
      uploadedAt: new Date().toISOString(),
    };
  } catch {
    throw new Error("Could not upload this booking file. Please try again.");
  }
}

export async function deleteBookingPdf(storagePath: string) {
  try {
    await deleteObject(ref(getFirebaseStorage(), storagePath));
  } catch (error) {
    if (!isObjectNotFoundError(error)) {
      throw new Error("Could not remove this PDF. Please try again.");
    }
  }
}

export function getBookingPdfUrl(pdf?: BookingPdfMetadata, legacyDataUrl?: string) {
  return pdf?.downloadURL || legacyDataUrl || "";
}
