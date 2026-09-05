export interface Review {
  id: number;
  message: string;
  rate: number;
  created_at: string;
  user_id: number;
  full_name: string;
  role: string;
  avatar: string | null;
  company_name: string;
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const formattedDate = new Date(review.created_at).toLocaleDateString('ru-RU');

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/10 flex flex-col justify-between hover:shadow-indigo-100/30 hover:border-slate-200/80 transition-all group">
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {review.avatar ? (
              <img src={review.avatar} alt={review.full_name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-50" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-200">
                {review.full_name.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{review.full_name}</h4>
              <p className="text-xs text-slate-400 font-medium">{review.role}</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-xs font-medium">
            {review.company_name}
          </span>
        </div>

        {/* Оценка звездами (rate вместо rating) */}
        <div className="flex items-center gap-0.5 mb-3 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < review.rate ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          «{review.message}»
        </p>
      </div>

      <div className="text-right mt-6 pt-4 border-t border-slate-50">
        <span className="text-xs text-slate-400 font-semibold">{formattedDate}</span>
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
  const ratings = [1, 2, 3, 4, 5];

  const averageRate = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rate, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/20 flex flex-col justify-center items-center md:items-start">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Средняя оценка</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-5xl font-black text-slate-900">{averageRate}</span>
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
            const count = reviews.filter(r => r.rate === stars).length;
            return (
              <button
                key={stars}
                onClick={() => onFilterChange(stars)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${activeFilter === stars ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {stars} ★ <span className={`text-xs ${activeFilter === stars ? 'text-indigo-200' : 'text-slate-400'}`}>{count}</span>
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

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeFilter, setActiveFilter] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [rate, setRate] = useState(5);

  const API_BASE = `${import.meta.env.VITE_HOST || 'http://localhost'}:${import.meta.env.VITE_PORT || '3000'}`;
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/getsession`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.session.user_id);
        console.log(currentUserId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/getfeedbacks`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchReviews();
  }, []);
  const myReview = reviews.find(r => r.user_id === currentUserId);
  const otherReviews = reviews.filter(r => r.user_id !== currentUserId);

  const filteredReviews = activeFilter === 'all'
    ? otherReviews
    : otherReviews.filter(r => r.rate === activeFilter);

  const averageRate = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rate, 0) / reviews.length).toFixed(1)
    : '0.0';
  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить свой отзыв?')) return;

    try {
      const response = await fetch(`${API_BASE}/deletefeedback/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Не удалось удалить отзыв');
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEditing = editingReviewId !== null;
    const url = isEditing
      ? `${API_BASE}/updatefeedback${editingReviewId}`
      : `${API_BASE}/createfeedback`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, rate })
      });

      if (response.ok) {
        handleCloseModal();
        fetchReviews();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка при сохранении отзыва');
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleEditClick = (review: Review) => {
    setEditingReviewId(review.id);
    setMessage(review.message);
    setRate(review.rate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReviewId(null);
    setMessage('');
    setRate(5);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 antialiased">
      <div className="max-w-5xl mx-auto">

        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200/60 pb-8 mb-10 gap-6">
          <div className="flex items-start gap-4">
            <button
              className="p-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
              onClick={() => navigate('/profile')}
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Отзывы пользователей</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Панель управления обратной связью CRM</p>
            </div>
          </div>

          {!myReview && currentUserId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-5 rounded-xl shadow-md transition-all cursor-pointer text-sm"
            >
              Оставить отзыв
            </button>
          )}
        </header>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/20 md:col-span-2 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center md:text-left">Фильтровать по оценке</h3>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${activeFilter === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              Все ({reviews.length})
            </button>
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                onClick={() => setActiveFilter(stars)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${activeFilter === stars ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {stars} ★ <span className="text-xs">({reviews.filter(r => r.rate === stars).length})</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/20 flex flex-col justify-center items-center md:items-start">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Средняя оценка</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-black text-slate-900">{averageRate}</span>
                <span className="text-lg font-bold text-indigo-600">/ 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {myReview && (
        <div className="mb-10 p-6 sm:p-8 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 rounded-2xl border border-indigo-100 shadow-md">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold shadow-sm">★</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ваш опубликованный отзыв</h4>
                <p className="text-xs text-slate-400 font-medium">Вы можете изменить или удалить его в любое время</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-white text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold shadow-sm">
              {myReview.company_name}
            </span>
          </div>

          <div className="flex items-center gap-0.5 mb-3 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`w-4 h-4 ${i < myReview.rate ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium italic">«{myReview.message}»</p>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-indigo-100/60">
            <span className="text-xs text-slate-400 font-semibold">
              {new Date(myReview.created_at).toLocaleDateString('ru-RU')}
            </span>
            <div className="flex gap-2.5">
              <button
                onClick={() => handleEditClick(myReview)}
                className="text-xs font-bold text-indigo-600 hover:text-white bg-white hover:bg-indigo-600 px-3.5 py-2 rounded-xl border border-indigo-100 hover:border-indigo-600 transition-all cursor-pointer shadow-sm"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDelete(myReview.id)}
                className="text-xs font-bold text-rose-600 hover:text-white bg-white hover:bg-rose-600 px-3.5 py-2 rounded-xl border border-rose-100 hover:border-rose-600 transition-all cursor-pointer shadow-sm"
              >
                Удалить отзыв
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 className="text-xl font-bold text-slate-900 mb-6">Лента отзывов</h2>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Загрузка отзывов из бэкенда...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Отзывов не обнаружено</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-100/10 flex flex-col justify-between hover:shadow-indigo-100/30 transition-all">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {review.avatar ? (
                      <img src={review.avatar} alt={review.full_name} className="w-11 h-11 rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {review.full_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{review.full_name}</h4>
                      <p className="text-xs text-slate-400 font-medium">{review.role}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-xs font-medium">
                    {review.company_name}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 mb-3 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < review.rate ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium">«{review.message}»</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                <span className="text-xs text-slate-400 font-semibold">
                  {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                {editingReviewId ? 'Редактировать отзыв' : 'Ваш отзыв о системе'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Оценка системы</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num} type="button"
                      onClick={() => setRate(num)}
                      className={`p-2 rounded-xl text-sm font-bold border transition-all cursor-pointer flex-1 text-center ${rate >= num ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Текст отзыва</label>
                <textarea
                  rows={4} required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Что вам понравилось в CRM?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer text-center text-sm shadow-md">
                {editingReviewId ? 'Сохранить изменения' : 'Опубликовать отзыв'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
