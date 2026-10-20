import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ContactsPage } from "@/pages/Contact";
import { FaqPage } from "@/pages/FaqPage";
import { ReviewsPage } from "@/pages/Feedback";
import Index from "@/pages/Landing";
import { LoginForm } from "@/pages/Login";
import { PricingSection } from "@/pages/Price";
import { PricePage } from "@/pages/Prices/PricePage";
import { PrivacyPolicy } from "@/pages/Privacy";
import { ProfilePage } from "@/pages/Profile";
import { RegisterForm } from "@/pages/Registration";
import { SupportPage } from "@/pages/Support";
import { TermsOfService } from "@/pages/Terms";
import { TransferFilesPage } from "@/pages/TransferFilesPage";
import { Notifications } from "@/shared/ui/Notifications";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./AuthProvider";
const Analytic = lazy(() =>
  import("@/features/analytics/Analytics").then((module) => ({
    default: module.Analytic,
  })),
);
const ClientTable = lazy(() =>
  import("@/features/clients/ClientsTable").then((module) => ({
    default: module.ClientTable,
  })),
);
const ClientProfile = lazy(() =>
  import("@/features/clients/components/ClientProfile").then((module) => ({
    default: module.ClientProfile,
  })),
);
const Expenses = lazy(() =>
  import("@/features/finance/Finance").then((module) => ({
    default: module.Expenses,
  })),
);
const GroupTable = lazy(() =>
  import("@/features/groups/GroupsTable").then((module) => ({
    default: module.GroupTable,
  })),
);
const LeadsTable = lazy(() =>
  import("@/features/leads/LeadsTable").then((module) => ({
    default: module.LeadsTable,
  })),
);
const ScheduleTable = lazy(() =>
  import("@/features/schedule/ScheduleTable").then((module) => ({
    default: module.ScheduleTable,
  })),
);
const UsersTable = lazy(() =>
  import("@/features/users/UsersTable").then((module) => ({
    default: module.UsersTable,
  })),
);
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Notifications />
        <Suspense
          fallback={
            <p className="ui-empty" role="status">
              Загрузка раздела…
            </p>
          }
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/authorization" element={<LoginForm />} />
            <Route
              path="/registration"
              element={<RegisterForm isDebug={false} />}
            />
            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/transfer_page" element={<TransferFilesPage />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="analytics" replace />} />
                <Route path="analytics" element={<Analytic />} />
                <Route path="clients" element={<ClientTable />} />
                <Route path="client/:id" element={<ClientProfile />} />
                <Route path="groups" element={<GroupTable />} />
                <Route path="users" element={<UsersTable />} />
                <Route path="schedule" element={<ScheduleTable />} />
                <Route path="finance" element={<Expenses />} />
                <Route path="leads" element={<LeadsTable />} />
              </Route>
            </Route>
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/price" element={<PricingSection />} />
            <Route path="/tarid-details/:tariffId" element={<PricePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/Contact" element={<ContactsPage />} />
            <Route path="/Feedback" element={<ReviewsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
