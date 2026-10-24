import { DataModeProvider } from "./data/DataModeProvider";
import { API_BASE_URL } from "./data/runtime";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./components/index";

import { LoginForm } from "./components/Aauthorization";
import { RegisterForm } from "./components/registration";
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
  const [isMock, setIsMock] = useState(true);
  const isDebug = false;
  return (
    <DataModeProvider isMock={isMock} setIsMock={setIsMock}>
    <BrowserRouter key={String(isMock)}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/authorization"
          element={<LoginForm isDebug={isDebug} />}
        />
        <Route
          path="/registration"
          element={<RegisterForm isDebug={isDebug} />}
        />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/transfer_page" element={<TransferFilesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route
          path="/dashboard/*"
          element={
            <Suspense fallback={<div role="status">Загрузка CRM…</div>}>
              <CrmApp isMock={isMock} apiBaseUrl={API_BASE_URL} />
            </Suspense>
          }
        />
        <Route path="/price" element={<PricingSection />} />
        <Route path="/tarid-details/:tariffId" element={<PricePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/Contact" element={<ContactsPage />} />
        <Route path="/Feedback" element={<ReviewsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </DataModeProvider>
  );
}

export default App;
