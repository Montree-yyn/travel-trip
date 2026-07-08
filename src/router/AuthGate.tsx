import type { ReactNode } from "react";

import { useAuth } from "@/auth";
import { GenericPageSkeleton } from "@/components/ui/GenericPageSkeleton";
import { LoginPage } from "@/pages/Login/LoginPage";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-bg md:max-w-lg lg:max-w-xl">
        <GenericPageSkeleton />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return children;
}
