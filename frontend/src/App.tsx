import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './components/Index';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/Aauthorization';
import { RegisterForm } from './components/Registration';
import { ProfilePage } from './components/Profile';
import { ClientProfile } from './components/DashboardsComponents/СlientsComponents/ClientProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/authorization" element={<LoginForm />} />
        <Route path="/registration" element={<RegisterForm />} />
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route 
          path="/dashboard" 
          element={
            <Dashboard />
          } 
        />
        <Route path="/dashboard/client/:id" element={<ClientProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
