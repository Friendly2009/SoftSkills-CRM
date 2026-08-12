import React, { useEffect, useState } from 'react';
import style from './cssmoduls/dashboard.module.css';
import { UsersTable } from './DashboardsComponents/UsersTable.tsx';
import { ClientTable } from './DashboardsComponents/ClientsTable.tsx';
import { GroupTable } from './DashboardsComponents/GroupsTable.tsx'
import { Analytic } from './DashboardsComponents/Analytics.tsx'
import { ScheduleTable } from './DashboardsComponents/SheduleTable.tsx';
import { Expenses } from './DashboardsComponents/Finance.tsx';
interface UserProfile {
  fullname: string;
  email: string;
}

export const Dashboard: React.FC = () => {

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>('analytics');

  const GetGlobalInfo = async () => {
    try {
      const response = await fetch("http://localhost:3000/getglobalinfo", {
        credentials: "include"
      });

      if (!response.ok) throw new Error("something went wrong");

      const result = await response.json();

      if (result.success && result.data) {
        setProfile(result.data);
      }
    } catch (ex) {
      console.error(ex);
    }
  };

  useEffect(() => {
    GetGlobalInfo();
  }, []);
  return (
    <>
      <header className={style['alfa-header']}>
        <div className={style['header-left']}>
          <button className={style['burger-menu']} id="burger-button">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={style.logo}>
            <img src="/img/index/brand-logo-2024.webp" alt="SoftSkills CRM" />
          </div>
        </div>
        <div className={style['header-center']}>
          {/* ... 
        
          <div className={`${style['dropdown-menu']} ${isPlusOpen ? style.active : ''}`}>
            COMING SOON
            <div className={style['menu-item']}>
              <img src="/img/user/dashboard/list-check-solid.png" alt="" className={style['nav-icon']} />
              Задача
            </div>
            <div className={style['menu-item']}>
              <img src="/img/user/dashboard/user-plus-solid.png" alt="" className={style['nav-icon']} />
              Лид
            </div>
            <div className={style['menu-item']}>
              <img src="/img/user/dashboard/user-solid.png" alt="" className={style['nav-icon']} />
              Клиент
            </div>
            <div className={style['menu-item']}>
              <img src="/img/user/dashboard/user-group-solid.png" alt="" className={style['nav-icon']} />
              Группа
            </div>
            <hr className={style.hr} />
            <div className={style['menu-item']}>
              <img src="/img/user/dashboard/money-bill-trend-up-solid.png" alt="" className={style['nav-icon']} />
              Доход
            </div>
          </div>
          <div
            className={style['icon-box']}
            id="plusBtn"
            onClick={() => setIsPlusOpen(!isPlusOpen)}
          >
            <img src="/img/user/dashboard/plus-solid.png" alt="" className={style['nav-icon']} />
          </div>

          <div className={style['icon-box']}><img src="/img/user/dashboard/wrench-solid.png" alt="" className={style['nav-icon']} /></div>
          <div className={style['icon-box']}><img src="/img/user/dashboard/envelope-solid.png" alt="" className={style['nav-icon']} /></div>
          <div className={style['icon-box']}><img src="/img/user/dashboard/mobile-solid.png" alt="" className={style['nav-icon']} /></div>
          <div className={style['icon-box']}><img src="/img/user/dashboard/telegram-brands-solid.png" alt="" className={style['nav-icon']} /></div>
          <div className={style['icon-box']}><img src="/img/user/dashboard/cart-shopping-solid.png" alt="" className={style['nav-icon']} /></div>
          <div className={style['icon-box']}><img src="/img/user/dashboard/bell-regular.png" alt="" className={style['nav-icon']} /></div>

          <div className={style['search-container']}>
            <input type="text" placeholder="Поиск клиента" />
          </div>
          */}
        </div>

        <div
          className={style['header-right']}
          onClick={() => setIsUserOpen(!isUserOpen)}
        >
          {profile ? (
            <>
              <span className={style['user-name']} id="name_info">{profile.fullname}</span>
              <div className={style['user-avatar']}>
                <img src="/img/user/dashboard/empty-male.png" alt="" />
              </div>

              <div className={`${style['user-menu-dropdown']} ${isUserOpen ? style.active : ''}`}>
                <div className={style['dropdown-info']}>
                  <p className={style['dropdown-name']}>{profile.fullname}</p>
                  <p className={style['dropdown-email']}>{profile.email}</p>
                </div>
                <hr className={style.hr} />
                <ul className={style['dropdown-links']}>
                  <li><a href="/profile">Мой профиль</a></li>
                  <li><a href="/settings">Настройки</a></li>
                  <li><a href="/logout" className={style['logout-link']}>Выйти</a></li>
                </ul>
              </div>
            </>
          ) : (
            <div className={style['loading']}>Загрузка...</div>
          )}
        </div>
      </header>
      <main className={style['alfa-container']}>
        <aside className={style.sidebar} id="burger-menu">
          <nav className={style['sidebar-nav']}>
            <div
              className={`${style['nav-item']} ${activeMenu === 'analytics' ? style['nav-item-active'] : ''}`}
              onClick={() => setActiveMenu('analytics')}
            >
              <img src="/img/user/dashboard/chart-line-solid.png" alt="" className={style['nav-icon']} />
              <span>Аналитика</span>
            </div>
            <div
              className={`${style['nav-item']} ${activeMenu === 'groups' ? style['nav-item-active'] : ''}`}
              onClick={() => setActiveMenu('groups')}
            >
              <img src="/img/user/dashboard/user-group-solid.png" alt="" className={style['nav-icon']} />
              <span>Группы</span>
            </div>
            <div
              className={`${style['nav-item']} ${activeMenu === 'clients' ? style['nav-item-active'] : ''}`}
              onClick={() => setActiveMenu('clients')}
            >
              <img src="/img/user/dashboard/user-solid.png" alt="" className={style['nav-icon']} />
              <span>Клиенты</span>
            </div>
            <div
              className={`${style['nav-item']} ${activeMenu === 'users' ? style['nav-item-active'] : ''}`}
              onClick={() => setActiveMenu('users')}
            >
              <img src="/img/user/dashboard/chalkboard-user-solid.png" alt="" className={style['nav-icon']} />
              <span>Сотрудники</span>
            </div>
            <div
              className={`${style['nav-item']} ${activeMenu === 'shedule' ? style['nav-item-active'] : ''}`}
              onClick={() => setActiveMenu('shedule')}
            >
              <img src="/img/user/dashboard/calendar-regular.png" alt="" className={style['nav-icon']} />
              <span>Расписание</span>
            </div>
            <div
              className={`${style['nav-item']} ${activeMenu === 'finance' ? style['nav-item-active'] : ''}`}
              onClick={() => setActiveMenu('finance')}
            >
              <img src="/img/user/dashboard/coins-solid.png" alt="" className={style['nav-icon']} />
              <span>Финансы</span>
            </div>
          </nav>
        </aside>

        <section className={style['main-content']}>
          <div className={style['dashboard-placeholder']}>
            <div className={style['placeholder-content']} id="placeholder-content">
              {activeMenu === 'analytics' && <Analytic></Analytic>}
              {activeMenu === 'users' && <UsersTable></UsersTable>}
              {activeMenu === 'clients' && <ClientTable></ClientTable>}
              {activeMenu === 'groups' && <GroupTable></GroupTable>}
              {activeMenu === 'shedule' && <ScheduleTable></ScheduleTable>}
              {activeMenu === 'finance' && <Expenses></Expenses>}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};