import { motion } from "framer-motion";
import { Flame, Phone, ShieldAlert } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/ui";
import { riseIn } from "@/design-system/motion";
import { useTranslation } from "@/i18n";

const CONTACTS = [
  { icon: ShieldAlert, labelKey: "emergency.police", value: "110" },
  { icon: Flame, labelKey: "emergency.fireAmbulance", value: "119" },
  { icon: Phone, labelKey: "emergency.visitorHotline", value: "050-3816-2787" },
] as const;

export function EmergencyCard() {
  const { t } = useTranslation();

  return (
    <motion.div variants={riseIn} className="flex flex-col gap-3">
      <SectionHeader title={t("emergency.title")} />
      <GlassCard padding="none" className="mx-5 divide-y divide-ink/8 overflow-hidden">
        {CONTACTS.map(({ icon: Icon, labelKey, value }) => (
          <div key={labelKey} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/12 text-red-500">
              <Icon size={16} />
            </span>
            <span className="flex-1 text-sm font-medium text-ink">{t(labelKey)}</span>
            <span className="text-sm font-semibold text-ink-muted">{value}</span>
          </div>
        ))}
      </GlassCard>
    </motion.div>
  );
}
