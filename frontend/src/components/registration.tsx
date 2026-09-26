import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { IdebugProps } from "@/interfaces/debugInterface";

export const RegisterForm: React.FC<IdebugProps> = ({ isDebug }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: '',
    fullname: '',
    email: '',
    contact: '',
    password: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDebug) {
      if (!agreeTerms) {
        alert('Требуется соглашение с политикой конфиленциальности и публичной оферты');
        return;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/signup`, {
          credentials: "include",
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (ex) {
        console.log(ex);
      }
    } else {
      alert("Подайте заявку на бета тестирование, написав в поддержке https://t.me/SoftSkillsCrmSupportbot");
      return;
    }
  }
  const backbtnOnClick = () => {
    navigate('/index');
  }
  return (
    <>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-100 p-8 relative transition-all">

          <button
            onClick={backbtnOnClick}
            className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-sm group"
            type="button"
          >
            <img
              src="/img/user/dashboard/angle-left-solid.png"
              className="w-4 h-4 opacity-60 group-hover:opacity-90 transition"
              alt="exit"
            />
          </button>

          <div className="text-center mt-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Создать центр</h2>
            <p className="text-sm text-slate-500 mt-1.5">Присоединяйтесь к нашей CRM системе</p>
          </div>

          {isDebug === true && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Имя центра</label>
                  <input
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
                    placeholder="AnyCompany"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">ФИО</label>
                  <input
                    name="fullname"
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
                    placeholder="Иван Иванов Иванович"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Эл. почта</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
                    placeholder="mail@example.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Номер телефона</label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
                    placeholder="+71234567890"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Пароль</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
                    placeholder="••••••••"
                  />
                </div>

              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition mt-0.5 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-normal select-none cursor-pointer">
                  Я согласен с условиями{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline">
                    Публичной оферты
                  </a>{" "}
                  и{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline">
                    Политикой конфиденциальности
                  </a>.
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:bg-blue-800 active:scale-[0.99] shadow-sm hover:shadow transition-all cursor-pointer mt-2"
              >
                Создать центр
              </button>
            </form>
          )}

          {isDebug === false && (
            <div className="text-center bg-amber-50/60 border border-amber-200/70 p-4 rounded-xl mt-4">
              <p className="text-sm leading-relaxed text-amber-900 font-medium">
                Подайте заявку на бета-тестирование, написав в поддержку:{" "}
                <a
                  href="https://t.me/imchelovek09"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline break-all block mt-1 font-semibold"
                >
                  @imchelovek09
                </a>
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );

};
