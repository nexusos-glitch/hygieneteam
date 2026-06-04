import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import { SubscriptionPaywall } from "@/components/subscription/SubscriptionPaywall";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { WalkthroughProvider } from "@/hooks/useWalkthrough";
import { WalkthroughOverlay } from "@/components/walkthrough/WalkthroughOverlay";
import AppLayout from "./components/Layout/AppLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import StaffProfile from "./pages/StaffProfile";
import Staff from "./pages/Staff";
import Jobs from "./pages/Jobs";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Theme from "./pages/Theme";
import Privacy from "./pages/Privacy";
import HelpCenter from "./pages/HelpCenter";
import VisitTracking from "./pages/VisitTracking";
import Invoices from "./pages/Invoices";
import AlertHistory from "./pages/AlertHistory";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import Subscribe from "./pages/Subscribe";
import Affiliate from "./pages/Affiliate";
import Billing from "./pages/Billing";
import UpdatesAdmin from "./pages/UpdatesAdmin";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import AdminBranding from "./pages/AdminBranding";
import VisitDetails from "./pages/VisitDetails";
import WhitelabelAdmin from "./pages/WhitelabelAdmin";
import ResellerPortal from "./pages/ResellerPortal";
import GPSPlayback from "./pages/GPSPlayback";
import GPSSetup from "./pages/GPSSetup";
import ClientPortal from "./pages/ClientPortal";
import Achievements from "./pages/Achievements";
import Pricing from "./pages/Pricing";
import DataSharing from "./pages/DataSharing";
import ImportedData from "./pages/ImportedData";
import PaymentHistory from "./pages/PaymentHistory";
import CommandNexusAdmin from "./pages/CommandNexusAdmin";
import UserApiSettings from "./pages/UserApiSettings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    {/* @ts-ignore: next-themes type incompatibility over children */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WalkthroughProvider>
              <OnboardingProvider>
                <WalkthroughOverlay />
                <Routes>
                  <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/auth" element={<PublicRoute redirectTo="/home"><Auth /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                  <Route path="/affiliate" element={<ProtectedRoute><AppLayout><Affiliate /></AppLayout></ProtectedRoute>} />
                  <Route path="/home" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Home /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/schedule" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Schedule /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/clients" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Clients /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/clients/:clientId" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><ClientProfile /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/staff" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Staff /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/staff/:staffId" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><StaffProfile /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/jobs" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Jobs /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/visit-tracking" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><VisitTracking /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/visit/:visitId" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><VisitDetails /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Invoices /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/payment-history" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><PaymentHistory /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/alert-history" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><AlertHistory /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Notifications /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Chat /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Settings /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Profile /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/theme" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Theme /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/privacy" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Privacy /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><HelpCenter /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/admin/updates" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><UpdatesAdmin /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/admin/subscriptions" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><SubscriptionManagement /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/admin/branding" element={<ProtectedRoute><SubscriptionPaywall><AdminBranding /></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/admin/whitelabel" element={<ProtectedRoute><SubscriptionPaywall><WhitelabelAdmin /></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/reseller" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><ResellerPortal /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/gps-playback" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><GPSPlayback /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/gps-playback/:visitId" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><GPSPlayback /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/gps-setup" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><GPSSetup /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/achievements" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><Achievements /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/data-sharing" element={<ProtectedRoute><SubscriptionPaywall><DataSharing /></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/imported-data" element={<ProtectedRoute><SubscriptionPaywall><ImportedData /></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
                  <Route path="/admin/api-keys" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><CommandNexusAdmin /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="/user/api-keys" element={<ProtectedRoute><SubscriptionPaywall><AppLayout><UserApiSettings /></AppLayout></SubscriptionPaywall></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </OnboardingProvider>
            </WalkthroughProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
