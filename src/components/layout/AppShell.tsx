import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

import { fadeIn } from "@/design-system/motion";

import { BottomNav } from "./BottomNav";

/** Root layout: full-height mobile frame with a scrollable page area and a floating bottom nav. */
export function AppShell() {
  return (
    <div className="relative isolate mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg md:max-w-lg lg:max-w-xl">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="no-scrollbar relative z-0 flex-1 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+7.25rem)]">
          <motion.div
            variants={fadeIn}
            initial={false}
            animate="visible"
            className="flex min-h-full flex-col"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
