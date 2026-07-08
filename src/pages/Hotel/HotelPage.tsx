import { motion } from "framer-motion";
import {
  Building2,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { useAuth } from "@/auth";
import { PageLoadingGate } from "@/components/layout";
import { riseIn, scaleIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { useLocaleDateTimeFormatter, useTranslation } from "@/i18n";
import { deleteBookingPdf, getBookingPdfUrl, uploadBookingPdf } from "@/lib/bookingPersistence";
import { buildGoogleMapsUrl, createMapTarget } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { HotelData } from "@/types/hotel";

import { HotelBookingDialog } from "./HotelBookingDialog";

const LIGHT_PAGE_CLASS =
  "min-h-full bg-white text-neutral-950 [--accent:#111827] [--accent-contrast:#ffffff] [--accent-soft:#f5f5f5] [--accent-strong:#111827] [--bg:#ffffff] [--bg-elevated:#ffffff] [--border:229_229_229] [--border-opacity:1] [--highlight:255_255_255] [--highlight-opacity:0.72] [--ink:#171717] [--ink-faint:#d4d4d4] [--ink-muted:#737373] [--shadow-tint:15_23_42] [--surface:255_255_255] [--surface-opacity:0.94] [--surface-strong-opacity:0.98]";

const actionButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm shadow-neutral-200/60 transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const dangerButtonClass =
  "border-orange-200 bg-orange-50 text-orange-700 shadow-orange-100/70";

function createEmptyHotel(): HotelData {
  return {
    name: "",
    address: "",
    phone: "",
    checkIn: { date: "", time: "14:00" },
    checkOut: { date: "", time: "11:00" },
    roomType: "",
    amenities: [],
    confirmationNo: "",
    bookingNo: "",
    guestName: "",
    notes: "",
  };
}

function valueOrEmpty(value?: string) {
  return value?.trim() || "";
}

function valueOrNotProvided(value?: string) {
  return valueOrEmpty(value) || "Not provided";
}

function isImageFile(fileName: string, url: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(fileName) || url.startsWith("data:image/");
}

function pdfPreviewUrl(url: string) {
  if (!url || isImageFile("", url)) return url;
  return `${url}${url.includes("#") ? "&" : "#"}page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
}

function openPdf(url: string) {
  if (!url) return;
  window.open(url, "_blank", "noreferrer");
}

function calculateNights(checkInDate: string, checkOutDate: string) {
  const checkIn = new Date(`${checkInDate}T00:00:00`);
  const checkOut = new Date(`${checkOutDate}T00:00:00`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return "";
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  return nights > 0 ? String(nights) : "";
}

function HotelActionButton({
  children,
  danger,
  className,
  ...props
}: {
  children: ReactNode;
  danger?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(actionButtonClass, danger && dangerButtonClass, className)}
      {...props}
    >
      {children}
    </button>
  );
}

function InfoTile({
  label,
  value,
  className,
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-2xl bg-neutral-50 p-3", className)}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-normal text-neutral-500">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-semibold leading-snug text-neutral-950">
        {valueOrNotProvided(value)}
      </p>
    </div>
  );
}

function PdfHero({
  fileName,
  pdfUrl,
  busy,
  onOpen,
  onReplace,
  onRemove,
  onEdit,
  onDelete,
}: {
  fileName?: string;
  pdfUrl: string;
  busy: boolean;
  onOpen: () => void;
  onReplace: (file: File | undefined) => void;
  onRemove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayName = valueOrEmpty(fileName) || "No PDF attached";
  const hasPdf = Boolean(pdfUrl);
  const isImage = hasPdf && isImageFile(displayName, pdfUrl);

  return (
    <motion.section variants={scaleIn} className="px-5">
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.55)]">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            onReplace(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <div className="mx-auto max-w-[25rem]">
          <div className="relative overflow-hidden rounded-[1.7rem] bg-neutral-100 p-2 shadow-inner">
            <div className="aspect-[210/297] overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white">
              {hasPdf ? (
                isImage ? (
                  <img
                    src={pdfUrl}
                    alt={displayName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    title={displayName}
                    src={pdfPreviewUrl(pdfUrl)}
                    className="h-full w-full bg-white"
                  />
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                    <FileText size={28} />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-neutral-950">No PDF attached</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                      Add a hotel voucher to show it here.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {hasPdf && (
              <button
                type="button"
                aria-label={`Open ${displayName}`}
                className="absolute inset-2 rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
                onClick={onOpen}
              />
            )}
          </div>
        </div>

        <p className="mt-4 break-words text-center text-sm font-semibold text-neutral-700">
          {displayName}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <HotelActionButton disabled={!hasPdf} onClick={onOpen}>
            <ExternalLink size={15} />
            Open PDF
          </HotelActionButton>
          <HotelActionButton disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload size={15} />
            {busy ? "Saving" : "Replace PDF"}
          </HotelActionButton>
          <HotelActionButton danger disabled={busy || !hasPdf} onClick={onRemove}>
            <X size={15} />
            Remove PDF
          </HotelActionButton>
          <HotelActionButton onClick={onEdit}>
            <Pencil size={15} />
            Edit Booking
          </HotelActionButton>
          <HotelActionButton danger disabled={busy} onClick={onDelete}>
            <Trash2 size={15} />
            Delete Booking
          </HotelActionButton>
        </div>
      </div>
    </motion.section>
  );
}

function HotelInfoCard({
  hotel,
  formatDate,
}: {
  hotel: HotelData;
  formatDate: (date: string) => string;
}) {
  const nights = calculateNights(hotel.checkIn.date, hotel.checkOut.date);
  const mapTarget = createMapTarget({ name: hotel.name, address: hotel.address });

  return (
    <motion.section variants={riseIn} className="px-5">
      <div className="rounded-[1.8rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)]">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
            <Building2 size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
              Hotel booking
            </p>
            <h2 className="mt-1 text-2xl font-bold leading-tight tracking-normal text-neutral-950">
              {valueOrNotProvided(hotel.name)}
            </h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoTile label="Hotel address" value={hotel.address} className="col-span-2" />
          <InfoTile label="Room type" value={hotel.roomType} className="col-span-2" />
          <InfoTile label="Guest" value={hotel.guestName} className="col-span-2" />
          <InfoTile
            label="Check-in"
            value={`${formatDate(hotel.checkIn.date)} ${hotel.checkIn.time || ""}`.trim()}
          />
          <InfoTile
            label="Check-out"
            value={`${formatDate(hotel.checkOut.date)} ${hotel.checkOut.time || ""}`.trim()}
          />
          <InfoTile label="Number of nights" value={nights} />
          <InfoTile label="Booking number" value={hotel.bookingNo} />
          <InfoTile label="Confirmation number" value={hotel.confirmationNo} className="col-span-2" />
          {valueOrEmpty(hotel.phone) && (
            <InfoTile label="Phone number" value={hotel.phone} className="col-span-2" />
          )}
        </div>

        <a
          href={buildGoogleMapsUrl(mapTarget)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm shadow-neutral-200/60"
        >
          <MapPin size={16} />
          Google Maps
        </a>
      </div>
    </motion.section>
  );
}

export function HotelPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const formatDateTime = useLocaleDateTimeFormatter();
  const { bookings, error, updateHotel } = usePersistentBookings();
  const hotelData = bookings.hotel;
  const [editorOpen, setEditorOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const hasHotelBooking = Boolean(hotelData.name.trim() || hotelData.bookingNo.trim() || hotelData.pdfFileName);
  const pdfUrl = getBookingPdfUrl(hotelData.pdf, hotelData.pdfDataUrl);
  const formatDate = (date: string) => {
    if (!date) return "Date not provided";
    const nextDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(nextDate.getTime()) ? date : formatDateTime.format(nextDate);
  };

  async function handleReplacePdf(file: File | undefined) {
    if (!file) return;
    if (!user) {
      setActionError("Please sign in before attaching a PDF.");
      return;
    }

    setPdfBusy(true);
    try {
      const previousStoragePath = hotelData.pdf?.storagePath;
      const pdf = await uploadBookingPdf({
        uid: user.uid,
        bookingType: "hotel",
        bookingId: hotelData.bookingNo || hotelData.confirmationNo || "hotel",
        file,
      });
      const nextHotel = { ...hotelData, pdf, pdfFileName: pdf.fileName, pdfDataUrl: undefined };
      if (!updateHotel(nextHotel)) throw new Error("Could not save this PDF. Please try again.");
      if (previousStoragePath && previousStoragePath !== pdf.storagePath) await deleteBookingPdf(previousStoragePath);
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not attach this PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleRemovePdf() {
    setPdfBusy(true);
    try {
      const storagePath = hotelData.pdf?.storagePath;
      const nextHotel = { ...hotelData, pdf: undefined, pdfFileName: undefined, pdfDataUrl: undefined };
      if (!updateHotel(nextHotel)) throw new Error("Could not save this PDF change. Please try again.");
      if (storagePath) await deleteBookingPdf(storagePath);
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not remove this PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleDeleteHotel() {
    const ok = window.confirm("Delete this hotel booking?");
    if (!ok) return;

    setPdfBusy(true);
    try {
      if (hotelData.pdf?.storagePath) await deleteBookingPdf(hotelData.pdf.storagePath);
      if (!updateHotel(createEmptyHotel())) throw new Error("Could not delete this hotel booking.");
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not delete this hotel booking.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <PageLoadingGate>
      <div className={LIGHT_PAGE_CLASS}>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-7 pb-8">
          <header className="px-5 pt-5">
            <p className="text-sm font-semibold text-neutral-500">Travel booking</p>
            <h1 className="mt-1 text-[2.35rem] font-bold leading-tight tracking-normal text-neutral-950">
              {t("hotel.title")}
            </h1>
            <p className="mt-1 text-base leading-relaxed text-neutral-500">{t("hotel.subtitle")}</p>
          </header>

          {(error || actionError) && (
            <div className="mx-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
              {error || actionError}
            </div>
          )}

          {hasHotelBooking ? (
            <>
              <PdfHero
                fileName={hotelData.pdfFileName}
                pdfUrl={pdfUrl}
                busy={pdfBusy}
                onOpen={() => openPdf(pdfUrl)}
                onReplace={handleReplacePdf}
                onRemove={() => void handleRemovePdf()}
                onEdit={() => setEditorOpen(true)}
                onDelete={() => void handleDeleteHotel()}
              />
              <HotelInfoCard hotel={hotelData} formatDate={formatDate} />
            </>
          ) : (
            <motion.div variants={riseIn} className="mx-5">
              <div className="rounded-[1.8rem] border border-neutral-200 bg-white p-5 text-center shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)]">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                  <Building2 size={24} />
                </span>
                <p className="mt-3 text-base font-semibold text-neutral-950">No hotel booking saved</p>
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm"
                >
                  <Plus size={16} />
                  Add Hotel Booking
                </button>
              </div>
            </motion.div>
          )}

          <HotelBookingDialog
            open={editorOpen}
            hotel={hotelData}
            onClose={() => setEditorOpen(false)}
            onSave={updateHotel}
          />
        </motion.div>
      </div>
    </PageLoadingGate>
  );
}

export default HotelPage;
