import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/auth";
import { Button, GlassCard, ThemeToggle } from "@/components/ui";
import { PageAccent } from "@/components/layout";
import { riseIn, staggerContainer } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { isFirebaseConfigured } from "@/firebase/config";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { signInWithGoogle, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const configured = isFirebaseConfigured();

  async function handleSignIn() {
    clearError();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error state is set by auth context.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageAccent tone="pink">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-[env(safe-area-inset-top)] md:max-w-lg lg:max-w-xl"
      >
        <div className="flex justify-end pt-4">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <motion.div variants={riseIn} className="text-center">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-ink">{t("auth.title")}</h1>
            <p className="mt-2 text-sm text-ink-muted">{t("auth.subtitle")}</p>
          </motion.div>

          <motion.div variants={riseIn} className="w-full max-w-sm">
            <GlassCard elevated padding="lg" className="flex flex-col gap-4">
              {!configured && (
                <div className="flex items-start gap-3 rounded-2xl bg-accent-soft p-3 text-accent-strong">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs leading-relaxed">{t("auth.notConfigured")}</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-2xl bg-red-500/10 p-3 text-red-500">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs leading-relaxed">{t(error)}</p>
                </div>
              )}

              <Button
                fullWidth
                variant="secondary"
                size="lg"
                disabled={!configured || submitting}
                onClick={() => void handleSignIn()}
              >
                <GoogleIcon />
                {submitting ? t("auth.signingIn") : t("auth.continueWithGoogle")}
              </Button>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </PageAccent>
  );
}

export default LoginPage;
