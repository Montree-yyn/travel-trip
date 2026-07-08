import type { BookingPdfMetadata } from "./flight";

export interface HotelDateTime {
  date: string;
  time: string;
}

export interface HotelData {
  name: string;
  address: string;
  phone: string;
  checkIn: HotelDateTime;
  checkOut: HotelDateTime;
  roomType: string;
  amenities: string[];
  confirmationNo: string;
  bookingNo: string;
  guestName: string;
  numberOfNights?: string;
  googleMapsUrl?: string;
  notes?: string;
  pdfFileName?: string;
  pdfDataUrl?: string;
  pdf?: BookingPdfMetadata;
}
