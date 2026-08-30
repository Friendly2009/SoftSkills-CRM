import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import register from '@/components/cssmoduls/Signup.module.css'
import { Footer } from './Footer';

export const ContactsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 antialiased">
                <div className="max-w-2xl mx-auto bg-white shadow-md rounded-xl p-6 sm:p-10 border border-slate-200">
                    <button className={register['back-btn']} onClick={() => navigate('/')} style={{ position: "fixed" }}><img src="/img/user/dashboard/angle-left-solid.png" className={register['back-icon']} alt="exit" /></button>

                    <header className="border-b border-slate-200 pb-6 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
                            Контакты
                        </h1>
                        <p className="text-md font-medium text-indigo-600 mt-1">
                            Сервис «softskills crm» (Бета-версия)
                        </p>
                    </header>

                    <div className="space-y-8">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                        Основной канал связи
                                    </p>
                                    <h3 className="text-lg font-bold text-slate-950 mb-2">Telegram-Бот</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Быстрые ответы на вопросы, отправка багов и поддержка пользователей.
                                    </p>
                                </div>
                                <a
                                    href="https://t.me"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center py-2.5 px-4 rounded-lg text-sm transition-colors"
                                >
                                    Открыть Telegram
                                </a>
                            </div>

                            {/* Email */}
                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Для официальных запросов
                                    </p>
                                    <h3 className="text-lg font-bold text-slate-950 mb-2">Электронная почта</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        По вопросам сотрудничества, отзывов лицензий и правовых обращений.
                                    </p>
                                </div>
                                <a
                                    href="mailto:kirill.tsyganov@internet.ru"
                                    className="mt-4 block text-center font-bold text-indigo-600 hover:text-indigo-500 transition-colors break-all text-sm sm:text-base py-2"
                                >
                                    kirill.tsyganov@internet.ru
                                </a>
                            </div>

                        </div>

                        <section className="pt-6 border-t border-slate-200">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                                Юридическая информация
                            </h2>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm text-slate-700">
                                <p><strong>Разработчик и оператор:</strong> Цыганов Кирилл Евгеньевич</p>
                                <p><strong>Статус проекта:</strong> Открытое бета-тестирование (безвозмездное использование)</p>
                                <p className="text-xs text-slate-400 pt-2 leading-relaxed">
                                    Деятельность осуществляется в соответствии с законодательством РФ. Вы можете ознакомиться с правовыми документами проекта по ссылкам ниже.
                                </p>
                            </div>
                        </section>

                        <footer className="pt-6 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
                            <Link to="/terms" className="hover:text-indigo-600 transition-colors">
                                Договор-оферта
                            </Link>
                            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">
                                Политика конфиденциальности
                            </Link>
                            <Link to="/privacy#cookie" className="hover:text-indigo-600 transition-colors">
                                Политика cookie
                            </Link>
                        </footer>

                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};
