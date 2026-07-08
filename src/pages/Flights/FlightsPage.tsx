import { motion } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Pencil,
  Plane,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { useAuth } from "@/auth";
import { GlassCard, MapActionButtons, TripImage } from "@/components/ui";
import { PageLoadingGate } from "@/components/layout";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { useLocaleDateTimeFormatter, useTranslation } from "@/i18n";
import { deleteBookingPdf, getBookingPdfUrl, uploadBookingPdf } from "@/lib/bookingPersistence";
import { createMapTarget } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { FlightDirection, FlightSegment } from "@/types/flight";

import { FlightBookingDialog } from "./FlightBookingDialog";

const LIGHT_PAGE_CLASS =
  "min-h-full bg-white text-neutral-950 [--accent:#111827] [--accent-contrast:#ffffff] [--accent-soft:#f5f5f5] [--accent-strong:#111827] [--bg:#ffffff] [--bg-elevated:#ffffff] [--border:229_229_229] [--border-opacity:1] [--highlight:255_255_255] [--highlight-opacity:0.72] [--ink:#171717] [--ink-faint:#d4d4d4] [--ink-muted:#737373] [--shadow-tint:15_23_42] [--surface:255_255_255] [--surface-opacity:0.94] [--surface-strong-opacity:0.98]";

const actionButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm shadow-neutral-200/60 transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const dangerButtonClass =
  "border-orange-200 bg-orange-50 text-orange-700 shadow-orange-100/70";

function createEmptyFlight(direction: FlightDirection, index: number): FlightSegment {
  return {
    id: `flight-${Date.now()}-${index}`,
    direction,
    label: direction === "outbound" ? "Outbound" : "Return",
    airline: "",
    flightNumber: "",
    bookingReference: "",
    notes: "",
    departure: { date: "", time: "09:00", airport: "", airportCode: "", terminal: "", city: "" },
    arrival: { date: "", time: "12:00", airport: "", airportCode: "", terminal: "", city: "" },
    transitTime: "",
    baggage: "",
  };
}

function valueOrEmpty(value?: string) {
  return value?.trim() || "";
}

function valueOrNotProvided(value?: string) {
  return valueOrEmpty(value) || "Not provided";
}

function routeCode(value?: string) {
  return valueOrEmpty(value) || "TBD";
}

