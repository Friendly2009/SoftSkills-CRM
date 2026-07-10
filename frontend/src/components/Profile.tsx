import React from 'react';
import styles from './cssmoduls/profile.module.css';
import { error } from 'console';
import { resumeToPipeableStream } from 'react-dom/server';

const mockUser = {
  fullname: "Иван Иванов Иванович",
  email: "mail@gmail.com",
  user_role: "Директор",
  rank: 1000,
  company_name: "AnyCompany",
  contact: "+7 919 019 78 84",
  gender: "Муж",
  birthday: "1995-05-12",
  avatar: null
};

export const ProfilePage: React.FC = () => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  };
  const handleLogoutClick = async () => {
  try {
    const response = await fetch("http://localhost:3000/logout");
    if (!response.ok) {
      throw new Error("something went wrong...");
    }
    const data = await response.json();
    
    if (data.success) {
      window.location.href = "http://localhost:5173/"; 
    } else {
      console.log("something went wrong and you was not logout...");
    }
  } catch (er) {
    console.log("something went wrong and you was not logout...");
    alert("something went wrong and you was not logout...");
  }
};

  return (
    <div className={styles.pageContainer}>
      <main className={styles.profileCard}>
        
        <button 
          className={styles.logoutBtn} 
          onClick={handleLogoutClick}
          title="Выйти из аккаунта"
        >
          Выйти
        </button>
        
        <section className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            {mockUser.avatar ? (
              <img src={mockUser.avatar} alt="Avatar" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials(mockUser.fullname)}
              </div>
            )}
          </div>
          
          <div className={styles.mainInfo}>
            <h1 className={styles.fullname}>{mockUser.fullname}</h1>
            <div className={styles.badgeRow}>
              <span className={styles.roleBadge}>{mockUser.user_role}</span>
              <span className={styles.companyBadge}>{mockUser.company_name}</span>
            </div>
          </div>
        </section>

        <section className={styles.actionButtons}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => console.log('В дашборд')}
          >
            Панель управления
          </button>
          <button 
            className={`${styles.btn} ${styles.btnlightblue}`}
            onClick={() => console.log('Редактировать')}
          >
            Редактировать
          </button>
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => console.log('Настройки')}
          >
            Настройки
          </button>
        </section>

        <section className={styles.detailsGrid}>
          <h2 className={styles.sectionTitle}>Личная информация</h2>
          
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{mockUser.email}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Телефон</span>
            <span className={styles.infoValue}>{mockUser.contact || 'Не указан'}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Ранг доступа</span>
            <span className={styles.infoValue}>{mockUser.rank} Pts</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Дата рождения</span>
            <span className={styles.infoValue}>
              {mockUser.birthday ? new Date(mockUser.birthday).toLocaleDateString('ru-RU') : 'Не указана'}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Пол</span>
            <span className={styles.infoValue}>{mockUser.gender || 'Не указан'}</span>
          </div>
        </section>

      </main>
    </div>
  );
};
