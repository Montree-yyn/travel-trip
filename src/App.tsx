import { AppRouter } from "@/router/AppRouter";
import { AuthProvider } from "@/auth";
import { I18nProvider } from "@/i18n";
import { AuthGate } from "@/router/AuthGate";
import { SyncGate, TripSyncProvider } from "@/sync";
import { ThemeProvider } from "@/theme/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <TripSyncProvider>
            <AuthGate>
              <SyncGate>
                <AppRouter />
              </SyncGate>
            </AuthGate>
          </TripSyncProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
