import React from 'react';
import { Footer } from './Footer';
import { useNavigate } from 'react-router-dom';

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const BOT_LINK = "https://t.me/SoftSkillsCrmSupportbot"; 

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 antialiased flex flex-col justify-between">
        <div className="max-w-xl mx-auto w-full bg-white shadow-xl shadow-indigo-100/40 rounded-2xl p-6 sm:p-10 border border-slate-100 relative mt-8">
          
          <header className="border-b border-slate-100 pb-6 mb-8">
          <div className="flex items-center gap-4 mb-3">
            <button 
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center group"
              onClick={() => navigate('/')}
              title="Назад"
            >
              <svg 
                xmlns="http://w3.org" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="2.5" 
                stroke="currentColor" 
                className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight uppercase bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              Служба поддержки
            </h1>
          </div>

          <p className="text-sm font-semibold text-indigo-600 tracking-wider uppercase flex items-center gap-2">
            Сервис «softskills crm» 
            <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full font-bold border border-indigo-100">
              Бета
            </span>
          </p>
        </header>

          <div className="mb-8 p-4 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-xl border border-sky-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Есть срочный вопрос?</h4>
                <p className="text-xs text-slate-500">Напишите нашему боту напрямую для быстрого ответа</p>
              </div>
            </div>
            <a 
              href={BOT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all whitespace-nowrap hover:shadow"
            >
              Открыть TG
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
