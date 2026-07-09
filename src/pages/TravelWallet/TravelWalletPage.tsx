import { motion } from "framer-motion";
import {
  ChevronRight,
  FileBadge,
  FileText,
  FolderOpen,
  Hotel,
  Plane,
  Shield,
  Ticket,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageLoadingGate } from "@/components/layout";
import { GlassCard } from "@/components/ui";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { usePersistentBookings } from "@/hooks/usePersistentBookings";
import { usePersistentDocuments } from "@/hooks/usePersistentDocuments";
import { useTranslation, type TranslateParams } from "@/i18n";
import { DOCUMENT_CATEGORIES } from "@/lib/documents";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/paths";
import type { DocumentCategoryId } from "@/types/document";

interface WalletCardItem {
  to: string;
  titleKey: string;
  subtitleKey: string;
  count: number;
  countKind: "booking" | "document";
  icon: LucideIcon;
}

interface WalletSectionItem {
  titleKey: string;
  items: WalletCardItem[];
}

const DOCUMENT_ICONS: Record<DocumentCategoryId, LucideIcon> = {
  "travel-insurance": Shield,
  "usj-tickets": Ticket,
  "visit-japan-web": FileBadge,
  "passport-visa": UserRoundCheck,
  "other-documents": FileText,
};

function documentRoute(categoryId: DocumentCategoryId) {
  return `/travel-wallet/documents/${categoryId}`;
}

function documentTitleKey(categoryId: DocumentCategoryId) {
  return `wallet.items.${categoryId}.title`;
}

function documentSubtitleKey(categoryId: DocumentCategoryId) {
  return `wallet.items.${categoryId}.subtitle`;
}

function formatCount(
  count: number,
  countKind: WalletCardItem["countKind"],
  t: (key: string, params?: TranslateParams) => string,
) {
  const suffixKey =
    countKind === "booking"
      ? count === 1
        ? "wallet.counts.booking"
        : "wallet.counts.bookings"
      : count === 1
        ? "wallet.counts.document"
        : "wallet.counts.documents";
  return t(suffixKey, { count });
}

function WalletMenuCard({ item, t }: { item: WalletCardItem; t: (key: string, params?: TranslateParams) => string }) {
  const Icon = item.icon;

  return (
    <motion.div variants={riseIn}>
      <Link
        to={item.to}
        className={cn(
          "flex items-center gap-4 rounded-[1.65rem] border border-white/70 bg-white/86 p-4",
          "shadow-[0_18px_48px_-34px_rgba(217,79,120,0.7)] transition active:scale-[0.99]",
          "dark:border-white/10 dark:bg-white/8",
        )}
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold leading-tight text-ink">{t(item.titleKey)}</span>
          <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{t(item.subtitleKey)}</span>
          <span className="mt-2 block text-xs font-semibold text-accent-strong">
            {formatCount(item.count, item.countKind, t)}
          </span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-ink-faint" />
      </Link>
    </motion.div>
  );
}

function WalletSection({
  section,
  t,
}: {
  section: WalletSectionItem;
  t: (key: string, params?: TranslateParams) => string;
}) {
  return (
    <section className="flex flex-col gap-3 px-5">
      <h2 className="text-[0.72rem] font-bold uppercase tracking-wide text-ink-muted">{t(section.titleKey)}</h2>
      <div className="grid gap-3">
        {section.items.map((item) => (
          <WalletMenuCard key={item.titleKey} item={item} t={t} />
        ))}
      </div>
    </section>
  );
}

export function TravelWalletPage() {
  const { t } = useTranslation();
  const { bookings } = usePersistentBookings();
  const { countsByCategory } = usePersistentDocuments();
  const hasHotel = Boolean(bookings.hotel?.name?.trim());

  const bookingCards: WalletCardItem[] = [
    {
      to: ROUTES.flights,
      titleKey: "wallet.items.flight.title",
      subtitleKey: "wallet.items.flight.subtitle",
      count: bookings.flights.segments.length,
      countKind: "booking",
      icon: Plane,
    },
    {
      to: ROUTES.hotel,
      titleKey: "wallet.items.hotel.title",
      subtitleKey: "wallet.items.hotel.subtitle",
      count: hasHotel ? 1 : 0,
      countKind: "booking",
      icon: Hotel,
    },
  ];

  const documentCards: WalletCardItem[] = DOCUMENT_CATEGORIES.map((category) => ({
    to: documentRoute(category.id),
    titleKey: documentTitleKey(category.id),
    subtitleKey: documentSubtitleKey(category.id),
    count: countsByCategory[category.id],
    countKind: "document",
    icon: DOCUMENT_ICONS[category.id] ?? FolderOpen,
  }));
  const ticketCards = documentCards.filter((item) => item.titleKey === documentTitleKey("usj-tickets"));
  const coreDocumentCards = documentCards.filter((item) => item.titleKey !== documentTitleKey("usj-tickets"));
  const sections: WalletSectionItem[] = [
    { titleKey: "wallet.sections.bookings", items: bookingCards },
    { titleKey: "wallet.sections.documents", items: coreDocumentCards },
    { titleKey: "wallet.sections.tickets", items: ticketCards },
  ];

  return (
    <PageLoadingGate>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-5 pb-8">
        <header className="px-5 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("nav.travelWallet")}</p>
          <h1 className="mt-1 text-[2rem] font-bold leading-tight tracking-tight text-ink">{t("wallet.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {t("wallet.subtitle")}
          </p>
        </header>

        <motion.div variants={riseIn} className="px-5">
          <GlassCard elevated padding="lg" className="overflow-hidden">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-contrast">
                <FolderOpen size={23} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-tight text-ink">{t("wallet.readyTitle")}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {t("wallet.readySubtitle")}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {sections.map((section) => (
          <WalletSection key={section.titleKey} section={section} t={t} />
        ))}
      </motion.div>
    </PageLoadingGate>
  );
}

export default TravelWalletPage;
