import { useState } from 'react';
import Index from './components/index';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Teachers } from './components/Teachers';
import { Groups } from './components/Groups';
import { Schedule } from './components/Schedule';
import { Grades } from './components/Grades';
import { Finance } from './components/Finance';
import { Settings } from './components/Settings';

type Page = 'index' | 'dashboard' | 'students' | 'teachers' | 'groups' | 'schedule' | 'grades' | 'finance' | 'settings';

const pageTitles: Record<Page, string> = {
  index: "",
  dashboard: 'Дашборд',
  students: 'Студенты',
  teachers: 'Преподаватели',
  groups: 'Группы',
  schedule: 'Расписание',
  grades: 'Оценки',
  finance: 'Финансы',
  settings: 'Настройки',
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('index');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (currentPage === 'index') {
    return <Index/>;
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageTitles[currentPage]}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
