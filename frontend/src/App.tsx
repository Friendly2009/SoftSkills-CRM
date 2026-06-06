import { useState } from 'react';
import Index from './components/Index';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Teachers } from './components/Teachers';
import { Groups } from './components/Groups';
import { Schedule } from './components/Schedule';
import { Grades } from './components/Grades';
import { Finance } from './components/Finance';
import { Settings } from './components/Settings';
import { LoginForm } from './components/Aauthorization';
import { RegisterForm } from './components/Registration';

type Page = 'index' | 'dashboard' | 'students' | 'teachers' | 'groups' | 'schedule' | 'grades' | 'finance' | 'settings' | 'registration' | 'authorization';

function App() {
  let [currentPage, setCurrentPage] = useState<Page>('index');
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
      case 'students':
        return <Students />;
      case 'teachers':
        return <Teachers />;
      case 'groups':
        return <Groups />;
      case 'schedule':
        return <Schedule />;
      case 'grades':
        return <Grades />;
      case 'finance':
        return <Finance />;
      case 'settings':
        return <Settings />;
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
