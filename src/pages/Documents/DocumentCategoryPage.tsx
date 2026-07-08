import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  FileImage,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { PageLoadingGate } from "@/components/layout";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentDocuments } from "@/hooks/usePersistentDocuments";
import {
  documentPreviewUrl,
  getDocumentCategory,
  isImageDocument,
  readDocumentFile,
} from "@/lib/documents";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/paths";
import type { TravelDocument } from "@/types/document";

import { DocumentDialog } from "./DocumentDialog";

const LIGHT_PAGE_CLASS =
  "min-h-full bg-white text-neutral-950 [--accent:#111827] [--accent-contrast:#ffffff] [--accent-soft:#f5f5f5] [--accent-strong:#111827] [--bg:#ffffff] [--bg-elevated:#ffffff] [--border:229_229_229] [--border-opacity:1] [--highlight:255_255_255] [--highlight-opacity:0.72] [--ink:#171717] [--ink-faint:#d4d4d4] [--ink-muted:#737373] [--shadow-tint:15_23_42] [--surface:255_255_255] [--surface-opacity:0.94] [--surface-strong-opacity:0.98]";

const actionButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm shadow-neutral-200/60 transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const dangerButtonClass = "border-orange-200 bg-orange-50 text-orange-700 shadow-orange-100/70";

function openDocument(url: string) {
  if (url) window.open(url, "_blank", "noreferrer");
}

