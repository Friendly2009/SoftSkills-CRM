import { useState } from 'react';
import Index from './components/Index';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/Aauthorization';
import { RegisterForm } from './components/registration';

type Page = 'index' | 'dashboard' | 'students' | 'teachers' | 'groups' | 'schedule' | 'grades' | 'finance' | 'settings' | 'registration' | 'authorization';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('index');
  switch (currentPage){
    case 'index':
      return <Index setPage={setCurrentPage}/>
    case 'authorization':
      return <LoginForm setPage={setCurrentPage}/>
    case 'registration':
      return <RegisterForm setPage={setCurrentPage}/>
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      {renderPage()}
    </div>
  );
}

export default App;
