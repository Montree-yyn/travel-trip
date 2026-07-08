import { AnimatePresence, motion } from "framer-motion";
import { FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { Button, GlassCard, IconButton } from "@/components/ui";
import { deleteBookingPdf, getBookingPdfUrl, uploadBookingPdf } from "@/lib/bookingPersistence";
import type { FlightSegment } from "@/types/flight";

function openPdf(url: string) {
  if (url) window.open(url, "_blank", "noreferrer");
}

export function FlightBookingDialog({
  open,
  flight,
  onClose,
  onSave,
}: {
  open: boolean;
  flight: FlightSegment | null;
  onClose: () => void;
  onSave: (flight: FlightSegment) => boolean;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<FlightSegment | null>(flight);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(flight);
    setError("");
    setPdfBusy(false);
  }, [flight, open]);

  if (!draft) return null;

  function update(next: Partial<FlightSegment>) {
    setDraft((current) => (current ? { ...current, ...next } : current));
  }

  function updateDeparture(field: string, value: string) {
    setDraft((current) => current ? { ...current, departure: { ...current.departure, [field]: value } } : current);
  }

  function updateArrival(field: string, value: string) {
    setDraft((current) => current ? { ...current, arrival: { ...current.arrival, [field]: value } } : current);
  }

  async function handlePdf(file: File | undefined) {
    if (!file || !draft) return;
    if (!user) {
      setError("Please sign in before attaching a PDF.");
      return;
    }

    setPdfBusy(true);
    try {
      const previousStoragePath = draft.pdf?.storagePath;
      const pdf = await uploadBookingPdf({
        uid: user.uid,
        bookingType: "flight",
        bookingId: draft.id,
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
    const storagePath = draft?.pdf?.storagePath;
    setPdfBusy(true);
    try {
      const nextDraft = draft ? { ...draft, pdf: undefined, pdfFileName: undefined, pdfDataUrl: undefined } : draft;
      if (nextDraft && !onSave(nextDraft)) {
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
    const current = draft;
    if (!current) return;
    if (!current.airline.trim() || !current.flightNumber.trim()) {
      setError("Airline and flight number are required.");
      return;
    }
    if (onSave(current)) onClose();
    else setError("Could not save flight booking.");
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
                  <p className="text-xs font-semibold uppercase text-accent-strong">Flight booking</p>
                  <h2 className="text-xl font-semibold text-ink">Edit flight</h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label="Close flight editor" onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Airline</span>
                    <input value={draft.airline} onChange={(event) => update({ airline: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Flight no.</span>
                    <input value={draft.flightNumber} onChange={(event) => update({ flightNumber: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Booking reference</span>
                  <input value={draft.bookingReference ?? ""} onChange={(event) => update({ bookingReference: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Duration</span>
                    <input value={draft.transitTime} onChange={(event) => update({ transitTime: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Seat</span>
                    <input value={draft.seat ?? ""} onChange={(event) => update({ seat: event.target.value })} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Departure airport code</span>
                    <input value={draft.departure.airportCode} onChange={(event) => updateDeparture("airportCode", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Arrival airport code</span>
                    <input value={draft.arrival.airportCode} onChange={(event) => updateArrival("airportCode", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Departure city</span>
                    <input value={draft.departure.city} onChange={(event) => updateDeparture("city", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Arrival city</span>
                    <input value={draft.arrival.city} onChange={(event) => updateArrival("city", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Departure date</span>
                    <input type="date" value={draft.departure.date} onChange={(event) => updateDeparture("date", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Departure time</span>
                    <input type="time" value={draft.departure.time} onChange={(event) => updateDeparture("time", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Arrival date</span>
                    <input type="date" value={draft.arrival.date} onChange={(event) => updateArrival("date", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Arrival time</span>
                    <input type="time" value={draft.arrival.time} onChange={(event) => updateArrival("time", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Departure terminal</span>
                    <input value={draft.departure.terminal} onChange={(event) => updateDeparture("terminal", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Arrival terminal</span>
                    <input value={draft.arrival.terminal} onChange={(event) => updateArrival("terminal", event.target.value)} className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none" />
                  </label>
                </div>

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
