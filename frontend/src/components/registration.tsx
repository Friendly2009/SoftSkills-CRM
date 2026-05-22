import React, { useState } from "react";

export const RegisterForm = ({ setPage }: { setPage: (page: 'registration' | 'authorization' | 'dashboard' | 'index') => void }) => {
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    adminKey: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if(response.ok){
        setPage('dashboard');        
      }
    } catch(ex){
      console.log(ex);
    }
  }
  const backbtnOnClick = () => {
    setPage('index');
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl border border-gray-100">
        <button onClick={backbtnOnClick}>
          <img src="/img/user/dashboard/angle-left-solid.png" className="backbtn" alt="exit"></img>
        </button>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Создать аккаунт</h2>
          <p className="mt-2 text-sm text-gray-600">Присоединяйтесь к нашей CRM системе</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Полное имя</label>
              <input name="fullName" type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Иван Иванов" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input name="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="mail@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Номер телефона</label>
              <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="mail@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Название центра</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="mail@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
              <input type="password" name="adminKey" value={formData.adminKey} onChange={(e) => setFormData({...formData, adminKey: e.target.value})} required className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all">
            Создать центр
          </button>
        </form>
      </div>
    </div>
  );
};
