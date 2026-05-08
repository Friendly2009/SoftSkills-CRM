import React from 'react';
import {
  DashboardIcon,
  StudentsIcon,
  TeachersIcon,
  GroupsIcon,
  ScheduleIcon,
  GradesIcon,
  FinanceIcon,
  SettingsIcon,
  CloseIcon,
} from './Icons';

type Page = 'dashboard' | 'students' | 'teachers' | 'groups' | 'schedule' | 'grades' | 'finance' | 'settings';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems: { id: Page; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Дашборд', icon: DashboardIcon },
  { id: 'students', label: 'Студенты', icon: StudentsIcon },
  { id: 'teachers', label: 'Преподаватели', icon: TeachersIcon },
  { id: 'groups', label: 'Группы', icon: GroupsIcon },
  { id: 'schedule', label: 'Расписание', icon: ScheduleIcon },
  { id: 'grades', label: 'Оценки', icon: GradesIcon },
  { id: 'finance', label: 'Финансы', icon: FinanceIcon },
  { id: 'settings', label: 'Настройки', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-white font-semibold text-lg">EduCRM</span>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">АД</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Админ</p>
                <p className="text-gray-400 text-xs">admin@educrm.ru</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
