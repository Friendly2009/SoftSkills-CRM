export interface Review {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
  tag?: string;
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/10 flex flex-col justify-between hover:shadow-indigo-100/30 hover:border-slate-200/80 transition-all group">
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {review.avatar ? (
              <img src={review.avatar} alt={review.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-50" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-200">
                {review.name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{review.name}</h4>
              <p className="text-xs text-slate-400 font-medium">{review.role}</p>
            </div>
          </div>
          {review.tag && (
            <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-xs font-medium">
              {review.tag}
            </span>
          )}
        </div>
        
        {/* Оценка звездами */}
        <div className="flex items-center gap-0.5 mb-3 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          «{review.text}»
        </p>
      </div>
      
      <div className="text-right mt-6 pt-4 border-t border-slate-50">
        <span className="text-xs text-slate-400 font-semibold">{review.date}</span>
      </div>
    </div>
  );
};

interface StatsProps {
  reviews: Review[];
  activeFilter: number | 'all';
  onFilterChange: (filter: number | 'all') => void;
}

export const ReviewStats: React.FC<StatsProps> = ({ reviews, activeFilter, onFilterChange }) => {
  const ratings =[1,2,3,4,5];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/20 flex flex-col justify-center items-center md:items-start">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Средняя оценка</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-5xl font-black text-slate-900">4.8</span>
          <span className="text-lg font-bold text-indigo-600">/ 5</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/20 md:col-span-2 flex flex-col justify-center">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center md:text-left">Фильтровать по оценке</h3>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <button 
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${activeFilter === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            Все отзывы ({reviews.length})
          </button>
          {ratings.map((stars) => {
            const count = reviews.filter(r => r.rating === stars).length;
            return (
              <button
                key={stars}
                onClick={() => onFilterChange(stars)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${activeFilter === stars ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {stars} ★ <span className={`text-xs ${activeFilter === stars ? 'text-indigo-200' : 'text-slate-400'}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<number | 'all'>('all');

  const [reviews] = useState<Review[]>([
    {
      id: 1,
      name: 'Александр Ковалев',
      role: 'Руководитель отдела продаж',
      avatar: 'https://unsplash.com',
      rating: 5,
      tag: 'Крупный бизнес',
      text: 'Внедрение softskills crm позволило нам сократить время обработки лидов на 40%. Аналитика по навыкам менеджеров — это просто пушка.',
      date: '12.05.2026'
    },
    {
      id: 2,
      name: 'Екатерина Блинова',
      role: 'HR-директор',
      avatar: 'https://unsplash.com',
      rating: 5,
      tag: 'Управление командой',
      text: 'Очень удобный интерфейс. Система оценки софт-скиллов сотрудников автоматизировала рутину.',
      date: '28.04.2026'
    }
  ]);

  const filteredReviews = activeFilter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === activeFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 antialiased">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-8 mb-10 gap-6">
          <div className="flex items-start gap-4">
            <button 
              className="p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
              onClick={() => navigate('/')}
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Отзывы пользователей</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Что говорят о «softskills crm» наши клиенты</p>
            </div>
          </div>
        </header>

        <ReviewStats 
          reviews={reviews} 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {filteredReviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Пока нет отзывов с такой оценкой</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};