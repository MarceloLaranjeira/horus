import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AISettingsProvider } from "@/hooks/useAISettings";
import { ProtectedRoute } from "@/components/app/ProtectedRoute";
import { PWAInstallBanner } from "@/components/app/PWAInstallBanner";
import AppDashboard from "./pages/AppDashboard";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AISettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/app" element={<ProtectedRoute><AppDashboard /></ProtectedRoute>} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AISettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
