## For starting backend
```
npx tsx server.ts
```
## For starting frontend
```
npm run dev
```
Before starting you need enter in directory (frontend or backend) with command ``` cd ```

## new form
```
<form onSubmit={handleFormSubmit}>
  {/* 1. Инпут компании */}
  <div className={login['input-group']}>
    <label htmlFor="companyName" className={login.label}>Название компании</label>
    <input
      type="text"
      id="companyName"
      name="companyName"
      placeholder="Введите название компании..."
      className={login.input}
      required
    />
  </div>

  {/* 2. Инпут Email (уникальный логин сотрудника) */}
  <div className={login['input-group']}>
    <label htmlFor="email" className={login.label}>Рабочий Email</label>
    <input
      type="email"
      id="email"
      name="email"
      placeholder="ivan@company.com"
      className={login.input}
      required
    />
  </div>

  {/* 3. Инпут Пароля */}
  <div className={login['input-group']}>
    <label htmlFor="password" className={login.label}>Пароль</label>
    <input
      type="password"
      id="password"
      name="password"
      placeholder="••••••••"
      className={login.input}
      required
    />
  </div>

  <button type="submit" className={login['submit-btn']}>Войти в систему</button>
</form>
```