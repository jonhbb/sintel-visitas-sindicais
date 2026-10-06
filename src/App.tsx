import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister, CACHE_MAX_AGE } from "@/lib/queryClient";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useVisitReminders } from "@/hooks/useVisitReminders";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Visits from "./pages/Visits";
import NewVisit from "./pages/NewVisit";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

function AppEffects() {
  useVisitReminders();
  return null;
}

// No app nativo não há servidor para rotas profundas, então usamos HashRouter
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}
    onSuccess={() => queryClient.resumePausedMutations()}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router {...(Capacitor.isNativePlatform() ? {} : { basename: import.meta.env.BASE_URL })}>
        <AuthProvider>
          <AppEffects />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/visitas" element={<ProtectedRoute><Visits /></ProtectedRoute>} />
            <Route path="/nova-visita" element={<ProtectedRoute><NewVisit /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
