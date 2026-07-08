import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Chip, EmptyState, FilterChips, GlassCard, ThemeToggle } from "@/components/ui";
import { PageAccent, PageHeader, PageLoadingGate } from "@/components/layout";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { buildSearchIndex, SEARCH_CATEGORY_KEYS, searchAll, type SearchCategory } from "@/lib/search";

export function SearchPage() {
  const { t } = useTranslation();
  const index = useMemo(() => buildSearchIndex(), []);
  const categoryFilters = useMemo(
    () => [
      { value: "all" as const, label: t("common.all") },
      ...Object.entries(SEARCH_CATEGORY_KEYS).map(([value, labelKey]) => ({
        value: value as SearchCategory,
        label: t(labelKey),
      })),
    ],
    [t],
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categoryFilters)[number]["value"]>("all");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const matched = searchAll(query, index);
    if (category === "all") return matched;
    return matched.filter((result) => result.category === category);
  }, [category, index, query]);

  return (
    <PageLoadingGate>
      <PageAccent tone="pink">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-5 pb-8">
        <PageHeader
          title={t("search.title")}
          subtitle={t("search.subtitle", { count: index.length })}
          actions={<ThemeToggle />}
        />

        <div className="flex flex-col gap-3 px-5">
          <div className="glass-surface glass-shadow flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <Search size={16} className="shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("common.clearSearch")}
                className="text-ink-faint"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <FilterChips options={categoryFilters} value={category} onChange={setCategory} />
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={Search}
            title={query.trim() ? t("empty.searchNoResults.title") : t("empty.search.title")}
            description={
              query.trim() ? t("empty.searchNoResults.description") : t("empty.search.description")
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <motion.div key={result.id} variants={riseIn}>
                <Link to={result.route}>
                  <GlassCard padding="md" className="mx-5 transition-colors active:bg-ink/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                        {result.subtitle && <p className="mt-0.5 truncate text-xs text-ink-muted">{result.subtitle}</p>}
                      </div>
                      <Chip tone="neutral" className="shrink-0">
                        {t(SEARCH_CATEGORY_KEYS[result.category as SearchCategory])}
                      </Chip>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageAccent>
    </PageLoadingGate>
  );
}

export default SearchPage;
