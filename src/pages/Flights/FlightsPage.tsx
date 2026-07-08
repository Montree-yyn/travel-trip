import { motion } from "framer-motion";
import { ArrowRight, FileText, Pencil, Plane, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "@/auth";
import { Button, Chip, GlassCard, MapActionButtons, SectionHeader, ThemeToggle, TripImage } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { useLocaleDateTimeFormatter, useTranslation } from "@/i18n";
import { deleteBookingPdf, getBookingPdfUrl, uploadBookingPdf } from "@/lib/bookingPersistence";
import { createMapTarget } from "@/lib/maps";
import type { FlightDirection, FlightSegment } from "@/types/flight";

import { FlightBookingDialog } from "./FlightBookingDialog";

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

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value?.trim() || "TBD"}</span>
    </div>
  );
}

function PdfPreviewBlock({
  fileName,
  pdfUrl,
  busy,
  onOpen,
  onReplace,
  onRemove,
}: {
  fileName: string;
  pdfUrl: string;
  busy: boolean;
  onOpen: () => void;
  onReplace: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-ink/5 p-3">
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
      <div className="h-64 overflow-hidden rounded-2xl border border-ink/10 bg-white/70 dark:bg-white/5">
        {pdfUrl ? (
          <object data={pdfUrl} type="application/pdf" className="h-full w-full">
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <FileText size={32} className="text-accent-strong" />
              <p className="break-all text-sm font-semibold text-ink">{fileName}</p>
            </div>
          </object>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <FileText size={32} className="text-accent-strong" />
            <p className="break-all text-sm font-semibold text-ink">{fileName}</p>
          </div>
        )}
      </div>
      <p className="break-all text-sm font-semibold text-ink">{fileName}</p>
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="secondary" disabled={busy || !pdfUrl} onClick={onOpen}>Open</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Saving..." : "Replace"}
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} className="text-red-500" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}

function FlightCard({
  flight,
  formatDate,
  onEdit,
  onDelete,
  onReplacePdf,
  onRemovePdf,
  pdfBusy,
}: {
  flight: FlightSegment;
  formatDate: (date: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onReplacePdf: (file: File | undefined) => void;
  onRemovePdf: () => void;
  pdfBusy: boolean;
}) {
  const airportSeed = `airport-${flight.arrival.airportCode.toLowerCase()}`;
  const pdfUrl = getBookingPdfUrl(flight.pdf, flight.pdfDataUrl);
  const route = `${flight.departure.airportCode || "TBD"} to ${flight.arrival.airportCode || "TBD"}`;

  return (
    <motion.div variants={riseIn}>
      <GlassCard elevated padding="md" className="mx-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            <Plane size={18} />
          </span>
          <div className="flex items-center gap-2">
            <Chip tone="accent">{flight.label}</Chip>
            <button
              type="button"
              aria-label="Edit flight booking"
              onClick={onEdit}
              className="glass-surface flex size-10 items-center justify-center rounded-full text-ink-muted"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              aria-label="Delete flight booking"
              onClick={onDelete}
              className="glass-surface flex size-10 items-center justify-center rounded-full text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[0.6875rem] font-semibold uppercase text-accent-strong">{flight.airline || "Airline TBD"}</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-ink">
            <span>{flight.departure.airportCode || "TBD"}</span>
            <ArrowRight size={17} className="text-ink-faint" />
            <span>{flight.arrival.airportCode || "TBD"}</span>
          </h2>
        </div>

        <div className="grid gap-2 rounded-2xl bg-ink/5 p-3">
          <DetailRow label="Route" value={route} />
          <DetailRow label="Date" value={formatDate(flight.departure.date)} />
          <DetailRow label="Departure time" value={flight.departure.time} />
          <DetailRow label="Arrival time" value={flight.arrival.time} />
          <DetailRow label="Airline" value={flight.airline} />
          <DetailRow label="Flight number" value={flight.flightNumber} />
          <DetailRow label="Booking reference" value={flight.bookingReference} />
        </div>

        {flight.pdfFileName && (
          <PdfPreviewBlock
            fileName={flight.pdfFileName}
            pdfUrl={pdfUrl}
            busy={pdfBusy}
            onOpen={() => {
              if (pdfUrl) window.open(pdfUrl, "_blank", "noreferrer");
            }}
            onReplace={onReplacePdf}
            onRemove={onRemovePdf}
          />
        )}

        {!flight.pdfFileName && (
          <TripImage
            seed={airportSeed}
            icon={Plane}
            className="h-28 w-full rounded-2xl"
            iconClassName="size-8"
            alt={flight.arrival.airport}
          />
        )}

        <Button variant="secondary" fullWidth className="text-red-500" onClick={onDelete}>
          <Trash2 size={15} />
          Delete Booking
        </Button>
      </GlassCard>
    </motion.div>
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
  const formatDate = (date: string) => {
    if (!date || date === "TBD") return "Date TBD";
    const nextDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(nextDate.getTime()) ? date : formatDateTime.format(nextDate);
  };
  const flightsData = bookings.flights;

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
      <PageAccent tone="indigo">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
        <PageHeader title={t("flights.title")} subtitle={t("flights.subtitle")} actions={<ThemeToggle />} />

        {(error || actionError) && (
          <GlassCard padding="md" className="mx-5 text-sm font-semibold text-red-500">
            {error || actionError}
          </GlassCard>
        )}

        <div className="flex flex-col gap-3.5">
          <SectionHeader title={t("flights.flightDetails")} />
          <div className="px-5">
            <Button
              fullWidth
              onClick={() => setEditingFlight(createEmptyFlight("outbound", flightsData.segments.length + 1))}
            >
              <Plus size={16} />
              Add Flight
            </Button>
          </div>
          <motion.div variants={staggerContainer} className="flex flex-col gap-4">
            {flightsData.segments.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                formatDate={formatDate}
                onEdit={() => setEditingFlight(flight)}
                onDelete={() => void handleDeleteFlight(flight)}
                onReplacePdf={(file) => void handleReplacePdf(flight, file)}
                onRemovePdf={() => void handleRemovePdf(flight)}
                pdfBusy={busyFlightId === flight.id}
              />
            ))}
          </motion.div>
        </div>

        <div className="flex flex-col gap-3.5">
          <SectionHeader title={t("flights.airportMapLinks")} />
          <motion.div variants={staggerContainer} className="flex flex-col gap-3 px-5">
            {flightsData.airports.map((airport) => (
              <motion.div key={airport.code} variants={riseIn}>
                <GlassCard padding="md" className="flex flex-col gap-3">
                  <TripImage
                    seed={`airport-${airport.code.toLowerCase()}`}
                    icon={Plane}
                    className="h-28 w-full rounded-2xl"
                    iconClassName="size-8"
                    alt={airport.name}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold tracking-tight text-ink">{airport.code}</p>
                      <p className="text-sm font-semibold text-ink">{airport.name}</p>
                      <p className="text-xs text-ink-muted">
                        {airport.city}, {airport.country} · {airport.terminal}
                      </p>
                    </div>
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
        </div>

        <motion.div variants={riseIn} className="mx-5 grid grid-cols-2 gap-3">
          <GlassCard padding="sm" className="text-sm">
            <p className="text-xs text-ink-muted">{t("flights.checkedBaggage")}</p>
            <p className="mt-1 font-semibold text-ink">{flightsData.baggage.checked}</p>
          </GlassCard>
          <GlassCard padding="sm" className="text-sm">
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
    </PageAccent>
    </PageLoadingGate>
  );
}

export default FlightsPage;
