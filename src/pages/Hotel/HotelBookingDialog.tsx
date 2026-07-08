import { AnimatePresence, motion } from "framer-motion";
import { FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { Button, GlassCard, IconButton } from "@/components/ui";
import { deleteBookingPdf, getBookingPdfUrl, uploadBookingPdf } from "@/lib/bookingPersistence";
import type { HotelData } from "@/types/hotel";

function openPdf(url: string) {
  if (url) window.open(url, "_blank", "noreferrer");
}

export function HotelBookingDialog({
  open,
  hotel,
  onClose,
  onSave,
}: {
  open: boolean;
  hotel: HotelData;
  onClose: () => void;
  onSave: (hotel: HotelData) => boolean;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(hotel);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(hotel);
    setError("");
    setPdfBusy(false);
  }, [hotel, open]);

  function update(next: Partial<HotelData>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function updateCheckIn(field: "date" | "time", value: string) {
    setDraft((current) => ({ ...current, checkIn: { ...current.checkIn, [field]: value } }));
  }

  function updateCheckOut(field: "date" | "time", value: string) {
    setDraft((current) => ({ ...current, checkOut: { ...current.checkOut, [field]: value } }));
  }

  async function handlePdf(file: File | undefined) {
    if (!file) return;
    if (!user) {
      setError("Please sign in before attaching a PDF.");
      return;
    }

    setPdfBusy(true);
    try {
      const previousStoragePath = draft.pdf?.storagePath;
      const pdf = await uploadBookingPdf({
        uid: user.uid,
        bookingType: "hotel",
        bookingId: draft.bookingNo || draft.confirmationNo || "hotel",
        file,
      });

      const nextDraft = { ...draft, pdf, pdfFileName: pdf.fileName, pdfDataUrl: undefined };
      setDraft(nextDraft);
      if (!onSave(nextDraft)) {
        throw new Error("Could not save this PDF. Please try again.");
      }

      if (previousStoragePath && previousStoragePath !== pdf.storagePath) await deleteBookingPdf(previousStoragePath);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not attach this PDF.");
    } finally {
      setPdfBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemovePdf() {
    const storagePath = draft.pdf?.storagePath;
    setPdfBusy(true);
    try {
      const nextDraft = { ...draft, pdf: undefined, pdfFileName: undefined, pdfDataUrl: undefined };
      if (!onSave(nextDraft)) {
        throw new Error("Could not save this PDF change. Please try again.");
      }

      if (storagePath) await deleteBookingPdf(storagePath);
      setDraft(nextDraft);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not remove this PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  function handleSave() {
    if (!draft.name.trim()) {
      setError("Hotel name is required.");
      return;
    }
    if (onSave(draft)) onClose();
    else setError("Could not save hotel booking.");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <GlassCard elevated padding="none" className="flex max-h-[calc(100dvh-env(safe-area-inset-bottom)-112px)] flex-col overflow-hidden rounded-4xl">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/30 px-5 py-4 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent-strong">Hotel booking</p>
                  <h2 className="text-xl font-semibold text-ink">Edit hotel</h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label="Close hotel editor" onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Hotel name</span>
                  <input value={draft.name} onChange={(event) => update({ name: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Hotel address</span>
                  <input value={draft.address} onChange={(event) => update({ address: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Room type</span>
                    <input value={draft.roomType} onChange={(event) => update({ roomType: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Guest</span>
                    <input value={draft.guestName} onChange={(event) => update({ guestName: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Check-in date</span>
                    <input type="date" value={draft.checkIn.date} onChange={(event) => updateCheckIn("date", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Check-in time</span>
                    <input value={draft.checkIn.time} onChange={(event) => updateCheckIn("time", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Check-out date</span>
                    <input type="date" value={draft.checkOut.date} onChange={(event) => updateCheckOut("date", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Check-out time</span>
                    <input value={draft.checkOut.time} onChange={(event) => updateCheckOut("time", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Number of nights</span>
                  <input inputMode="numeric" value={draft.numberOfNights ?? ""} onChange={(event) => update({ numberOfNights: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Booking number</span>
                  <input value={draft.bookingNo} onChange={(event) => update({ bookingNo: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Confirmation number</span>
                  <input value={draft.confirmationNo} onChange={(event) => update({ confirmationNo: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Phone number</span>
                  <input value={draft.phone} onChange={(event) => update({ phone: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Google Maps URL</span>
                  <input type="url" value={draft.googleMapsUrl ?? ""} onChange={(event) => update({ googleMapsUrl: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Notes</span>
                  <textarea value={draft.notes ?? ""} rows={3} onChange={(event) => update({ notes: event.target.value })} className="resize-none rounded-2xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none" />
                </label>

                <div className="flex flex-col gap-2 rounded-2xl bg-ink/5 p-3">
                  <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handlePdf(event.target.files?.[0])} />
                  <p className="text-xs font-semibold text-ink-muted">Booking file</p>
                  {draft.pdfFileName ? (
                    <div className="flex flex-col gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">{draft.pdfFileName}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button size="sm" variant="secondary" disabled={pdfBusy} onClick={() => openPdf(getBookingPdfUrl(draft.pdf, draft.pdfDataUrl))}>Open</Button>
                        <Button size="sm" variant="secondary" disabled={pdfBusy} onClick={() => inputRef.current?.click()}>{pdfBusy ? "Saving..." : "Replace"}</Button>
                        <Button size="sm" variant="secondary" disabled={pdfBusy} className="text-red-500" onClick={() => void handleRemovePdf()}>Remove</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={pdfBusy} onClick={() => inputRef.current?.click()}>
                      <FileText size={15} />
                      {pdfBusy ? "Saving..." : "Attach File"}
                    </Button>
                  )}
                </div>

                {error && <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/30 px-5 py-4 dark:border-white/10">
                <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
                <Button fullWidth onClick={handleSave}>Save</Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
