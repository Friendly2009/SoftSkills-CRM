import React, { useState } from 'react';
import { MenuIcon, BellIcon, SearchIcon } from './Icons';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchMessage(`Поиск: ${searchQuery.trim()}`);
    window.setTimeout(() => setSearchMessage(null), 1800);
  };

  return (
    <header className="relative h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
      {searchMessage && (
        <div className="absolute right-4 top-[4.5rem] z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {searchMessage}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="bg-transparent border-none outline-none ml-2 w-40 lg:w-64 text-sm"
          />
        </form>

        {/* Notifications */}
        <button
          onClick={() => setIsNotificationsOpen((current) => !current)}
          className="relative p-2 rounded-lg hover:bg-gray-100"
          aria-label="Открыть уведомления"
        >
          <BellIcon className="w-6 h-6 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {isNotificationsOpen && (
          <div className="absolute right-4 top-14 z-50 w-80 rounded-xl border border-gray-100 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-gray-800">Уведомления</p>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Закрыть
              </button>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">2 платежа ожидают подтверждения.</div>
              <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">Сегодня 4 занятия в расписании.</div>
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">Новая заявка на обучение добавлена.</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
