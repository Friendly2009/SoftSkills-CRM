import { useState } from "react";
import login from './cssmoduls/login.module.css'
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
    try {

    } catch (ex) {

    }
  }

  return (
    <div className={login['login-card']}>
      <h2>Авторизация в систему</h2>

      <form action="/api/signin" method="post">
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
        > Напишите в поддержку</a
        >
      </p>
    </div>
  );
};
