import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { GlassCard, SectionHeader } from "@/components/ui";
import { riseIn } from "@/design-system/motion";

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.div variants={riseIn} className="flex flex-col gap-3">
      <SectionHeader title={title} />
      <GlassCard padding="none" className="mx-5 divide-y divide-ink/8 overflow-hidden">
        {children}
      </GlassCard>
    </motion.div>
  );
}
