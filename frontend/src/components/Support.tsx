import React, { useState } from 'react';
import { Footer } from './Footer';
import { useNavigate } from 'react-router-dom';
import register from '@/components/cssmoduls/Signup.module.css'

export const SupportPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const BOT_TOKEN = "ВАШ_ТОКЕН_БОТА";
    const CHAT_ID = "ВАШ_CHAT_ID_ИЛИ_ГРУППЫ";

    const text = `🚨 *Новое обращение в поддержку*\n\n` +
      `📌 *Тема:* ${subject}\n` +
      `💬 *Сообщение:* ${message}`;

    try {
      const response = await fetch(`https://telegram.org{BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        setStatus('success');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 antialiased">
        <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-6 sm:p-10 border border-slate-200">
          <button className={register['back-btn']} onClick={() => navigate('/')} style={{ position: "fixed" }}><img src="/img/user/dashboard/angle-left-solid.png" className={register['back-icon']} alt="exit" /></button>
          <header className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
              Служба поддержки
            </h1>
            <p className="text-md font-medium text-indigo-600 mt-1">
              Сервис «softskills crm» (Бета-версия)
            </p>
          </header>

          {status === 'success' && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-sm">
              ✅ Обращение успешно отправлено! Мы уже получили его в Telegram и скоро свяжемся с вами.
            </div>
          )}
          {status === 'error' && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 text-sm">
              ❌ Ошибка при отправке. Пожалуйста, попробуйте позже или напишите на почту admin@example.com
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-slate-900 mb-2">
                Тема обращения / Где нашли баг?
              </label>
              <input
                type="text"
                id="subject"
                required
                disabled={status === 'loading'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Например: Не прожимается кнопка баланса"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-slate-900 mb-2">
                Подробное описание проблемы
              </label>
              <textarea
                id="message"
                required
                rows={5}
                disabled={status === 'loading'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишите ваши действия перед багом..."
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-none disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg shadow-sm text-sm tracking-wide transition-colors cursor-pointer text-center disabled:opacity-50"
            >
              {status === 'loading' ? 'Отправка...' : 'Отправить в поддержку'}
            </button>
          </form>

        </div>
      </div>
      <Footer />
    </>
  );
};
