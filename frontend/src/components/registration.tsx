import React, { useState } from "react";
import register from './CssModuls/signup.module.css'
import { useNavigate } from 'react-router-dom';

export const RegisterForm = () => {
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
    alert("Подайте заявку на бета тестирование, написав в поддержке https://t.me/SoftSkillsCrmSupportbot");
    return;
    //IN FEATURE
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
  }
  const backbtnOnClick = () => {
    navigate('/index');
  }
  return (
    <>
      <div className={register['page-wrapper']}>
        <div className={register['register-card']}>

          <button onClick={backbtnOnClick} className={register['back-btn']}>
            <img src="/img/user/dashboard/angle-left-solid.png" className={register['back-icon']} alt="exit" />
          </button>

          <div className={register['register-header']}>
            <h2 className={register.title}>Создать центр</h2>
            <p className={register.subtitle}>Присоединяйтесь к нашей CRM системе</p>
          </div>
          <p>Подайте заявку на бета тестирование, написав в поддержку https://t.me/SoftSkillsCrmSupportbot</p>
          {/*<form className={register.form} onSubmit={handleSubmit}>
            <div className={register['inputs-container']}>

              <div className={register['input-group']}>
                <label className={register.label}>Имя центра</label>
                <input
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  className={register.input}
                  placeholder="AnyCompany"
                />
              </div>

              <div className={register['input-group']}>
                <label className={register.label}>ФИО</label>
                <input
                  name="fullname"
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  required
                  className={register.input}
                  placeholder="Иван Иванов Иванович"
                />
              </div>

              <div className={register['input-group']}>
                <label className={register.label}>Эл. почта</label>
                <input
                  type="email"
                  name="email"
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
                  name="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  required
                  className={register.input}
                  placeholder="+71234567890"
                />
              </div>

              <div className={register['input-group']}>
                <label className={register.label}>Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={register.input}
                  placeholder="••••••••"
                />
              </div>

            </div>
            <div className={register.subtitle}>
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{margin: 10}}
              />
              <label htmlFor="terms">
                Я согласен с условиями <a href="/terms" target="_blank" rel="noreferrer">Публичной оферты</a> и <a href="/privacy" target="_blank" rel="noreferrer">Политикой конфиденциальности</a>.
              </label>
            </div>
            <button type="submit" className={register['submit-btn']}>
              Создать центр
            </button>
          </form>*/}
        </div>
      </div>
    </>
  );
};
