import React, { useState } from "react";
import register from './CssModuls/signup.module.css'
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
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setPage('dashboard');
      }
    } catch (ex) {
      console.log(ex);
    }
  }
  const backbtnOnClick = () => {
    setPage('index');
  }
  return (
    <div className={register['page-wrapper']}>
      <div className={register['register-card']}>

        <button onClick={backbtnOnClick} className={register['back-btn']}>
          <img src="/img/user/dashboard/angle-left-solid.png" className={register['back-icon']} alt="exit" />
        </button>

        <div className={register['register-header']}>
          <h2 className={register.title}>Создать аккаунт</h2>
          <p className={register.subtitle}>Присоединяйтесь к нашей CRM системе</p>
        </div>

        <form className={register.form} onSubmit={handleSubmit}>
          <div className={register['inputs-container']}>

            <div className={register['input-group']}>
              <label className={register.label}>Полное имя</label>
              <input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className={register.input}
                placeholder="Иван Иванов"
              />
            </div>

            <div className={register['input-group']}>
              <label className={register.label}>Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={register.input}
                placeholder="mail@example.com"
              />
            </div>

            <div className={register['input-group']}>
              <label className={register.label}>Номер телефона</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className={register.input}
                placeholder="+7 (999) 999-99-99" /* Исправлено */
              />
            </div>

            <div className={register['input-group']}>
              <label className={register.label}>Название центра</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className={register.input}
                placeholder="Название вашей компании" /* Исправлено */
              />
            </div>

            <div className={register['input-group']}>
              <label className={register.label}>Пароль</label>
              <input
                type="password"
                name="adminKey"
                value={formData.adminKey}
                onChange={(e) => setFormData({ ...formData, adminKey: e.target.value })}
                required
                className={register.input}
                placeholder="••••••••"
              />
            </div>

          </div>

          <button type="submit" className={register['submit-btn']}>
            Создать центр
          </button>
        </form>
      </div>
    </div>

  );
};
