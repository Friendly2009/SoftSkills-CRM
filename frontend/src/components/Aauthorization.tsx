import { useState } from "react";
import login from './cssmoduls/login.module.css'
import { useNavigate } from 'react-router-dom';
import React from "react";
import { IdebugProps } from "@/interfaces/debugInterface";

export const LoginForm: React.FC<IdebugProps> = ({ isdebug }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: '',
    login: '',
    password: ''
  });

  const backbtnOnClick = () => {
    navigate("/index");
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let response: Response;
    try {
      if (isdebug) {
        const debugResponse = await fetch(`${import.meta.env.VITE_HOST}/signin`, {
          credentials: "include",
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        response = debugResponse;
      } else {
        const releaseResponse = await fetch(`${import.meta.env.VITE_HOST}/signin`, {
          credentials: "include",
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        response = releaseResponse;
      }

      if (!response.ok) {
        let serverErrorText = "";
        try {
          const rawText = await response.text();
          try {
            const errData = JSON.parse(rawText);
            serverErrorText = JSON.stringify(errData);
          } catch {
            serverErrorText = rawText;
          }
        } catch (readError) {
          serverErrorText = "Не удалось прочитать текст ошибки с сервера";
        }
        console.error(`Сервер вернул статус: ${response.status} (${response.statusText})`);
        console.error(`Сообщение от сервера: ${serverErrorText}`);
        throw new Error(`Не авторизован. Статус: ${response.status}`);
      }

      const data = await response.json();
      console.log('Успешный вход:' + JSON.stringify(data));

      // ИСПРАВЛЕНО: Если бэкенд прислал sessionId, бережно сохраняем его в память браузера
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
      }

      navigate('/dashboard');

    } catch (ex) {
      console.error(ex);
    }
  };


  const handleSupportClick = async () => {
    navigate('/support');
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
              value={formData.company}
              onChange={(e) => { setFormData({ ...formData, company: e.target.value }) }}
              placeholder="Введите название компании..."
              className={login.input}
              required
            />
          </div>

          <div className={login['input-group']}>
            <label htmlFor="email" className={login.label}>Эл. почта</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.login}
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
              value={formData.password}
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
