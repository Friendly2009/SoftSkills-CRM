import { useState } from "react";
import login from './cssmoduls/login.module.css'
import { useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: 'AnyCompany',
    login: 'mail@example.com',
    password: '19614141_Kirill'
  });
  const backbtnOnClick = () => {
    navigate("/index");
  }
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/signin', {
        credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Ошибка авторизации');
      }

      const data = await response.json();

      console.log('Успешный вход:' + JSON.stringify(data));

      navigate('/dashboard');
    } catch (ex) {

      console.error(ex);
    }
  };
  const SUPPORT_CREDENTIALS = {
    company: "AnyCompany",
    login: "gmail@gmail.com", 
    password: "19614141_Kirill"
  };
  const handleSupportClick = async () => {
    try {
      const response = await fetch('http://localhost:3000/signin', {
        credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(SUPPORT_CREDENTIALS),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      console.log('Успешный вход:' + JSON.stringify(data));

      navigate('/dashboard');
    } catch (ex) {
      alert(ex);
      console.error(ex);
    }
  };
  return (
    <div className={login['page-wrapper']}>
      <div className={login['login-card']}>
        <button onClick={backbtnOnClick} className={login['back-btn']}>
          <img src="/img/user/dashboard/angle-left-solid.png" className={login['back-icon']} alt="exit" />
        </button>
        <h2 className={login.title}>Авторизация в систему</h2>

        <form onSubmit={handleFormSubmit}>
          <div className={login['input-group']}>
            <label htmlFor="name" className={login.label}>Название компании</label>
            <input
              type="text"
              id="name"
              name="name"
              onChange={(e) => { setFormData({ ...formData, company: e.target.value }) }}
              placeholder="Введите название компании..."
              className={login.input}
              required
            />
          </div>

          <div className={login['input-group']}>
            <label htmlFor="email" className={login.label} ></label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={(e) => { setFormData({ ...formData, login: e.target.value }) }}
              placeholder="Введите Эл. почту"
              className={login.input}
              required
            />
          </div>

          <div className={login['input-group']}>
            <label htmlFor="key" className={login.label}>Лицензионный ключ</label>
            <input
              type="password"
              id="key"
              name="key"
              onChange={(e) => { setFormData({ ...formData, password: e.target.value }) }}
              placeholder="••••••••"
              className={login.input}
              required
            />
          </div>

          <button type="submit" className={login['submit-btn']}>Войти</button>
        </form>

        <div className={login['support-block']}>
          <p className={login['forgot-text']}>Забыли ключ?</p>
          <p className={login['info-text']}>
            Обратитесь к администрации компании или
            <a className={login['support-link']} onClick={handleSupportClick}> Напишите в поддержку</a>
          </p>
        </div>
      </div>
    </div>
  );
};
