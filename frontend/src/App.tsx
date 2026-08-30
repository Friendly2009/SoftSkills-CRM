import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './components/index';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/Aauthorization';
import { RegisterForm } from './components/Registration';
import { ProfilePage } from './components/Profile';
import { ClientProfile } from './components/DashboardsComponents/СlientsComponents/ClientProfile';
import { PricingSection } from './components/Price';
import { PricePage } from './components/Prices/PricePage';
import { PrivacyPolicy } from './components/Privacy';
import { TermsOfService } from './components/Terms';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/authorization" element={<LoginForm />} />
        <Route path="/registration" element={<RegisterForm />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />
        <Route path="/dashboard/client/:id" element={<ClientProfile />} />
        <Route path="/price" element={<PricingSection />} />
        <Route path="/tarid-details/:tariffId" element={<PricePage />} />
        <Route path='/privacy' element={<PrivacyPolicy/>}/>
        <Route path='/terms' element={<TermsOfService/>}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
