import { useState } from "react";

export const LoginForm = ({ setPage }: { setPage: (page: 'registration' | 'authorization' | "dashboard" | "index") => void }) => {

  const [formData, setFormData] = useState({
    company: '',
    login: '',
    password: ''
  });
  const backbtnOnClick = () => {
    setPage('index');
  }
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
      const response = await fetch('http://localhost:5000/api/signin');
    try{

    } catch(ex){

    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl border border-gray-100">
        <button onClick={backbtnOnClick}>
          <img src="/img/user/dashboard/angle-left-solid.png" className="backbtn" alt="exit"></img>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">С возвращением!</h2>
          <p className="mt-2 text-sm text-gray-600">Пожалуйста, войдите в свой аккаунт</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Компания</label>
              <input type="text" required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="OOO 'Тмыв денег'" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Логин</label>
              <input type="text" required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Логие" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
              <input type="password" required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};
