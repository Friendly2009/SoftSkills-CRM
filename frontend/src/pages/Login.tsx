import { useAuth } from "@/app/AuthProvider";
import { errorMessage, jsonBody, request } from "@/shared/api/client";
import login from "@/shared/styles/login.module.css";
import { Alert } from "@/shared/ui/Alert";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: "",
    login: "",
    password: "",
  });

  const backbtnOnClick = () => {
    navigate("/");
  };

  const { refresh } = useAuth();
  const location = useLocation();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await request("/signin", { method: "POST", ...jsonBody(formData) });
      await refresh();
      const from = location.state?.from;
      navigate(
        typeof from === "string" &&
          from.startsWith("/") &&
          !from.startsWith("//")
          ? from
          : "/dashboard",
        { replace: true },
      );
    } catch (ex) {
      setError(errorMessage(ex));
    } finally {
      setPending(false);
    }
  };

  const handleSupportClick = async () => {
    navigate("/support");
  };

  return (
    <div className={login["page-wrapper"]}>
      <div className={login["login-card"]}>
        <button onClick={backbtnOnClick} className={login["back-btn"]}>
          <img
            src="/img/user/dashboard/angle-left-solid.png"
            className={login["back-icon"]}
            alt="exit"
          />
        </button>
        <h2 className={login.title}>Авторизация в систему</h2>

        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleFormSubmit}>
          <div className={login["input-group"]}>
            <label htmlFor="name" className={login.label}>
              Название компании
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.company}
              onChange={(e) => {
                setFormData({ ...formData, company: e.target.value });
              }}
              placeholder="Введите название компании..."
              className={login.input}
              required
            />
          </div>

          <div className={login["input-group"]}>
            <label htmlFor="email" className={login.label}>
              Эл. почта
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.login}
              onChange={(e) => {
                setFormData({ ...formData, login: e.target.value });
              }}
              placeholder="Введите Эл. почту"
              className={login.input}
              required
            />
          </div>

          <div className={login["input-group"]}>
            <label htmlFor="key" className={login.label}>
              Лицензионный ключ
            </label>
            <input
              type="password"
              id="key"
              name="key"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
              }}
              placeholder="••••••••"
              className={login.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className={login["submit-btn"]}
          >
            {pending ? "Вход…" : "Войти"}
          </button>
        </form>

        <div className={login["support-block"]}>
          <p className={login["forgot-text"]}>Забыли ключ?</p>
          <p className={login["info-text"]}>
            Обратитесь к администрации компании или
            <button
              type="button"
              className={login["support-link"]}
              onClick={handleSupportClick}
            >
              {" "}
              Напишите в поддержку
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
