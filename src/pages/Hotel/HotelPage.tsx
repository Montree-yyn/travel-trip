import { motion } from "framer-motion";
import { BedDouble, FileText, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "@/auth";
import { Button, GlassCard, ThemeToggle, TripImage } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { riseIn, scaleIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { useLocaleDateTimeFormatter, useTranslation } from "@/i18n";
import { deleteBookingPdf, getBookingPdfUrl, uploadBookingPdf } from "@/lib/bookingPersistence";
import type { HotelData } from "@/types/hotel";

import { HotelBookingDialog } from "./HotelBookingDialog";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}

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
    if (!date) return "Date TBD";
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
    <PageAccent tone="green">
      <PageLoadingGate>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
          <PageHeader title={t("hotel.title")} subtitle={t("hotel.subtitle")} actions={<ThemeToggle />} />

          {(error || actionError) && (
            <GlassCard padding="md" className="mx-5 text-sm font-semibold text-red-500">
              {error || actionError}
            </GlassCard>
          )}

          {hasHotelBooking ? (
            <motion.div variants={scaleIn}>
              <GlassCard elevated padding="md" className="mx-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                    <BedDouble size={18} />
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Edit hotel booking"
                      onClick={() => setEditorOpen(true)}
                      className="glass-surface flex size-10 items-center justify-center rounded-full text-ink-muted"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete hotel booking"
                      onClick={() => void handleDeleteHotel()}
                      className="glass-surface flex size-10 items-center justify-center rounded-full text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[0.6875rem] font-semibold uppercase text-accent-strong">Hotel booking</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">{hotelData.name || "Hotel TBD"}</h2>
                  <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-ink-muted">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-accent-strong" />
                    {hotelData.address || "Address TBD"}
                  </p>
                </div>

                <div className="grid gap-2 rounded-2xl bg-ink/5 p-3">
                  <DetailRow label="Check-in" value={`${formatDate(hotelData.checkIn.date)} ${hotelData.checkIn.time || ""}`.trim()} />
                  <DetailRow label="Check-out" value={`${formatDate(hotelData.checkOut.date)} ${hotelData.checkOut.time || ""}`.trim()} />
                  <DetailRow label="Booking reference" value={hotelData.bookingNo || hotelData.confirmationNo} />
                </div>

                {hotelData.pdfFileName ? (
                  <PdfPreviewBlock
                    fileName={hotelData.pdfFileName}
                    pdfUrl={pdfUrl}
                    busy={pdfBusy}
                    onOpen={() => {
                      if (pdfUrl) window.open(pdfUrl, "_blank", "noreferrer");
                    }}
                    onReplace={handleReplacePdf}
                    onRemove={() => void handleRemovePdf()}
                  />
                ) : (
                  <TripImage
                    seed="hotel-smile-osaka"
                    icon={BedDouble}
                    priority
                    className="h-28 w-full rounded-2xl"
                    iconClassName="size-8"
                    alt={hotelData.name}
                  />
                )}

                <Button variant="secondary" fullWidth onClick={() => setEditorOpen(true)}>
                  <Pencil size={15} />
                  Edit Booking
                </Button>
                <Button variant="secondary" fullWidth className="text-red-500" onClick={() => void handleDeleteHotel()}>
                  <Trash2 size={15} />
                  Delete Booking
                </Button>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div variants={riseIn} className="mx-5">
              <GlassCard padding="md" className="flex flex-col gap-3 text-center">
                <BedDouble size={24} className="mx-auto text-accent-strong" />
                <p className="text-sm font-semibold text-ink">No hotel booking saved</p>
                <Button fullWidth onClick={() => setEditorOpen(true)}>
                  <Plus size={16} />
                  Add Hotel Booking
                </Button>
              </GlassCard>
            </motion.div>
          )}
          <HotelBookingDialog
            open={editorOpen}
            hotel={hotelData}
            onClose={() => setEditorOpen(false)}
            onSave={updateHotel}
          />
        </motion.div>
      </PageLoadingGate>
    </PageAccent>
  );
}

export default HotelPage;
