import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './components/index';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/Aauthorization';
import { RegisterForm } from './components/registration';
import { ProfilePage } from './components/Profile';
import { ClientProfile } from './components/DashboardsComponents/СlientsComponents/ClientProfile';
import { PricingSection } from './components/Price';
import { PricePage } from './components/Prices/PricePage';
import { PrivacyPolicy } from './components/Privacy';
import { TermsOfService } from './components/Terms';
import { SupportPage } from './components/Support';
import { ContactsPage } from './components/Contact';
import { ReviewsPage } from './components/Feedback';
import { useState } from 'react';
import { TransferFilesPage } from './components/TransferFilesPage';
import { FaqPage } from './components/FaqPage';
function App() {
  const [isDebug, setIsDebug] = useState(true);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/authorization" element={<LoginForm isDebug={isDebug} />} />
        <Route path="/registration" element={<RegisterForm isDebug={isDebug} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/transfer_page" element={<TransferFilesPage/>}/>
        <Route path="/faq" element={<FaqPage/>}/>
        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />
        <Route path="/dashboard/client/:id" element={<ClientProfile />} />
        <Route path="/price" element={<PricingSection />} />
        <Route path="/tarid-details/:tariffId" element={<PricePage />} />
        <Route path='/privacy' element={<PrivacyPolicy />} />
        <Route path='/terms' element={<TermsOfService />} />
        <Route path='/support' element={<SupportPage />} />
        <Route path='/Contact' element={<ContactsPage />} />
        <Route path='/Feedback' element={<ReviewsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
