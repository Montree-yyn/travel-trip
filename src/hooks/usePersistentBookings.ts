import {
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { flightsData } from "@/data/flights";
import { hotelData } from "@/data/hotel";
import { isFirebaseConfigured } from "@/firebase/config";
import { readBookingsFromStorage, type BookingData } from "@/lib/bookingPersistence";
import {
  getActiveTripId,
  sanitizeFirestoreData,
  sharedTripCollection,
  sharedTripSubDoc,
} from "@/sync/sharedTrip";
import type { BookingPdfMetadata, FlightDirection, FlightEndpoint, FlightSegment } from "@/types/flight";
import type { HotelData } from "@/types/hotel";

const hotelDocId = "primary";
const metadataDocId = "__meta";

type FlightDocument = Partial<FlightSegment> & {
  departureAirportCode?: string;
  arrivalAirportCode?: string;
  departureCity?: string;
  arrivalCity?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  duration?: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  seat?: string;
  seats?: string;
  fileName?: string;
  downloadUrl?: string;
  storagePath?: string;
  documentId?: string;
};

type HotelDocument = Partial<HotelData> & {
  hotelName?: string;
  hotelAddress?: string;
  phoneNumber?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  guest?: string;
  fileName?: string;
  downloadUrl?: string;
  storagePath?: string;
  documentId?: string;
};

function fallbackBookings(): BookingData {
  return {
    flights: flightsData,
    hotel: hotelData,
  };
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeFlightDirection(value: unknown): FlightDirection {
  return value === "return" ? "return" : "outbound";
}

function normalizePdf(data: FlightDocument | HotelDocument): BookingPdfMetadata | undefined {
  const pdf = data.pdf;
  const fileName = normalizeString(pdf?.fileName || data.fileName || data.pdfFileName);
  const storagePath = normalizeString(pdf?.storagePath || data.storagePath);
  const downloadURL = normalizeString(pdf?.downloadURL || data.downloadUrl);
  const uploadedAt = normalizeString(pdf?.uploadedAt, new Date().toISOString());
  const documentId = normalizeString(pdf?.documentId || data.documentId);
  if (!fileName && !storagePath && !downloadURL) return undefined;
  return { fileName, storagePath, downloadURL, uploadedAt, documentId: documentId || undefined };
}

function normalizeEndpoint(
  endpoint: Partial<FlightEndpoint> | undefined,
  flat: {
    date?: string;
    time?: string;
    airport?: string;
    airportCode?: string;
    terminal?: string;
    city?: string;
  },
): FlightEndpoint {
  return {
    date: normalizeString(endpoint?.date || flat.date),
    time: normalizeString(endpoint?.time || flat.time),
    airport: normalizeString(endpoint?.airport || flat.airport),
    airportCode: normalizeString(endpoint?.airportCode || flat.airportCode),
    terminal: normalizeString(endpoint?.terminal || flat.terminal),
    city: normalizeString(endpoint?.city || flat.city),
  };
}

function normalizeFlightDoc(snapshot: QueryDocumentSnapshot): FlightSegment | null {
  if (snapshot.id === metadataDocId) return null;
  const data = snapshot.data() as FlightDocument;
  if (!data.airline && !data.flightNumber && !data.departure && !data.arrival) return null;
  const pdf = normalizePdf(data);
  const segment: FlightSegment & { seat?: string } = {
    id: normalizeString(data.id, snapshot.id),
    direction: normalizeFlightDirection(data.direction),
    label: normalizeString(data.label, data.direction === "return" ? "Return" : "Outbound"),
    airline: normalizeString(data.airline),
    flightNumber: normalizeString(data.flightNumber),
    bookingReference: normalizeString(data.bookingReference),
    notes: normalizeString(data.notes),
    pdfFileName: normalizeString(data.pdfFileName || data.fileName || pdf?.fileName) || undefined,
    pdfDataUrl: normalizeString(data.pdfDataUrl) || undefined,
    pdf,
    departure: normalizeEndpoint(data.departure, {
      date: data.departureDate,
      time: data.departureTime,
      airport: data.departureAirport,
      airportCode: data.departureAirportCode,
      terminal: data.departureTerminal,
      city: data.departureCity,
    }),
    arrival: normalizeEndpoint(data.arrival, {
      date: data.arrivalDate,
      time: data.arrivalTime,
      airport: data.arrivalAirport,
      airportCode: data.arrivalAirportCode,
      terminal: data.arrivalTerminal,
      city: data.arrivalCity,
    }),
    transitTime: normalizeString(data.transitTime || data.duration),
    baggage: normalizeString(data.baggage),
  };

  const seat = normalizeString(data.seat || data.seats);
  if (seat) segment.seat = seat;
  return segment;
}

function serializeFlight({
  flight,
  tripId,
  uid,
  isCreate,
}: {
  flight: FlightSegment;
  tripId: string;
  uid: string;
  isCreate?: boolean;
}) {
  const maybeWithSeat = flight as FlightSegment & { seat?: string; seats?: string };
  return sanitizeFirestoreData({
    ...flight,
    tripId,
    departureAirportCode: flight.departure.airportCode,
    arrivalAirportCode: flight.arrival.airportCode,
    departureCity: flight.departure.city,
    arrivalCity: flight.arrival.city,
    departureAirport: flight.departure.airport,
    arrivalAirport: flight.arrival.airport,
    departureDate: flight.departure.date,
    departureTime: flight.departure.time,
    arrivalDate: flight.arrival.date,
    arrivalTime: flight.arrival.time,
    duration: flight.transitTime,
    departureTerminal: flight.departure.terminal,
    arrivalTerminal: flight.arrival.terminal,
    seat: maybeWithSeat.seat || maybeWithSeat.seats,
    fileName: flight.pdf?.fileName || flight.pdfFileName,
    downloadUrl: flight.pdf?.downloadURL,
    storagePath: flight.pdf?.storagePath,
    documentId: flight.pdf?.documentId,
    createdAt: isCreate ? serverTimestamp() : undefined,
    updatedAt: serverTimestamp(),
    createdBy: isCreate ? uid : undefined,
    updatedBy: uid,
  });
}

function normalizeHotelDoc(data: HotelDocument | undefined): HotelData {
  if (!data) return hotelData;
  const pdf = normalizePdf(data);
  return {
    name: normalizeString(data.name || data.hotelName),
    address: normalizeString(data.address || data.hotelAddress),
    phone: normalizeString(data.phone || data.phoneNumber),
    checkIn: {
      date: normalizeString(data.checkIn?.date || data.checkInDate),
      time: normalizeString(data.checkIn?.time || data.checkInTime),
    },
    checkOut: {
      date: normalizeString(data.checkOut?.date || data.checkOutDate),
      time: normalizeString(data.checkOut?.time || data.checkOutTime),
    },
    roomType: normalizeString(data.roomType),
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    confirmationNo: normalizeString(data.confirmationNo || data.confirmationNumber),
    bookingNo: normalizeString(data.bookingNo || data.bookingNumber),
    guestName: normalizeString(data.guestName || data.guest),
    notes: normalizeString(data.notes) || undefined,
    pdfFileName: normalizeString(data.pdfFileName || data.fileName || pdf?.fileName) || undefined,
    pdfDataUrl: normalizeString(data.pdfDataUrl) || undefined,
    pdf,
  };
}

function calculateNights(checkInDate: string, checkOutDate: string) {
  const checkIn = new Date(`${checkInDate}T00:00:00`);
  const checkOut = new Date(`${checkOutDate}T00:00:00`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return undefined;
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  return nights > 0 ? nights : undefined;
}

function serializeHotel({
  hotel,
  tripId,
  uid,
  isCreate,
}: {
  hotel: HotelData;
  tripId: string;
  uid: string;
  isCreate?: boolean;
}) {
  return sanitizeFirestoreData({
    ...hotel,
    id: hotelDocId,
    tripId,
    hotelName: hotel.name,
    hotelAddress: hotel.address,
    roomType: hotel.roomType,
    guest: hotel.guestName,
    checkInDate: hotel.checkIn.date,
    checkInTime: hotel.checkIn.time,
    checkOutDate: hotel.checkOut.date,
    checkOutTime: hotel.checkOut.time,
    numberOfNights: calculateNights(hotel.checkIn.date, hotel.checkOut.date),
    bookingNumber: hotel.bookingNo,
    confirmationNumber: hotel.confirmationNo,
    phoneNumber: hotel.phone,
    fileName: hotel.pdf?.fileName || hotel.pdfFileName,
    downloadUrl: hotel.pdf?.downloadURL,
    storagePath: hotel.pdf?.storagePath,
    documentId: hotel.pdf?.documentId,
    createdAt: isCreate ? serverTimestamp() : undefined,
    updatedAt: serverTimestamp(),
    createdBy: isCreate ? uid : undefined,
    updatedBy: uid,
  });
}

async function migrateLegacyBookingsIfNeeded(uid: string, tripId: string) {
  const flightsRef = sharedTripCollection(tripId, "flights");
  const [flightSnapshot, hotelSnapshot] = await Promise.all([
    getDocs(flightsRef),
    getDoc(sharedTripSubDoc(tripId, "hotels", hotelDocId)),
  ]);
  const legacyBookings = readBookingsFromStorage();
  const batch = writeBatch(flightsRef.firestore);
  let hasWrites = false;

  if (flightSnapshot.empty) {
    batch.set(
      sharedTripSubDoc(tripId, "flights", metadataDocId),
      sanitizeFirestoreData({
        kind: "metadata",
        tripId,
        initializedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      }),
      { merge: true },
    );
    hasWrites = true;

    for (const flight of legacyBookings.flights.segments) {
      batch.set(
        sharedTripSubDoc(tripId, "flights", flight.id),
        serializeFlight({ flight, tripId, uid, isCreate: true }),
        { merge: true },
      );
      hasWrites = true;
    }
  }

  if (!hotelSnapshot.exists()) {
    batch.set(
      sharedTripSubDoc(tripId, "hotels", hotelDocId),
      serializeHotel({ hotel: legacyBookings.hotel, tripId, uid, isCreate: true }),
      { merge: true },
    );
    hasWrites = true;
  }

  if (hasWrites) await batch.commit();
}

function sortFlights(segments: FlightSegment[]) {
  return [...segments].sort((left, right) => {
    const leftKey = `${left.departure.date} ${left.departure.time} ${left.id}`;
    const rightKey = `${right.departure.date} ${right.departure.time} ${right.id}`;
    return leftKey.localeCompare(rightKey);
  });
}

export function usePersistentBookings() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingData>(() =>
    isFirebaseConfigured() ? fallbackBookings() : readBookingsFromStorage(),
  );
  const [error, setError] = useState("");
  const migrationKeyRef = useRef("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setBookings(readBookingsFromStorage());
      setError("Cloud sync is not configured. Booking changes may stay on this device.");
      return;
    }

    if (authLoading || !user) return;

    const tripId = getActiveTripId();
    let flightSegments = flightsData.segments;
    let hotel = hotelData;

    function commit() {
      setBookings({
        flights: {
          ...flightsData,
          segments: sortFlights(flightSegments),
        },
        hotel,
      });
    }

    const unsubscribeFlights = onSnapshot(
      sharedTripCollection(tripId, "flights"),
      (snapshot) => {
        flightSegments = snapshot.empty
          ? flightsData.segments
          : snapshot.docs
              .map(normalizeFlightDoc)
              .filter((flight): flight is FlightSegment => flight !== null);
        commit();

        const migrationKey = `${user.uid}:${tripId}:bookings`;
        if (snapshot.empty && !snapshot.metadata.fromCache && migrationKeyRef.current !== migrationKey) {
          migrationKeyRef.current = migrationKey;
          void migrateLegacyBookingsIfNeeded(user.uid, tripId).catch((migrationError) => {
            console.error("[travel-trip-sync] Could not migrate legacy booking data", migrationError);
          });
        }
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Flights snapshot failed", snapshotError);
        setError("Could not load shared flight bookings. Please refresh and try again.");
      },
    );

    const unsubscribeHotel = onSnapshot(
      sharedTripSubDoc(tripId, "hotels", hotelDocId),
      (snapshot) => {
        hotel = snapshot.exists() ? normalizeHotelDoc(snapshot.data() as HotelDocument) : hotelData;
        commit();
      },
      (snapshotError) => {
        console.error("[travel-trip-sync] Hotel snapshot failed", snapshotError);
        setError("Could not load shared hotel booking. Please refresh and try again.");
      },
    );

    return () => {
      unsubscribeFlights();
      unsubscribeHotel();
    };
  }, [authLoading, user]);

  const updateFlight = useCallback(
    (flightId: string, input: FlightSegment) => {
      setBookings((current) => ({
        ...current,
        flights: {
          ...current.flights,
          segments: current.flights.segments.map((flight) => (flight.id === flightId ? input : flight)),
        },
      }));

      if (!user || !isFirebaseConfigured()) {
        setError("Please sign in before saving flight changes.");
        return false;
      }

      const tripId = getActiveTripId();
      void setDoc(
        sharedTripSubDoc(tripId, "flights", flightId),
        serializeFlight({ flight: input, tripId, uid: user.uid }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Flight save failed", saveError);
        setError("Could not save this flight to the shared trip. Please try again.");
      });
      return true;
    },
    [user],
  );

  const addFlight = useCallback(
    (input: FlightSegment) => {
      setBookings((current) => ({
        ...current,
        flights: {
          ...current.flights,
          segments: [...current.flights.segments, input],
        },
      }));

      if (!user || !isFirebaseConfigured()) {
        setError("Please sign in before saving flight changes.");
        return false;
      }

      const tripId = getActiveTripId();
      void setDoc(
        sharedTripSubDoc(tripId, "flights", input.id),
        serializeFlight({ flight: input, tripId, uid: user.uid, isCreate: true }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Flight create failed", saveError);
        setError("Could not add this flight to the shared trip. Please try again.");
      });
      return true;
    },
    [user],
  );

  const deleteFlight = useCallback(
    (flightId: string) => {
      setBookings((current) => ({
        ...current,
        flights: {
          ...current.flights,
          segments: current.flights.segments.filter((flight) => flight.id !== flightId),
        },
      }));

      if (!user || !isFirebaseConfigured()) {
        setError("Please sign in before deleting flight changes.");
        return false;
      }

      const tripId = getActiveTripId();
      void deleteDoc(sharedTripSubDoc(tripId, "flights", flightId)).catch((deleteError) => {
        console.error("[travel-trip-sync] Flight delete failed", deleteError);
        setError("Could not delete this flight from the shared trip. Please try again.");
      });
      return true;
    },
    [user],
  );

  const updateHotel = useCallback(
    (input: HotelData) => {
      setBookings((current) => ({
        ...current,
        hotel: input,
      }));

      if (!user || !isFirebaseConfigured()) {
        setError("Please sign in before saving hotel changes.");
        return false;
      }

      const tripId = getActiveTripId();
      void setDoc(
        sharedTripSubDoc(tripId, "hotels", hotelDocId),
        serializeHotel({ hotel: input, tripId, uid: user.uid }),
        { merge: true },
      ).catch((saveError) => {
        console.error("[travel-trip-sync] Hotel save failed", saveError);
        setError("Could not save this hotel to the shared trip. Please try again.");
      });
      return true;
    },
    [user],
  );

  return {
    bookings,
    error,
    addFlight,
    deleteFlight,
    updateFlight,
    updateHotel,
  };
}
