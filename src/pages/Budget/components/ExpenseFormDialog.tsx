import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/auth";
import { Button, GlassCard, IconButton, ModalPortal } from "@/components/ui";
import type { BudgetExpenseInput } from "@/hooks/usePersistentBudget";
import { useTranslation } from "@/i18n";
import { prepareReceiptAttachment } from "@/lib/budget-receipts";
import { BUDGET_CURRENCIES, BUDGET_EXPENSE_CATEGORIES, BUDGET_PAYMENT_METHODS } from "@/lib/budget";
import { getActiveTripId } from "@/sync/sharedTrip";
import type { BudgetExpense, BudgetExpenseCategory, BudgetPaymentMethod } from "@/types/budget";

export function ExpenseFormDialog({
  open,
  mode,
  initialExpense,
  defaultDate,
  defaultCurrency,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: "add" | "edit";
  initialExpense?: BudgetExpense;
  defaultDate: string;
  defaultCurrency: string;
  onClose: () => void;
  onSave: (input: BudgetExpenseInput) => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<BudgetExpenseCategory>("food");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [date, setDate] = useState(defaultDate);
  const [paymentMethod, setPaymentMethod] = useState<BudgetPaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState("");
  const [receiptPhotoPath, setReceiptPhotoPath] = useState<string | undefined>();
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(initialExpense?.title ?? "");
    setCategory(initialExpense?.category ?? "food");
    setAmount(initialExpense ? String(initialExpense.amount) : "");
    setCurrency(initialExpense?.currency ?? defaultCurrency);
    setDate(initialExpense?.date ?? defaultDate);
    setPaymentMethod(initialExpense?.paymentMethod ?? "cash");
    setNote(initialExpense?.note ?? "");
    setReceiptPhotoUrl(initialExpense?.receiptPhotoUrl ?? "");
    setReceiptPhotoPath(initialExpense?.receiptPhotoPath);
    setError(null);
    setUploadingReceipt(false);
  }, [defaultCurrency, defaultDate, initialExpense, open]);

  async function handleReceiptFile(file: File | undefined) {
    if (!file) return;
    setUploadingReceipt(true);
    setError(null);
    try {
      const attachment = await prepareReceiptAttachment({
        file,
        uid: user?.uid ?? null,
        tripId: getActiveTripId(),
      });
      setReceiptPhotoUrl(attachment.url);
      setReceiptPhotoPath(attachment.storagePath);
    } catch (nextError) {
      setError(nextError instanceof Error ? t(nextError.message) : t("budget.errors.receiptUploadFailed"));
    } finally {
      setUploadingReceipt(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function handleSubmit() {
    const parsedAmount = Number(amount);
    const resolvedTitle = title.trim();

    if (!resolvedTitle) {
      setError(t("budget.errors.titleRequired"));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("budget.errors.amountRequired"));
      return;
    }
    if (!date) {
      setError(t("budget.errors.dateRequired"));
      return;
    }

    onSave({
      title: resolvedTitle,
      category,
      amount: parsedAmount,
      currency,
      date,
      paymentMethod,
      note: note.trim() || undefined,
      receiptPhotoUrl: receiptPhotoUrl || undefined,
      receiptPhotoPath,
    });
    onClose();
  }

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-center sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <GlassCard elevated padding="none" className="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-b-none rounded-t-4xl sm:max-h-[84dvh] sm:rounded-4xl">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/30 px-5 py-3.5 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent-strong">{mode === "add" ? "Fast entry" : "Edit expense"}</p>
                  <h2 className="text-xl font-semibold text-ink">
                    {mode === "add" ? t("budget.addExpense") : t("budget.editExpense")}
                  </h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label={t("budget.closeDialog")} onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-3.5">
                <div className="grid grid-cols-[1fr_6.5rem] gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.amount")}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0"
                      autoFocus
                      className="h-14 rounded-2xl bg-ink/5 px-4 text-2xl font-bold text-ink outline-none placeholder:text-ink-faint"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.currency")}</span>
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="h-14 rounded-2xl bg-ink/5 px-3 text-sm font-bold text-ink outline-none"
                    >
                      {BUDGET_CURRENCIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.date")}</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.title")}</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("budget.fields.titlePlaceholder")}
                    className="h-12 rounded-2xl bg-ink/5 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.category")}</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BUDGET_EXPENSE_CATEGORIES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        className={`h-10 rounded-2xl text-xs font-bold transition-colors ${
                          category === value
                            ? "pill-glow bg-gradient-to-b from-accent to-accent-strong text-accent-contrast"
                            : "bg-ink/5 text-ink-muted"
                        }`}
                      >
                        {t(`budget.categories.${value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.paymentMethod")}</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BUDGET_PAYMENT_METHODS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        className={`h-10 rounded-2xl text-xs font-bold transition-colors ${
                          paymentMethod === value
                            ? "bg-accent text-accent-contrast"
                            : "bg-ink/5 text-ink-muted"
                        }`}
                      >
                        {t(`budget.paymentMethods.${value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.note")}</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={t("budget.fields.notePlaceholder")}
                    rows={2}
                    className="resize-none rounded-2xl bg-ink/5 px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint"
                  />
                </label>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted">{t("budget.fields.receipt")}</span>
                  <div className="flex gap-2">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => void handleReceiptFile(event.target.files?.[0])}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleReceiptFile(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="glass-surface glass-shadow flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-ink"
                    >
                      {uploadingReceipt ? <Loader size={16} className="animate-spin" /> : <Camera size={16} className="text-accent-strong" />}
                      {t("budget.receipt.takePhoto")}
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="glass-surface glass-shadow flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-ink"
                    >
                      <ImagePlus size={16} className="text-accent-strong" />
                      {t("budget.receipt.choosePhoto")}
                    </button>
                  </div>
                  {receiptPhotoUrl && (
                    <div className="flex items-center gap-3 rounded-2xl bg-ink/5 p-2">
                      <img src={receiptPhotoUrl} alt="" className="size-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{t("budget.receipt.attached")}</p>
                        <p className="text-xs text-ink-muted">{receiptPhotoPath ? t("budget.receipt.synced") : t("budget.receipt.local")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptPhotoUrl("");
                          setReceiptPhotoPath(undefined);
                        }}
                        className="rounded-pill px-3 py-2 text-xs font-bold text-red-500"
                      >
                        {t("budget.receipt.remove")}
                      </button>
                    </div>
                  )}
                </div>

                {error && <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>}
              </div>

              <div className="sticky bottom-0 grid shrink-0 grid-cols-2 gap-2 border-t border-white/30 bg-[rgb(var(--surface))]/80 px-5 py-3.5 backdrop-blur-xl dark:border-white/10">
                {mode === "edit" && onDelete ? (
                  <Button variant="secondary" fullWidth className="text-red-500" onClick={onDelete}>
                    {t("budget.deleteExpense")}
                  </Button>
                ) : (
                  <Button variant="secondary" fullWidth onClick={onClose}>
                    {t("budget.cancel")}
                  </Button>
                )}
                <Button fullWidth disabled={uploadingReceipt} onClick={handleSubmit}>
                  {uploadingReceipt ? <ImagePlus size={16} /> : null}
                  {t("budget.saveExpense")}
                </Button>
              </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
