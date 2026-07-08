import { useCallback, useState } from "react";

import { readBookingsFromStorage, writeBookingsToStorage } from "@/lib/bookingPersistence";
import type { FlightSegment } from "@/types/flight";
import type { HotelData } from "@/types/hotel";

export function usePersistentBookings() {
  const [bookings, setBookings] = useState(() => readBookingsFromStorage());
  const [error, setError] = useState("");

  const persist = useCallback((nextBookings: typeof bookings) => {
    try {
      writeBookingsToStorage(nextBookings);
      setBookings(nextBookings);
      setError("");
      return true;
    } catch {
      setError("Could not save booking changes. Please try again.");
      return false;
    }
  }, []);

  const updateFlight = useCallback(
    (flightId: string, input: FlightSegment) =>
      persist({
        ...bookings,
        flights: {
          ...bookings.flights,
          segments: bookings.flights.segments.map((flight) => (flight.id === flightId ? input : flight)),
        },
      }),
    [bookings, persist],
  );

  const addFlight = useCallback(
    (input: FlightSegment) =>
      persist({
        ...bookings,
        flights: {
          ...bookings.flights,
          segments: [...bookings.flights.segments, input],
        },
      }),
    [bookings, persist],
  );

  const deleteFlight = useCallback(
    (flightId: string) =>
      persist({
        ...bookings,
        flights: {
          ...bookings.flights,
          segments: bookings.flights.segments.filter((flight) => flight.id !== flightId),
        },
      }),
    [bookings, persist],
  );

  const updateHotel = useCallback(
    (input: HotelData) =>
      persist({
        ...bookings,
        hotel: input,
      }),
    [bookings, persist],
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
