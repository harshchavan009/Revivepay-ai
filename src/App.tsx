import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { LiveActivityTicker } from "./components/LiveActivityTicker";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
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

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLandingOrAuth = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register";

  if (isLandingOrAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#041018] text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#041018]">
        <Header />
        <LiveActivityTicker />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#041018]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
};

export default App;
