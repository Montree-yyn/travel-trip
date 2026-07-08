import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Cloud,
  Coins,
  Download,
  Globe,
  HelpCircle,
  Info,
  Languages,
  Settings as SettingsIcon,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageLoadingGate } from "@/components/layout";
import { GlassCard, SegmentedControl, Switch } from "@/components/ui";
import { sampleTrip } from "@/data/sample-trip";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/router/paths";
import { useTripSync } from "@/sync";
import { useTheme } from "@/theme/useTheme";

import { ProfileCard } from "./components/ProfileCard";
import { SettingsRow } from "./components/SettingsRow";
import { SettingsSection } from "./components/SettingsSection";

export function MorePage() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { status, error, retry } = useTripSync();
  const [notifications, setNotifications] = useState(true);

  const syncStatusLabel =
    status === "synced"
      ? t("sync.statusSynced")
      : status === "offline"
        ? t("sync.statusOffline")
        : t("sync.statusError");

  const syncStatusIcon = status === "synced" ? Cloud : status === "offline" ? WifiOff : AlertTriangle;
  const syncStatusTone = status === "error" ? "danger" : "accent";

  function toggleLocale() {
    setLocale(locale === "en" ? "th" : "en");
  }

  return (
    <PageLoadingGate>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-6 pb-8">
        <header className="px-5 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">{t("nav.more")}</p>
          <h1 className="mt-1 text-[2rem] font-bold leading-tight tracking-tight text-ink">{t("morePage.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {t("morePage.subtitle")}
          </p>
        </header>

        {status === "error" && (
          <motion.div variants={riseIn} className="px-5">
            <GlassCard padding="md" className="flex items-start gap-3 bg-red-500/10">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm leading-relaxed text-red-500">{t(error ?? "sync.unavailable")}</p>
            </GlassCard>
          </motion.div>
        )}

        <ProfileCard trip={sampleTrip} />

        <SettingsSection title={t("morePage.sections.tripTools")}>
          <SettingsRow icon={Coins} label={t("morePage.items.currency")} onClick={() => navigate(ROUTES.currency)} />
          <SettingsRow
            icon={Languages}
            label={t("morePage.items.language")}
            value={locale === "th" ? t("settings.thai") : t("settings.english")}
            onClick={toggleLocale}
          />
          <SettingsRow
            icon={syncStatusIcon}
            iconTone={syncStatusTone}
            label={t("morePage.items.backupSync")}
            value={syncStatusLabel}
            onClick={status === "error" ? retry : undefined}
          />
          <SettingsRow icon={Download} label={t("morePage.items.exportPdf")} onClick={() => {}} />
        </SettingsSection>

        <SettingsSection title={t("morePage.sections.preferences")}>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <span className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                <Globe size={16} />
              </span>
              <span className="text-sm font-medium text-ink">{t("morePage.items.theme")}</span>
            </span>
            <SegmentedControl
              layoutId="settings-theme"
              options={[
                { value: "light", label: t("settings.light") },
                { value: "dark", label: t("settings.dark") },
                { value: "system", label: t("settings.auto") },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </div>
          <SettingsRow
            icon={Bell}
            label={t("morePage.items.notifications")}
            trailing={
              <Switch checked={notifications} onChange={setNotifications} aria-label={t("common.toggleNotifications")} />
            }
          />
          <SettingsRow icon={SettingsIcon} label={t("morePage.items.settings")} onClick={() => {}} />
        </SettingsSection>

        <SettingsSection title={t("morePage.sections.about")}>
          <SettingsRow icon={Info} label={t("morePage.items.aboutTravelTrip")} value="1.0.0" onClick={() => {}} />
          <SettingsRow icon={HelpCircle} label={t("settings.helpSupport")} onClick={() => {}} />
        </SettingsSection>
      </motion.div>
    </PageLoadingGate>
  );
}

export default MorePage;
