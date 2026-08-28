import style from './cssmoduls/index.module.css';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className={style['page-wrapper']}>
      {/* Шапка */}
      <header className={style['main-header']}>
        <div className={style['container']}>
          <div className={style['header-inner']}>
            <a href="/" className={style['header-logo']}>
              <img src="/img/user/dashboard/logo.png" alt="softskillscrm" style={{ width: 40, height: 40 }} />
            </a>
            <nav className={style['header-nav']}>
              <a href="#features" className={style['header-nav-link']}>Возможности</a>
              <a href="#pricing" className={style['header-nav-link']}>Тарифы</a>
              <a href="#faq" className={style['header-nav-link']}>Вопросы</a>
            </nav>
            <div className={style['header-actions']}>
              <button className={style['header-sec-btn']} type="button" onClick={() => navigate('/authorization')}>Войти</button>
              <button className={style['header-main-btn']} type="button" onClick={() => navigate('/registration')}>Создать компанию</button>
            </div>
          </div>
        </div>
      </header>

      {/* Главный контент */}
      <main className={style['main']}>
        {/* Hero Секция */}
        <section className={style['hero']}>
          <div className={style['container']}>
            <div className={style['hero-content']}>
              <h1 className={style['hero-title']}>
                Повышайте свою прибыль <br />
                <span>в учебных центрах</span>
              </h1>

              <div className={style['hero-features']}>
                <div className={style['feature-item']}>
                  <div className={style['icon-wrapper']}>
                    <img src="/img/index/benefits/benefit-1-1024.png" alt="" />
                  </div>
                  <p>Аналитика и контроль за сотрудниками</p>
                </div>
                <div className={style['feature-item']}>
                  <div className={style['icon-wrapper']}>
                    <img src="/img/index/benefits/benefit-2-1024.png" alt="" />
                  </div>
                  <p>Удобное начисление зарплат педагогам</p>
                </div>
                <div className={style['feature-item']}>
                  <div className={style['icon-wrapper']}>
                    <img src="/img/index/benefits/benefit-6-1024.png" alt="" />
                  </div>
                  <p>Онлайн оплата по QR коду</p>
                </div>
              </div>

              <div className={style['hero-btns']}>
                <button className={style['hero-cta-btn']} onClick={() => navigate('/authorization')}>Начать бесплатно</button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={style['features-details']}>
          <div className={style['container']}>
            <h2 className={style['section-title']}>Всё, что нужно для управления учебным центром</h2>
            <div className={style['details-grid']}>
              <div className={style['detail-card']}>
                <h3>Аналитика финансов</h3>
                <p>Наблюдайте за деньгами в системе. Красивые графики и листы с отчетами</p>
              </div>
              <div className={style['detail-card']}>
                <h3>Учет посещаемости</h3>
                <p>Отмечайте присутствующих в один клик. Автоматическое списание занятий с абонементов учеников.</p>
              </div>
              <div className={style['detail-card']}>
                <h3>CRM и база клиентов</h3>
                <p>Ведущая история общения с родителями и учениками. Напоминания об оплатах и днях рождения.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className={style['pricing-section']}>
          <div className={style['container']}>
            <h2 className={style['section-title']}>Гибкие тарифы под ваш масштаб</h2>
            <div className={style['pricing-grid']}>
              <div className={style['price-card']}>
                <div className={style['price-level']}>Старт</div>
                <div className={style['price-value']}> 0₽</div>
                <p>Пробный период - 14 дней</p>
                <button className={style['price-btn']} onClick={() => navigate('/registration')}>Выбрать Старт</button>
              </div>
              <div className={style['price-card']}>
                <div className={style['price-level']}>Старт</div>
                <div className={style['price-value']}> 1 999₽<span>/ мес</span></div>
                <p>Помесячный тариф</p>
                <button className={style['price-btn']} onClick={() => navigate('/registration')}>Выбрать Старт</button>
              </div>
              <div className={`${style['price-card']} ${style['price-card-popular']}`}>
                <div className={style['badge-popular']}>Популярный</div>
                <div className={style['price-level']}>Профессиональный</div>
                <div className={style['price-value']}>9 999 ₽<span>/ 12 мес</span></div>
                <p>Погодовой тариф</p>
                <button className={style['price-btn-primary']} onClick={() => navigate('/registration')}>Выбрать Старт</button>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className={style['faq-section']}>
          <div className={style['container']}>
            <h2 className={style['section-title']}>Часто задаваемые вопросы</h2>
            <div className={style['faq-list']}>
              <div className={style['faq-item']}>
                <h4>Как долго длится тестовый период?</h4>
                <p>Вы получаете полный доступ ко всем функциям системы на 14 дней абсолютно бесплатно после регистрации.</p>
              </div>
              <div className={style['faq-item']}>
                <h4>Нужно ли устанавливать программу на компьютер?</h4>
                <p>Нет, SoftSkills CRM — это облачный сервис. Вы можете работать с любого устройства, где есть интернет.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={style['footer']}>
        <div className={style['container']}>
          <div className={style['footer-top']}>
            <div className={style['footer-brand']}>
              <img src="/img/user/dashboard/logo.png" alt="softskillscrm" className={style['footer-logo-img']} style={{ width: 40, height: 40 }} />
              <p className={style['footer-desc']}>SoftSkills CRM — CRM система для учебного центра.</p>
            </div>
            <div className={style['footer-links-group']}>
              <nav className={style['footer-nav']}>
                <h4>Навигация</h4>
                <a href="#">Главная</a>
                <a href="#pricing">Тарифы</a>
                <a href="#">Поддержка</a>
                <a href="#">Контакты</a>
              </nav>
              <nav className={style['footer-nav']}>
                <h4>Документы</h4>
                <a href="#">Договор-оферта</a>
                <a href="#">Политика cookie</a>
                <a href="#">Конфиденциальность</a>
                <a href="#">Юридическая информация</a>
              </nav>
            </div>
          </div>
          <div className={style['footer-bottom']}>
            <p className={style['footer-copy']}>© 2026, ООО «Soft Skills»</p>
            <div className={style['footer-socials']}>
              <a href="#"><img src="/img/index/vk.svg" alt="VK" /></a>
              <a href="#"><img src="/img/index/tg.svg" alt="TG" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