function DocumentActionButton({
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

function DocumentPreview({ document }: { document: TravelDocument }) {
  const file = document.file;
  const hasFile = Boolean(file);
  const isImage = isImageDocument(file);
  const previewUrl = documentPreviewUrl(file);

  return (
    <div className="mx-auto max-w-[25rem]">
      <div className="relative overflow-hidden rounded-[1.7rem] bg-neutral-100 p-2 shadow-inner">
        <div className="aspect-[210/297] overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white">
          {file ? (
            isImage ? (
              <img src={file.dataUrl} alt={document.title} className="h-full w-full object-contain" />
            ) : (
              <iframe title={document.title} src={previewUrl} className="h-full w-full bg-white" />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                <FileText size={28} />
              </span>
              <div>
                <p className="text-base font-semibold text-neutral-950">No file attached</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                  Replace this document to add a PDF or image.
                </p>
              </div>
            </div>
          )}
        </div>
        {hasFile && (
          <button
            type="button"
            aria-label={`Open ${document.title}`}
            className="absolute inset-2 rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
            onClick={() => openDocument(file?.dataUrl ?? "")}
          />
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  busy,
  onReplace,
  onRemove,
  onEdit,
  onDelete,
}: {
  document: TravelDocument;
  busy: boolean;
  onReplace: (file: File | undefined) => void;
  onRemove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileName = document.file?.fileName ?? "No file attached";

  return (
    <motion.article variants={riseIn}>
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.55)]">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            void onReplace(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <DocumentPreview document={document} />

        <div className="mt-4 flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
            {document.file && isImageDocument(document.file) ? <FileImage size={20} /> : <FileText size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-lg font-bold leading-tight text-neutral-950">{document.title}</h3>
            <p className="mt-1 break-words text-sm font-semibold text-neutral-600">{fileName}</p>
            {document.notes && (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-500">{document.notes}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <DocumentActionButton disabled={!document.file} onClick={() => openDocument(document.file?.dataUrl ?? "")}>
            <ExternalLink size={15} />
            Open
          </DocumentActionButton>
          <DocumentActionButton disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload size={15} />
            {busy ? "Saving" : "Replace"}
          </DocumentActionButton>
          <DocumentActionButton danger disabled={busy || !document.file} onClick={onRemove}>
            <X size={15} />
            Remove
          </DocumentActionButton>
          <DocumentActionButton disabled={busy} onClick={onEdit}>
            <Pencil size={15} />
            Edit
          </DocumentActionButton>
          <DocumentActionButton danger disabled={busy} onClick={onDelete}>
            <Trash2 size={15} />
            Delete
          </DocumentActionButton>
        </div>
      </div>
    </motion.article>
  );
}

export function DocumentCategoryPage() {
  const { categoryId } = useParams();
  const category = getDocumentCategory(categoryId);
  const {
    documents,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
  } = usePersistentDocuments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<TravelDocument | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyDocumentId, setBusyDocumentId] = useState("");

  const categoryDocuments = useMemo(
    () => documents.filter((document) => document.category === category?.id),
    [category?.id, documents],
  );

  const groupedDocuments = useMemo(() => {
    const groups = new Map<string, TravelDocument[]>();
    for (const document of categoryDocuments) {
      const ownerDocuments = groups.get(document.owner) ?? [];
      ownerDocuments.push(document);
      groups.set(document.owner, ownerDocuments);
    }
    return Array.from(groups.entries());
  }, [categoryDocuments]);

  if (!category) return <Navigate to={ROUTES.travelWallet} replace />;

  function handleSave(document: TravelDocument) {
    if (editingDocument) return updateDocument(editingDocument.id, document);
    return addDocument(document);
  }

  function openAddDialog() {
    setEditingDocument(null);
    setDialogOpen(true);
  }

  function openEditDialog(document: TravelDocument) {
    setEditingDocument(document);
    setDialogOpen(true);
  }

  async function handleReplace(document: TravelDocument, file: File | undefined) {
    if (!file) return;
    setBusyDocumentId(document.id);
    try {
      const nextDocument = {
        ...document,
        file: await readDocumentFile(file),
        updatedAt: new Date().toISOString(),
      };
      if (!updateDocument(document.id, nextDocument)) throw new Error("Could not replace this file.");
      setActionError("");
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Could not replace this file.");
    } finally {
      setBusyDocumentId("");
    }
  }

  function handleRemove(document: TravelDocument) {
    const nextDocument = { ...document, file: undefined, updatedAt: new Date().toISOString() };
    if (!updateDocument(document.id, nextDocument)) setActionError("Could not remove this file.");
    else setActionError("");
  }

  function handleDelete(document: TravelDocument) {
    const ok = window.confirm(`Delete ${document.title}?`);
    if (!ok) return;
    if (!deleteDocument(document.id)) setActionError("Could not delete this document.");
    else setActionError("");
  }

  return (
    <PageLoadingGate>
      <div className={LIGHT_PAGE_CLASS}>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-7 pb-8">
          <header className="px-5 pt-5">
            <Link
              to={ROUTES.travelWallet}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 shadow-sm"
            >
              <ArrowLeft size={16} />
              Travel Wallet
            </Link>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-500">Documents</p>
                <h1 className="mt-1 text-[2.35rem] font-bold leading-tight tracking-normal text-neutral-950">
                  {category.title}
                </h1>
                <p className="mt-1 text-base leading-relaxed text-neutral-500">{category.description}</p>
              </div>
              <button
                type="button"
                aria-label="Add document"
                onClick={openAddDialog}
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg shadow-neutral-300/80"
              >
                <Plus size={22} />
              </button>
            </div>
          </header>

          {(error || actionError) && (
            <motion.div variants={riseIn} className="px-5">
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{actionError || error}</p>
            </motion.div>
          )}

          {groupedDocuments.length ? (
            <div className="flex flex-col gap-7 px-5">
              {groupedDocuments.map(([owner, ownerDocuments]) => (
                <section key={owner} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[1.15rem] font-bold text-neutral-950">{owner}</h2>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                      {ownerDocuments.length} {ownerDocuments.length === 1 ? "document" : "documents"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {ownerDocuments.map((document) => (
                      <DocumentCard
                        key={document.id}
                        document={document}
                        busy={busyDocumentId === document.id}
                        onReplace={(file) => void handleReplace(document, file)}
                        onRemove={() => handleRemove(document)}
                        onEdit={() => openEditDialog(document)}
                        onDelete={() => handleDelete(document)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <motion.section variants={riseIn} className="px-5">
              <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-[0_22px_60px_-38px_rgba(15,23,42,0.55)]">
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                  <FileText size={30} />
                </span>
                <h2 className="mt-4 text-xl font-bold text-neutral-950">No documents yet</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Add a PDF or image and assign it to a traveler.
                </p>
                <button
                  type="button"
                  onClick={openAddDialog}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
                >
                  <Plus size={17} />
                  Add document
                </button>
              </div>
            </motion.section>
          )}
        </motion.div>

        <DocumentDialog
          open={dialogOpen}
          category={category.id}
          document={editingDocument}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      </div>
    </PageLoadingGate>
  );
}

export default DocumentCategoryPage;
