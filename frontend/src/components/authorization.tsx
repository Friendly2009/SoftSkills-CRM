import { useState } from "react";
import login from './cssmoduls/login.module.css'
export const LoginForm = ({ setPage }: { setPage: (page: 'registration' | 'authorization' | "dashboard" | "index") => void }) => {

  const [formData, setFormData] = useState({
    company: '',
    login: '',
    password: ''
  });
  const backbtnOnClick = async () => {
    try {
      const response = await fetch('http://localhost:3000/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      alert('Успешный вход:' + data);
      setPage('dashboard');
    } catch (ex) {
      alert(ex);
    }
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

  return (
    <div className={login['login-card']}>
      <button onClick={backbtnOnClick}>
        click me blyat
      </button>
      <h2>Авторизация в систему</h2>

      <form onSubmit={handleFormSubmit}>
        <div className={login['input-group']}>
          <label htmlFor="name">Название компании</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Введите название компании..."
            required
          />
        </div>

        <div className={login['input-group']}>
          <label htmlFor="key">Лицензионный ключ</label>
          <input
            type="password"
            id="key"
            name="key"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit">Войти</button>
      </form>
      <p>Забыли ключ?</p>
      <p>
        Обратитесь к администрации компании или
        <a href="/support" className={login['support-link']}
        > Напишите в поддержку</a>
      </p>
    </div>
  );
};
