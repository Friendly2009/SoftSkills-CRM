import { useState } from "react";
import login from './cssmoduls/login.module.css'
export const LoginForm = ({ setPage }: { setPage: (page: 'registration' | 'authorization' | "dashboard" | "index") => void }) => {

  const [formData, setFormData] = useState({
    company: '',
    login: '',
    password: ''
  });
  const backbtnOnClick = () => {
    setPage("index");
  }
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/signin', {
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

      alert('Успешный вход:' + data);

      setPage('dashboard');
    } catch (ex) {

      alert(ex);
    }
  }

  const checkConnect = async () => {
    try {
      const response = await fetch('http://localhost:3000/checkConnect', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Ошибка сервера');

      const jsonData = await response.json();
      alert(JSON.stringify(jsonData));
    } catch (ex) {
      alert(ex);
    }
  }
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
              placeholder="••••••••"
              className={login.input}
              required
            />
          </div>

          <button type="submit" className={login['submit-btn']} onClick={checkConnect}>Войти</button>
        </form>

        <div className={login['support-block']}>
          <p className={login['forgot-text']}>Забыли ключ?</p>
          <p className={login['info-text']}>
            Обратитесь к администрации компании или
            <a href="/support" className={login['support-link']}> Напишите в поддержку</a>
          </p>
        </div>
      </div>
    </div>
  );
};
