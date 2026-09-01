import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { MetricsProvider } from "./context/MetricsContext";
import { DemoProvider } from "./context/DemoContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { LiveActivityTicker } from "./components/LiveActivityTicker";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AboutPage } from "./pages/AboutPage";
import { PricingPage } from "./pages/PricingPage";
import { StatusPage } from "./pages/StatusPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { RecoveryCasesPage } from "./pages/RecoveryCasesPage";
import { CaseInvestigationPage } from "./pages/CaseInvestigationPage";
import { ApprovalCenterPage } from "./pages/ApprovalCenterPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { CheckoutAbandonmentPage } from "./pages/CheckoutAbandonmentPage";
import { AiActivityPage } from "./pages/AiActivityPage";
import { AuditTrailPage } from "./pages/AuditTrailPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { PolicyConfigPage } from "./pages/PolicyConfigPage";
import { SimulationCenterPage } from "./pages/SimulationCenterPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { SecurityPage } from "./pages/SecurityPage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { EngineeringNotesPage } from "./pages/EngineeringNotesPage";
import { SystemEvaluationPage } from "./pages/SystemEvaluationPage";
import { HardeningLogPage } from "./pages/HardeningLogPage";
import { DemoJourneyPage } from "./pages/DemoJourneyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AskMeAnythingDrawer } from "./components/AskMeAnythingDrawer";

const FULL_SCREEN_PATHS = new Set([
  "/", "/login", "/register", "/about", "/pricing", "/status",
  "/terms", "/privacy", "/security", "/architecture", "/engineering",
  "/evaluation", "/changelog", "/engineering-notes", "/hardening-log", "/demo"
]);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (FULL_SCREEN_PATHS.has(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-app)]">
        <Header onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
        <LiveActivityTicker />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-[var(--bg-app)]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      <AskMeAnythingDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MetricsProvider>
          <DemoProvider>
            <Router>
              <AppLayout>
                <Routes>
                  {/* Full-screen routes (no sidebar) */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/demo" element={<DemoJourneyPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/architecture" element={<ArchitecturePage />} />
                  <Route path="/engineering" element={<ArchitecturePage />} />
                  <Route path="/evaluation" element={<SystemEvaluationPage />} />
                  <Route path="/changelog" element={<EngineeringNotesPage />} />
                  <Route path="/engineering-notes" element={<EngineeringNotesPage />} />
                  <Route path="/hardening-log" element={<HardeningLogPage />} />
                  {/* App routes (with sidebar) */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/cases" element={<RecoveryCasesPage />} />
                  <Route path="/recovery-cases" element={<RecoveryCasesPage />} />
                  <Route path="/cases/:id" element={<CaseInvestigationPage />} />
                  <Route path="/recovery-cases/:id" element={<CaseInvestigationPage />} />
                  <Route path="/approvals" element={<ApprovalCenterPage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/subscriptions" element={<SubscriptionsPage />} />
                  <Route path="/checkout" element={<CheckoutAbandonmentPage />} />
                  <Route path="/ai-activity" element={<AiActivityPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/audit" element={<AuditTrailPage />} />
                  <Route path="/policy" element={<PolicyConfigPage />} />
                  <Route path="/policies" element={<PolicyConfigPage />} />
                  <Route path="/simulation" element={<SimulationCenterPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppLayout>
            </Router>
          </DemoProvider>
        </MetricsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
