import React from 'react';

const Layout = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>💜 CRM_System</div>
        <div style={styles.authButtons}>
          <button style={styles.loginBtn}>Войти</button>
          <button style={styles.registerBtn}>Регистрация</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <aside style={styles.sidebar}>
          <div style={styles.navItem}>📊 Дашборд</div>
          <div style={styles.navItem}>👥 Клиенты</div>
          <div style={styles.navItem}>⚙️ Настройки</div>
        </aside>
        
        <section style={styles.content}>
          <h1 style={{color: '#4A3AFF'}}>Добро пожаловать!</h1>
          <p>Выберите раздел в меню слева для начала работы.</p>
        </section>
      </main>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'Inter, sans-serif', backgroundColor: '#F8F7FF', minHeight: '100vh' },
  header: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '1rem 5%', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(74, 58, 255, 0.1)' 
  },
  logo: { fontSize: '1.5rem', fontWeight: 'bold', color: '#4A3AFF' },
  authButtons: { display: 'flex', gap: '10px' },
  loginBtn: { 
    background: 'none', border: '1px solid #4A3AFF', color: '#4A3AFF', 
    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' 
  },
  registerBtn: { 
    background: '#4A3AFF', border: 'none', color: '#fff', 
    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' 
  },
  main: { display: 'flex', height: 'calc(100vh - 70px)' },
  sidebar: { width: '250px', backgroundColor: '#EDE9FE', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' },
  navItem: { padding: '10px', borderRadius: '8px', cursor: 'pointer', color: '#5B4EB3', transition: '0.3s', ':hover': { backgroundColor: '#DDD6FE' } },
  content: { flex: 1, padding: '40px' }
};

export default Layout;