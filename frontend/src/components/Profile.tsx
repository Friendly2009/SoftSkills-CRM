import React, { useEffect, useState } from 'react';
import styles from './cssmoduls/profile.module.css';

export const ProfilePage: React.FC = () => {
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Изменили тип birthday на Date | null в стейте пользователя
  const [user, setUser] = useState({
    fullname: "",
    email: "",
    user_role: "",
    rank: 0,
    contact: "",
    gender: "Муж",
    birthday: null as Date | null,
    password: '',
    avatar: '',
    company_name: ''
  });

  // Изменили тип birthday на Date | null в стейте формы
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    user_role: "",
    rank: 0,
    contact: "",
    gender: "Муж",
    birthday: null as Date | null,
    password: ''
  });

  const getInitials = (name: string) => {
    if (!name) return "?";
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
      }
    } catch (er) {
      alert("something went wrong and you was not logout...");
    }
  };

  const handleDashboardClick = () => {
    window.location.href = 'http://localhost:5173/dashboard';
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // Если меняется дата, записываем её как объект Date или null
      [name]: name === 'rank'
        ? Number(value)
        : name === 'birthday'
          ? (value ? new Date(value) : null)
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const updateData = {
      full_name: formData.fullname,
      email: formData.email,
      contact: formData.contact,
      rank: formData.rank,
      // Сериализуем объект даты обратно в строку YYYY-MM-DD для отправки на бэкенд
      birthday: formData.birthday ? formData.birthday.toISOString().split('T')[0] : null,
      gender: formData.gender,
      password: formData.password,
      role: formData.user_role
    };

    try {
      const response = await fetch("http://localhost:3000/resetuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Ошибка при обновлении данных на сервере");
      }

      const data = await response.json();

      if (data.success) {
        alert("Данные успешно сохранены!");

        setUser(prev => ({
          ...prev,
          fullname: formData.fullname,
          email: formData.email,
          contact: formData.contact,
          rank: formData.rank,
          birthday: formData.birthday,
          gender: formData.gender,
        }));

        setIsUpdateMode(false);
      } else {
        alert(data.message || "Не удалось обновить данные");
      }
    } catch (error) {
      console.error("Ошибка запроса:", error);
      alert("Произошла ошибка при отправке данных. Попробуйте позже.");
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/getcurrentuser", {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Не удалось загрузить пользователя");
        }

        const data = await response.json();

        if (data.success && data.user) {
          const fetchedUser = data.user;
          // Парсим полученную строку даты в полноценный объект Date
          const birthdayDate = fetchedUser.birthday ? new Date(fetchedUser.birthday) : null;

          setUser({
            fullname: fetchedUser.fullname || "",
            email: fetchedUser.email || "",
            user_role: fetchedUser.user_role || "",
            rank: fetchedUser.rank || 0,
            contact: fetchedUser.contact || "",
            gender: fetchedUser.gender || "Муж",
            birthday: birthdayDate,
            password: "",
            avatar: fetchedUser.avatar || "",
            company_name: fetchedUser.company_name || ""
          });

          setFormData({
            fullname: fetchedUser.fullname || "",
            email: fetchedUser.email || "",
            user_role: fetchedUser.user_role || "",
            rank: fetchedUser.rank || 0,
            contact: fetchedUser.contact || "",
            gender: fetchedUser.gender || "Муж",
            birthday: birthdayDate,
            password: ""
          });
        }
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };

    fetchCurrentUser();
  }, []);
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
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials(user.fullname)}
              </div>
            )}
          </div>

          <div className={styles.mainInfo}>
            <h1 className={styles.fullname}>{user.fullname}</h1>
            <div className={styles.badgeRow}>
              <span className={styles.roleBadge}>{user.user_role}</span>
              <span className={styles.companyBadge}>{user.company_name}</span>
            </div>
          </div>
        </section>

        <section className={styles.actionButtons}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleDashboardClick}
          >
            Панель управления
          </button>
          <button
            className={`${styles.btn} ${isUpdateMode ? styles.btngray : styles.btnlightblue}`}
            onClick={() => setIsUpdateMode(!isUpdateMode)}
          >
            {isUpdateMode ? 'Отмена' : 'Редактировать'}
          </button>

          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => console.log('Настройки')}
          >
            Настройки
          </button>
        </section>

        {!isUpdateMode && (
          <section className={styles.detailsGrid}>
            <h2 className={styles.sectionTitle}>Личная информация</h2>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              <span className={styles.infoValue}>{user.contact || 'Не указан'}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Ранг доступа</span>
              <span className={styles.infoValue}>{user.rank} Pts</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата рождения</span>
              <span className={styles.infoValue}>
                {user.birthday ? new Date(user.birthday).toLocaleDateString('ru-RU') : 'Не указана'}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Пол</span>
              <span className={styles.infoValue}>{user.gender || 'Не указан'}</span>
            </div>
          </section>
        )}
        {isUpdateMode && (
          <form className={styles.detailsGrid} onSubmit={handleSubmit}>
            <h2 className={styles.sectionTitle}>Редактируйте информацию</h2>

            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Полное имя</label>
              <input
                type='text'
                name='fullname'
                className={styles.formInput}
                value={formData.fullname}
                onChange={handleOnChange}
              />
            </div>

            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Email адрес</label>
              <input
                type='email'
                name='email'
                className={styles.formInput}
                value={formData.email}
                onChange={handleOnChange}
              />
            </div>

            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Контакты</label>
              <input
                type='text'
                name='contact'
                className={styles.formInput}
                placeholder="Не указан"
                value={formData.contact}
                onChange={handleOnChange}
              />
            </div>

            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Очки (Pts)</label>
              <input
                type='number'
                name='rank'
                className={styles.formInput}
                value={formData.rank}
                onChange={handleOnChange}
              />
            </div>

            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Дата рождения</label>
              <input
                type='date'
                name='birthday'
                className={styles.formInput}
                value={formData.birthday ? formData.birthday.toISOString().split('T')[0] : ""}
                onChange={handleOnChange}
              />
            </div>


            <div className={styles.infoRow}>
              <label className={styles.infoLabel}>Пол</label>
              <select
                name="gender"
                className={styles.formSelect}
                value={formData.gender}
                onChange={handleOnChange}
              >
                <option value="Муж">Мужской</option>
                <option value="Жен">Женский</option>
              </select>
            </div>

            <div className={styles.infoRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <label className={styles.infoLabel}>Новый пароль</label>
              <input
                type='password'
                name='password'
                className={styles.formInput}
                placeholder="Оставьте пустым, если не хотите менять"
                value={formData.password}
                onChange={handleOnChange}
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                Сохранить изменения
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

