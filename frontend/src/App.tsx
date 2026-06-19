import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './components/index';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/Aauthorization';
import { RegisterForm } from './components/registration';
import { JSX } from 'react/jsx-runtime';

// Компонент для защиты приватных страниц
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = Boolean(localStorage.getItem('token')); // Ваша проверка авторизации
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/authorization" element={<LoginForm />} />
        <Route path="/registration" element={<RegisterForm />} />

        <Route 
          path="/dashboard" 
          element={
            <Dashboard />
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
