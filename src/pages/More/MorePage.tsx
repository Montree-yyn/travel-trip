import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Cloud,
  FileText,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Shield,
  Star,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

import { SectionHeader, SegmentedControl, Switch, GlassCard } from "@/components/ui";
import { PageLoadingGate } from "@/components/layout";
import { sampleTrip } from "@/data/sample-trip";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useAuth } from "@/auth";
import { useTranslation } from "@/i18n";
import { getCurrentTripDay, getNextActivity } from "@/lib/trip-progress";
import { useTripSync } from "@/sync";
import { useTheme } from "@/theme/useTheme";

import { UpcomingActivityCard } from "../Home/components/UpcomingActivityCard";
import { EmergencyCard } from "./components/EmergencyCard";
import { ExploreGrid } from "./components/ExploreGrid";
import { ProfileCard } from "./components/ProfileCard";
import { SettingsRow } from "./components/SettingsRow";
import { SettingsSection } from "./components/SettingsSection";

export function MorePage() {
  const { t, locale, setLocale } = useTranslation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { status, error, retry } = useTripSync();
  const [offline, setOffline] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const currentDay = getCurrentTripDay(sampleTrip);
  const nextActivity = getNextActivity(currentDay);

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
      <header className="px-5 pb-1 pt-4">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-ink">{t("more.title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("more.subtitle")}</p>
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

      {notifications && (
        <div className="flex flex-col gap-3.5">
          <SectionHeader title={t("home.upcomingActivity")} />
          <UpcomingActivityCard item={nextActivity} seed={currentDay.city} />
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <h2 className="px-5 text-[1.05rem] font-semibold tracking-tight text-ink">{t("more.explore")}</h2>
        <ExploreGrid />
      </div>

      <SettingsSection title={t("settings.preferences")}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium text-ink">{t("settings.appearance")}</span>
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
          icon={Globe}
          label={t("settings.language")}
          value={locale === "th" ? t("settings.thai") : t("settings.english")}
          onClick={toggleLocale}
        />
        <SettingsRow
          icon={syncStatusIcon}
          iconTone={syncStatusTone}
          label={t("sync.statusLabel")}
          value={syncStatusLabel}
          onClick={status === "error" ? retry : undefined}
        />
        <SettingsRow
          icon={WifiOff}
          label={t("settings.offlineMode")}
          trailing={
            <Switch checked={offline} onChange={setOffline} aria-label={t("common.toggleOfflineMode")} />
          }
        />
        <SettingsRow
          icon={Bell}
          label={t("settings.notifications")}
          trailing={
            <Switch checked={notifications} onChange={setNotifications} aria-label={t("common.toggleNotifications")} />
          }
        />
      </SettingsSection>

      <EmergencyCard />

      <SettingsSection title={t("settings.about")}>
        <SettingsRow icon={Info} label={t("settings.appVersion")} value="1.0.0 (Phase 2)" />
        <SettingsRow icon={HelpCircle} label={t("settings.helpSupport")} onClick={() => {}} />
        <SettingsRow icon={Shield} label={t("settings.privacyPolicy")} onClick={() => {}} />
        <SettingsRow icon={FileText} label={t("settings.termsOfService")} onClick={() => {}} />
        <SettingsRow icon={Star} label={t("settings.rateApp")} onClick={() => {}} />
      </SettingsSection>

      <SettingsSection title={t("settings.account")}>
        <SettingsRow icon={LogOut} iconTone="danger" label={t("settings.signOut")} onClick={() => void signOut()} />
      </SettingsSection>

      <p className="flex items-center justify-center gap-1 pt-2 text-xs text-ink-faint">
        {t("more.madeWith", { heart: "♥", companions: sampleTrip.companions.join(" & ") })}
      </p>
    </motion.div>
    </PageLoadingGate>
  );
}

export default MorePage;
