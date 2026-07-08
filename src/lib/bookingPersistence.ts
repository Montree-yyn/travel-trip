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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string") ?? "";
}

const emptyFlightEndpoint: FlightSegment["departure"] = {
  date: "",
  time: "",
  airport: "",
  airportCode: "",
  terminal: "",
  city: "",
};

function normalizeFlightEndpoint(value: unknown, fallback: FlightSegment["departure"]) {
  const candidate = isRecord(value) ? value : {};
  return {
    ...fallback,
    ...candidate,
    date: firstString(candidate.date, fallback.date),
    time: firstString(candidate.time, fallback.time),
    airport: firstString(candidate.airport, candidate.airportName, fallback.airport),
    airportCode: firstString(candidate.airportCode, candidate.code, fallback.airportCode),
    terminal: firstString(candidate.terminal, fallback.terminal),
    city: firstString(candidate.city, fallback.city),
  };
}

function normalizeBookingPdf(value: unknown) {
  if (!isRecord(value)) return undefined;
  const fileName = stringValue(value.fileName);
  const storagePath = stringValue(value.storagePath);
  const downloadURL = stringValue(value.downloadURL);
  const uploadedAt = stringValue(value.uploadedAt);
  if (!fileName || !storagePath || !downloadURL || !uploadedAt) return undefined;
  return { fileName, storagePath, downloadURL, uploadedAt };
}

function normalizeFlightSegment(value: unknown): FlightSegment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<FlightSegment> & Record<string, unknown>;
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

  return {
    ...candidate,
    bookingReference: firstString(candidate.bookingReference, candidate.bookingRef),
    notes: stringValue(candidate.notes),
    seat: firstString(candidate.seat, candidate.seats),
    departure: normalizeFlightEndpoint(candidate.departure, emptyFlightEndpoint),
    arrival: normalizeFlightEndpoint(candidate.arrival, emptyFlightEndpoint),
    transitTime: firstString(candidate.transitTime, candidate.duration),
    baggage: stringValue(candidate.baggage),
  } as FlightSegment;
}

function normalizeHotel(value: unknown): HotelData {
  const candidate = isRecord(value) ? value : {};
  const checkIn = isRecord(candidate.checkIn) ? candidate.checkIn : {};
  const checkOut = isRecord(candidate.checkOut) ? candidate.checkOut : {};

  return {
    ...hotelData,
    ...candidate,
    name: firstString(candidate.name, candidate.hotelName, hotelData.name),
    address: firstString(candidate.address, candidate.hotelAddress, hotelData.address),
    phone: firstString(candidate.phone, candidate.phoneNumber, hotelData.phone),
    checkIn: {
      ...hotelData.checkIn,
      ...checkIn,
      date: firstString(checkIn.date, candidate.checkInDate, hotelData.checkIn.date),
      time: firstString(checkIn.time, candidate.checkInTime, hotelData.checkIn.time),
    },
    checkOut: {
      ...hotelData.checkOut,
      ...checkOut,
      date: firstString(checkOut.date, candidate.checkOutDate, hotelData.checkOut.date),
      time: firstString(checkOut.time, candidate.checkOutTime, hotelData.checkOut.time),
    },
    roomType: firstString(candidate.roomType, candidate.room, hotelData.roomType),
    amenities: Array.isArray(candidate.amenities) ? candidate.amenities : hotelData.amenities,
    confirmationNo: firstString(candidate.confirmationNo, candidate.confirmationNumber, hotelData.confirmationNo),
    bookingNo: firstString(candidate.bookingNo, candidate.bookingNumber, candidate.bookingReference, hotelData.bookingNo),
    guestName: firstString(candidate.guestName, candidate.guest, hotelData.guestName),
    numberOfNights: firstString(candidate.numberOfNights, candidate.nights),
    googleMapsUrl: firstString(candidate.googleMapsUrl, candidate.googleMapsURL, candidate.mapsUrl, candidate.mapUrl),
    notes: firstString(candidate.notes, hotelData.notes),
    pdfFileName: firstString(candidate.pdfFileName),
    pdfDataUrl: firstString(candidate.pdfDataUrl),
    pdf: normalizeBookingPdf(candidate.pdf),
  };
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
    hotel: normalizeHotel(candidate.hotel),
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
