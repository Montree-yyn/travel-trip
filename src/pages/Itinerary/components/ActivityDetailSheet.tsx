import { AnimatePresence, motion } from "framer-motion";
import { Clock, Copy, Map, MapPin, Navigation2, Share2, StickyNote, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Chip, GlassCard, TripImage } from "@/components/ui";
import { samplePlaces } from "@/data/sample-places";
import { useTranslation } from "@/i18n";
import { buildDirectionsUrl, createMapTarget } from "@/lib/maps";
import { ROUTES } from "@/router/paths";
import type { TimelineItem } from "@/types/trip";

import { inferCategoryKey } from "./activity-utils";

export interface ActivityDetailSheetProps {
  open: boolean;
  item: TimelineItem | null;
  dayNumber: number;
  city: string;
  onClose: () => void;
}

function findMatchingPlace(item: TimelineItem) {
  const needle = item.activity.toLowerCase();
  return samplePlaces.find(
    (place) =>
      needle.includes(place.name.toLowerCase()) || place.name.toLowerCase().includes(needle),
  );
}

export function ActivityDetailSheet({ open, item, dayNumber, city, onClose }: ActivityDetailSheetProps) {
  const { t } = useTranslation();

  if (!item) return null;

  const mapTarget = createMapTarget({
    name: item.location ?? item.activity,
    city,
  });
  const matchedPlace = findMatchingPlace(item);
  const categoryKey = inferCategoryKey(item.activity, item.notes);
  const shareText = `${item.time} · ${item.activity}${item.location ? ` @ ${item.location}` : ""}`;

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: item!.activity, text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
    } catch {
      // User dismissed share sheet or clipboard unavailable.
    }
  }

  const actionItems = [
    {
      key: "directions",
      label: t("maps.directions"),
      icon: Navigation2,
      href: buildDirectionsUrl(mapTarget, "google"),
    },
    {
      key: "map",
      label: t("places.navigation"),
      icon: Map,
      to: ROUTES.map,
    },
    {
      key: "share",
      label: t("common.copy"),
      icon: Share2,
      onClick: handleShare,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="w-full max-w-md px-4"
            onClick={(event) => event.stopPropagation()}
          >
            <GlassCard elevated padding="none" className="overflow-hidden">
              <TripImage
                seed={`${city}-${dayNumber}-${item.activity}`}
                className="h-36 w-full"
                alt={item.activity}
              />

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Chip tone="accent" className="mb-2 w-fit">
                      <Clock size={11} /> {item.time}
                    </Chip>
                    <h2 className="text-xl font-bold tracking-tight text-ink">{item.activity}</h2>
                    <p className="mt-1 text-sm text-ink-muted">{t(categoryKey)}</p>
                    {item.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                        <MapPin size={14} className="shrink-0 text-accent-strong" />
                        {item.location}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={t("budget.closeDialog")}
                    onClick={onClose}
                    className="glass-surface flex size-9 shrink-0 items-center justify-center rounded-full"
                  >
                    <X size={16} className="text-ink-muted" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {actionItems.map(({ key, label, icon: Icon, href, to, onClick }) => {
                    const className =
                      "glass-surface glass-shadow flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-[0.6875rem] font-semibold text-ink-muted transition-colors active:bg-accent-soft";

                    if (href) {
                      return (
                        <a key={key} href={href} target="_blank" rel="noreferrer" className={className}>
                          <Icon size={18} className="text-accent-strong" />
                          {label}
                        </a>
                      );
                    }

                    if (to) {
                      return (
                        <Link key={key} to={to} onClick={onClose} className={className}>
                          <Icon size={18} className="text-accent-strong" />
                          {label}
                        </Link>
                      );
                    }

                    return (
                      <button key={key} type="button" onClick={onClick} className={className}>
                        <Icon size={18} className="text-accent-strong" />
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 rounded-2xl bg-accent-soft/40 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
                    <StickyNote size={13} />
                    {t("budget.fields.note")}
                  </p>
                  <p className="text-sm text-ink-muted">{item.notes ?? t("memories.noNoteYet")}</p>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl glass-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {t("places.openingHours")}
                  </p>
                  {matchedPlace ? (
                    <div className="flex flex-col gap-1.5">
                      {matchedPlace.openingHours.slice(0, 3).map((entry) => (
                        <div key={entry.day} className="flex items-center justify-between text-sm">
                          <span className="text-ink-muted">{entry.day}</span>
                          <span className="font-medium text-ink">{entry.hours}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-muted">{item.notes ?? t("memories.noNoteYet")}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-semibold text-accent-strong"
                >
                  <Copy size={15} />
                  {t("common.copy")}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
