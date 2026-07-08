import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, GlassCard, IconButton } from "@/components/ui";
import { BUDGET_CURRENCIES } from "@/lib/budget";

export function TotalBudgetDialog({
  open,
  totalBudget,
  currency,
  onClose,
  onSave,
}: {
  open: boolean;
  totalBudget: number;
  currency: string;
  onClose: () => void;
  onSave: (input: { totalBudget: number; currency: string }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(String(totalBudget));
    setSelectedCurrency(currency);
    setError("");
  }, [currency, open, totalBudget]);

  function handleSave() {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid total budget.");
      return;
    }

    onSave({
      totalBudget: parsedAmount,
      currency: selectedCurrency,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-[calc(env(safe-area-inset-bottom)+1rem)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <GlassCard elevated padding="none" className="flex max-h-[calc(100dvh-env(safe-area-inset-bottom)-2rem)] flex-col overflow-hidden rounded-4xl">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/30 px-5 py-4 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent-strong">Trip wallet</p>
                  <h2 className="text-xl font-semibold text-ink">Edit total budget</h2>
                </div>
                <IconButton size="sm" variant="ghost" aria-label="Close budget editor" onClick={onClose}>
                  <X size={17} />
                </IconButton>
              </div>

              <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-[1fr_6.5rem] gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-muted">Total budget amount</span>
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
                    <span className="text-xs font-semibold text-ink-muted">Currency</span>
                    <select
                      value={selectedCurrency}
                      onChange={(event) => setSelectedCurrency(event.target.value)}
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

                {error && <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/30 px-5 py-4 dark:border-white/10">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  Cancel
                </Button>
                <Button fullWidth onClick={handleSave}>
                  Save
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
