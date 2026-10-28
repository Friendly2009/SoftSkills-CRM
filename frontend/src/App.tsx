import { DataModeProvider } from "./data/DataModeProvider";
import { API_BASE_URL } from "./data/runtime";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./components/index";

import { PublicInfo } from "./real/PublicInfo";
import { Auth } from "./real/Auth";
const Workspace = lazy(() => import("./real/Workspace").then(m => ({default:m.Workspace})));
import { PricingSection } from "./components/Price";
import { PricePage } from "./components/Prices/PricePage";
import { PrivacyPolicy } from "./components/Privacy";
import { TermsOfService } from "./components/Terms";
import { SupportPage } from "./components/Support";
import { ContactsPage } from "./components/Contact";
import { ReviewsPage } from "./components/Feedback";
import { useState, lazy, Suspense } from "react";
const CrmApp = lazy(() =>
  import("./crm/app/CrmApp").then((m) => ({ default: m.CrmApp })),
);
import { TransferFilesPage } from "./components/TransferFilesPage";
import { FaqPage } from "./components/FaqPage";
function App() {
  // One source of truth for the new CRM: true = local demo, false = HTTP API.
  const [isMock, setIsMock] = useState(import.meta.env.VITE_IS_MOCK === "true");

  return (
    <DataModeProvider isMock={isMock} setIsMock={setIsMock}>
    <BrowserRouter key={String(isMock)}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/authorization"
          element={<Auth mode="login" />}
        />
        <Route
          path="/registration"
          element={<Auth mode="register" />}
        />
        <Route path="/invitation" element={<Auth mode="invitations/accept" />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/transfer_page" element={isMock?<TransferFilesPage />:<Navigate to="/dashboard/imports" replace/>} />
        <Route path="/faq" element={isMock?<FaqPage />:<PublicInfo page="faq"/>} />
        <Route
          path="/dashboard/*"
          element={
            <Suspense fallback={<div role="status">Загрузка CRM…</div>}>
              {isMock ? <CrmApp isMock apiBaseUrl={API_BASE_URL} /> : <Workspace />}
            </Suspense>
          }
        />
        <Route path="/price" element={isMock?<PricingSection />:<PublicInfo page="price"/>} />
        <Route path="/tarid-details/:tariffId" element={isMock?<PricePage />:<PublicInfo page="price"/>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/Contact" element={<ContactsPage />} />
        <Route path="/Feedback" element={isMock?<ReviewsPage />:<PublicInfo page="reviews"/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </DataModeProvider>
  );
}

export default App;
