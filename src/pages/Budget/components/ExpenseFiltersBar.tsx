import { Search, X } from "lucide-react";

import { FilterChips } from "@/components/ui";
import { useTranslation } from "@/i18n";
import { BUDGET_EXPENSE_CATEGORIES } from "@/lib/budget";
import type { ExpenseCategoryFilter, ExpenseDateFilter, ExpenseFilters } from "@/types/budget";
import type { TripDay } from "@/types/trip";

export function ExpenseFiltersBar({
  filters,
  tripDays,
  onChange,
}: {
  filters: ExpenseFilters;
  tripDays: TripDay[];
  onChange: (filters: ExpenseFilters) => void;
}) {
  const { t } = useTranslation();

  const categoryOptions = [
    { value: "all" as const, label: t("common.all") },
    ...BUDGET_EXPENSE_CATEGORIES.map((value) => ({
      value,
      label: t(`budget.categories.${value}`),
    })),
  ];

  const dateOptions = [
    { value: "all" as const, label: t("budget.filters.allDates") },
    ...tripDays.map((day) => ({
      value: day.date,
      label: t("budget.filters.dayOption", { day: day.dayNumber }),
    })),
  ];

  return (
    <div className="flex flex-col gap-3 px-5">
      <div className="glass-surface glass-shadow flex items-center gap-2.5 rounded-2xl px-4 py-3">
        <Search size={16} className="shrink-0 text-ink-faint" />
        <input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder={t("budget.searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, query: "" })}
            aria-label={t("common.clearSearch")}
            className="text-ink-faint"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <FilterChips
        options={categoryOptions}
        value={filters.category}
        onChange={(category) => onChange({ ...filters, category: category as ExpenseCategoryFilter })}
      />

      <FilterChips
        options={dateOptions}
        value={filters.date}
        onChange={(date) => onChange({ ...filters, date: date as ExpenseDateFilter })}
      />
    </div>
  );
}
