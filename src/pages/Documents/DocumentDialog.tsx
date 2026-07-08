import { AnimatePresence, motion } from "framer-motion";
import { FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import {
  DEFAULT_DOCUMENT_OWNERS,
  DOCUMENT_CATEGORIES,
  readDocumentFile,
} from "@/lib/documents";
import type { DocumentCategoryId, TravelDocument, TravelDocumentFile } from "@/types/document";

interface DocumentDraft {
  owner: string;
  customOwner: string;
  title: string;
  category: DocumentCategoryId;
  notes: string;
  file?: TravelDocumentFile;
}

function createDraft(category: DocumentCategoryId, document?: TravelDocument): DocumentDraft {
  const owner = document?.owner ?? DEFAULT_DOCUMENT_OWNERS[0];
  const isDefaultOwner = DEFAULT_DOCUMENT_OWNERS.includes(owner);

  return {
    owner: isDefaultOwner ? owner : "custom",
    customOwner: isDefaultOwner ? "" : owner,
    title: document?.title ?? "",
    category: document?.category ?? category,
    notes: document?.notes ?? "",
    file: document?.file,
  };
}

export function DocumentDialog({
  open,
  category,
  document,
  onClose,
  onSave,
}: {
  open: boolean;
  category: DocumentCategoryId;
  document?: TravelDocument | null;
  onClose: () => void;
  onSave: (document: TravelDocument) => boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<DocumentDraft>(() => createDraft(category, document ?? undefined));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(createDraft(category, document ?? undefined));
    setError("");
    setBusy(false);
  }, [category, document, open]);

  function update(next: Partial<DocumentDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      update({ file: await readDocumentFile(file) });
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not attach this file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleSave() {
    const owner = draft.owner === "custom" ? draft.customOwner.trim() : draft.owner;
    const title = draft.title.trim();

    if (!owner) {
      setError("Owner is required.");
      return;
    }

    if (!title) {
      setError("Document title is required.");
      return;
    }

    if (!document && !draft.file) {
      setError("Please attach a PDF or image.");
      return;
    }

    const now = new Date().toISOString();
    const nextDocument: TravelDocument = {
      id: document?.id ?? `document-${Date.now()}`,
      owner,
      title,
      category: draft.category,
      notes: draft.notes.trim(),
      file: draft.file,
      createdAt: document?.createdAt ?? now,
      updatedAt: now,
    };

    if (onSave(nextDocument)) onClose();
    else setError("Could not save document.");
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
                  <p className="text-xs font-semibold uppercase text-accent-strong">Travel document</p>
                  <h2 className="text-xl font-semibold text-ink">{document ? "Edit document" : "Add document"}</h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label="Close document editor" onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Owner</span>
                  <select
                    value={draft.owner}
                    onChange={(event) => update({ owner: event.target.value })}
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                  >
                    {DEFAULT_DOCUMENT_OWNERS.map((owner) => (
                      <option key={owner} value={owner}>{owner}</option>
                    ))}
                    <option value="custom">Add custom owner</option>
                  </select>
                </label>

                {draft.owner === "custom" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Custom owner</span>
                    <input
                      value={draft.customOwner}
                      onChange={(event) => update({ customOwner: event.target.value })}
                      className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                    />
                  </label>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Document title</span>
                  <input
                    value={draft.title}
                    onChange={(event) => update({ title: event.target.value })}
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Category</span>
                  <select
                    value={draft.category}
                    onChange={(event) => update({ category: event.target.value as DocumentCategoryId })}
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                  >
                    {DOCUMENT_CATEGORIES.map((nextCategory) => (
                      <option key={nextCategory.id} value={nextCategory.id}>{nextCategory.title}</option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-2 rounded-2xl bg-ink/5 p-3">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => void handleFile(event.target.files?.[0])}
                  />
                  <p className="text-xs font-semibold text-ink-muted">File upload</p>
                  {draft.file ? (
                    <div className="flex flex-col gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">{draft.file.fileName}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
                          {busy ? "Reading..." : "Replace"}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={busy} className="text-red-500" onClick={() => update({ file: undefined })}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
                      <FileText size={15} />
                      {busy ? "Reading..." : "Attach PDF or Image"}
                    </Button>
                  )}
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">Notes optional</span>
                  <textarea
                    value={draft.notes}
                    rows={3}
                    onChange={(event) => update({ notes: event.target.value })}
                    className="resize-none rounded-2xl bg-ink/5 px-3 py-2.5 text-sm text-ink outline-none"
                  />
                </label>

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