function getFlightSeat(flight: FlightSegment) {
  const maybeWithSeat = flight as FlightSegment & { seat?: string; seats?: string };
  return maybeWithSeat.seat || maybeWithSeat.seats || "";
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

function DetailTile({
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

function FlightActionButton({
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

function PdfHero({
  fileName,
  pdfUrl,
  busy,
  canManage,
  onOpen,
  onReplace,
  onRemove,
  onEdit,
  onDelete,
}: {
  fileName?: string;
  pdfUrl: string;
  busy: boolean;
  canManage: boolean;
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
    <motion.section variants={riseIn} className="px-5">
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
                      Add a booking file to show it here.
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
          <FlightActionButton disabled={!hasPdf} onClick={onOpen}>
            <ExternalLink size={15} />
            Open PDF
          </FlightActionButton>
          <FlightActionButton disabled={busy || !canManage} onClick={() => inputRef.current?.click()}>
            <Upload size={15} />
            {busy ? "Saving" : "Replace PDF"}
          </FlightActionButton>
          <FlightActionButton danger disabled={busy || !hasPdf} onClick={onRemove}>
            <X size={15} />
            Remove PDF
          </FlightActionButton>
          <FlightActionButton disabled={!canManage} onClick={onEdit}>
            <Pencil size={15} />
            Edit Booking
          </FlightActionButton>
          <FlightActionButton danger disabled={busy || !canManage} onClick={onDelete}>
            <Trash2 size={15} />
            Delete Booking
          </FlightActionButton>
        </div>
      </div>
    </motion.section>
  );
}

function FlightSegmentCard({
  flight,
  bookingReference,
  formatDate,
  onEdit,
  onDelete,
}: {
  flight: FlightSegment;
  bookingReference: string;
  formatDate: (date: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fromCode = routeCode(flight.departure.airportCode);
  const toCode = routeCode(flight.arrival.airportCode);

  return (
    <motion.article variants={riseIn}>
      <div className="rounded-[1.8rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
              {flight.label}
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-2 text-[2rem] font-bold leading-none text-neutral-950">
              <span>{fromCode}</span>
              <ArrowRight size={23} className="shrink-0 text-neutral-400" />
              <span>{toCode}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-neutral-500">
              {[flight.departure.city, flight.arrival.city].filter(Boolean).join(" to ") ||
                "Route details not provided"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={`Edit ${flight.label} flight booking`}
              onClick={onEdit}
              className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              aria-label={`Delete ${flight.label} flight booking`}
              onClick={onDelete}
              className="flex size-9 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-700 shadow-sm"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl bg-neutral-50 p-4">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-normal text-neutral-500">
              Depart
            </p>
            <p className="mt-1 text-3xl font-bold leading-none text-neutral-950">
              {valueOrNotProvided(flight.departure.time)}
            </p>
            <p className="mt-2 truncate text-xs font-medium text-neutral-500">
              {valueOrNotProvided(flight.departure.terminal)}
            </p>
          </div>
          <ArrowRight size={20} className="text-neutral-400" />
          <div className="min-w-0 text-right">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-normal text-neutral-500">
              Arrive
            </p>
            <p className="mt-1 text-3xl font-bold leading-none text-neutral-950">
              {valueOrNotProvided(flight.arrival.time)}
            </p>
            <p className="mt-2 truncate text-xs font-medium text-neutral-500">
              {valueOrNotProvided(flight.arrival.terminal)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <DetailTile label="Airline" value={flight.airline} />
          <DetailTile label="Flight no." value={flight.flightNumber} />
          <DetailTile label="Departure date" value={formatDate(flight.departure.date)} />
          <DetailTile label="Duration" value={flight.transitTime} />
          <DetailTile label="Departure terminal" value={flight.departure.terminal} />
          <DetailTile label="Arrival terminal" value={flight.arrival.terminal} />
          <DetailTile label="Seat" value={getFlightSeat(flight)} />
          <DetailTile label="Booking ref." value={bookingReference} />
        </div>
      </div>
    </motion.article>
  );
}

export function FlightsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const formatDateTime = useLocaleDateTimeFormatter();
  const { bookings, error, addFlight, deleteFlight, updateFlight } = usePersistentBookings();
  const [editingFlight, setEditingFlight] = useState<FlightSegment | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyFlightId, setBusyFlightId] = useState("");
  const flightsData = bookings.flights;
  const primaryPdfFlight =
    flightsData.segments.find((flight) => getBookingPdfUrl(flight.pdf, flight.pdfDataUrl)) ??
    flightsData.segments[0];
  const primaryPdfUrl = primaryPdfFlight
    ? getBookingPdfUrl(primaryPdfFlight.pdf, primaryPdfFlight.pdfDataUrl)
    : "";

  const formatDate = (date: string) => {
    if (!date || date === "TBD") return "Date not provided";
    const nextDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(nextDate.getTime()) ? date : formatDateTime.format(nextDate);
  };

  async function handleReplacePdf(flight: FlightSegment, file: File | undefined) {
    if (!file) return;
    if (!user) {
      setActionError("Please sign in before attaching a PDF.");
      return;
    }

    setBusyFlightId(flight.id);
    try {
      const previousStoragePath = flight.pdf?.storagePath;
      const pdf = await uploadBookingPdf({
        uid: user.uid,
        bookingType: "flight",
        bookingId: flight.id,
        file,
      });
      const nextFlight = { ...flight, pdf, pdfFileName: pdf.fileName, pdfDataUrl: undefined };
      if (!updateFlight(flight.id, nextFlight)) throw new Error("Could not save this PDF. Please try again.");
      if (previousStoragePath && previousStoragePath !== pdf.storagePath) await deleteBookingPdf(previousStoragePath);
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not attach this PDF.");
    } finally {
      setBusyFlightId("");
    }
  }

  async function handleRemovePdf(flight: FlightSegment) {
    setBusyFlightId(flight.id);
    try {
      const storagePath = flight.pdf?.storagePath;
      const nextFlight = { ...flight, pdf: undefined, pdfFileName: undefined, pdfDataUrl: undefined };
      if (!updateFlight(flight.id, nextFlight)) throw new Error("Could not save this PDF change. Please try again.");
      if (storagePath) await deleteBookingPdf(storagePath);
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not remove this PDF.");
    } finally {
      setBusyFlightId("");
    }
  }

  async function handleDeleteFlight(flight: FlightSegment) {
    const ok = window.confirm(`Delete ${flight.label || "this flight"} booking?`);
    if (!ok) return;

    setBusyFlightId(flight.id);
    try {
      if (flight.pdf?.storagePath) await deleteBookingPdf(flight.pdf.storagePath);
      if (!deleteFlight(flight.id)) throw new Error("Could not delete this flight booking.");
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not delete this flight booking.");
    } finally {
      setBusyFlightId("");
    }
  }

  return (
    <PageLoadingGate>
      <div className={LIGHT_PAGE_CLASS}>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-7 pb-8">
          <header className="px-5 pt-5">
            <p className="text-sm font-semibold text-neutral-500">Travel booking</p>
            <h1 className="mt-1 text-[2.35rem] font-bold leading-tight tracking-normal text-neutral-950">
              {t("flights.title")}
            </h1>
            <p className="mt-1 text-base leading-relaxed text-neutral-500">{t("flights.subtitle")}</p>
          </header>

          {(error || actionError) && (
            <div className="mx-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
              {error || actionError}
            </div>
          )}

          <PdfHero
            fileName={primaryPdfFlight?.pdfFileName}
            pdfUrl={primaryPdfUrl}
            busy={primaryPdfFlight ? busyFlightId === primaryPdfFlight.id : false}
            canManage={Boolean(primaryPdfFlight)}
            onOpen={() => openPdf(primaryPdfUrl)}
            onReplace={(file) => {
              if (primaryPdfFlight) void handleReplacePdf(primaryPdfFlight, file);
            }}
            onRemove={() => {
              if (primaryPdfFlight) void handleRemovePdf(primaryPdfFlight);
            }}
            onEdit={() => {
              if (primaryPdfFlight) setEditingFlight(primaryPdfFlight);
            }}
            onDelete={() => {
              if (primaryPdfFlight) void handleDeleteFlight(primaryPdfFlight);
            }}
          />

          <section className="flex flex-col gap-4 px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-500">Segments</p>
                <h2 className="text-2xl font-bold tracking-normal text-neutral-950">
                  Flight summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingFlight(createEmptyFlight("outbound", flightsData.segments.length + 1))}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <motion.div variants={staggerContainer} className="flex flex-col gap-4">
              {flightsData.segments.map((flight) => (
                <FlightSegmentCard
                  key={flight.id}
                  flight={flight}
                  bookingReference={flight.bookingReference || flightsData.bookingReference}
                  formatDate={formatDate}
                  onEdit={() => setEditingFlight(flight)}
                  onDelete={() => void handleDeleteFlight(flight)}
                />
              ))}
            </motion.div>
          </section>

          <section className="flex flex-col gap-3.5 px-5">
            <div>
              <p className="text-sm font-semibold text-neutral-500">Maps</p>
              <h2 className="text-xl font-bold tracking-normal text-neutral-950">
                {t("flights.airportMapLinks")}
              </h2>
            </div>
            <motion.div variants={staggerContainer} className="flex flex-col gap-3">
              {flightsData.airports.map((airport) => (
                <motion.div key={airport.code} variants={riseIn}>
                  <GlassCard padding="md" className="flex flex-col gap-3 rounded-[1.75rem]">
                    <TripImage
                      seed={`airport-${airport.code.toLowerCase()}`}
                      icon={Plane}
                      className="h-28 w-full rounded-2xl"
                      iconClassName="size-8"
                      alt={airport.name}
                    />
                    <div>
                      <p className="text-lg font-bold tracking-normal text-ink">{airport.code}</p>
                      <p className="text-sm font-semibold text-ink">{airport.name}</p>
                      <p className="text-xs text-ink-muted">
                        {airport.city}, {airport.country} · {airport.terminal}
                      </p>
                    </div>
                    <MapActionButtons
                      target={createMapTarget({
                        name: airport.name,
                        city: airport.city,
                        airportCode: airport.code,
                      })}
                    />
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </section>

          <motion.div variants={riseIn} className="mx-5 grid grid-cols-2 gap-3">
            <GlassCard padding="sm" className="rounded-[1.5rem] text-sm">
              <p className="text-xs text-ink-muted">{t("flights.checkedBaggage")}</p>
              <p className="mt-1 font-semibold text-ink">{flightsData.baggage.checked}</p>
            </GlassCard>
            <GlassCard padding="sm" className="rounded-[1.5rem] text-sm">
              <p className="text-xs text-ink-muted">{t("flights.cabinBaggage")}</p>
              <p className="mt-1 font-semibold text-ink">{flightsData.baggage.cabin}</p>
            </GlassCard>
          </motion.div>

          <FlightBookingDialog
            open={editingFlight !== null}
            flight={editingFlight}
            onClose={() => setEditingFlight(null)}
            onSave={(flight) => {
              const exists = flightsData.segments.some((item) => item.id === flight.id);
              return exists ? updateFlight(flight.id, flight) : addFlight(flight);
            }}
          />
        </motion.div>
      </div>
    </PageLoadingGate>
  );
}

export default FlightsPage;
