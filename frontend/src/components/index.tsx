import style from './cssmoduls/index.module.css';
import { useNavigate } from 'react-router-dom';
import { Footer } from './Footer';

const Index = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className={style['page-wrapper']}>
        <header className={style['main-header']}>
          <div className={style['container']}>
            <div className={style['header-inner']}>
              <a href="/" className={style['header-logo']}>
                <img src="/img/user/dashboard/logo.png" alt="softskillscrm" style={{ width: 40, height: 40 }} />
              </a>
              <nav className={style['header-nav']}>
                <a className={style['header-nav-link']} onClick={() => navigate('/')}>Главная</a>
                <a className={style['header-nav-link']} onClick={() => navigate('/price')}>Тарифы</a>
                <a className={style['header-nav-link']} onClick={() => navigate('/support')}>Поддержка</a>
                <a className={style['header-nav-link']} onClick={() => navigate('/contact')}>Контакты</a>
              </nav>
              <div className={style['header-actions']}>
                <button className={style['header-sec-btn']} type="button" onClick={() => navigate('/authorization')}>Войти</button>
                <button className={style['header-main-btn']} type="button" onClick={() => navigate('/registration')}>Создать компанию</button>
              </div>
            </div>
          </div>
        </header>

        <main className={style['main']}>
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
              <div className={style['pricing-wrapper']}>
                <div className={style['pricing-header']}>
                  <span className={style['pricing-label']}>Тарифы</span>
                </div>

                <div className={style['pricing-grid']}>
                  <div className={style['price-card']}>
                    <div className={style['price-level']}>Пробный период</div>
                    <div className={style['price-value']}>0 ₽</div>
                    <p className={style['price-period']}>Доступ на 14 дней</p>
                    <ul className={style['price-features']}>
                      <li>Весь функционал</li>
                      <li>До 300 активных учеников</li>
                      <li>Помощь с переносом базы</li>
                    </ul>
                    <button className={style['price-btn']} onClick={() => navigate('/registration')}>
                      Попробовать бесплатно
                    </button>
                  </div>

                  <div className={style['price-card']}>
                    <div className={style['price-level']}>Базовый месяц</div>
                    <div className={style['price-value']}>1 999 ₽<span> / мес</span></div>
                    <p className={style['price-period']}>Гибкая оплата без обязательств</p>
                    <ul className={style['price-features']}>
                      <li>Весь функционал</li>
                      <li>До 300 active учеников</li>
                      <li>Техподдержка в чате</li>
                    </ul>
                    <button className={style['price-btn']} onClick={() => navigate('/price-base-month')}>
                      Выбрать Базовый
                    </button>
                  </div>

                  <div className={`${style['price-card']} ${style['price-card-popular']}`}>
                    <div className={style['badge-popular']}>Выгода ~60%</div>
                    <div className={style['price-level']}>Годовой безлимит</div>
                    <div className={style['price-value']}>9 999 ₽<span> / год</span></div>
                    <p className={style['price-period']}>Всего 833 ₽ в месяц</p>
                    <ul className={style['price-features']}>
                      <li>Весь функционал</li>
                      <li><strong>Безлимит</strong> по ученикам</li>
                      <li>Приоритетная поддержка</li>
                    </ul>
                    <button className={style['price-btn-primary']} onClick={() => navigate('/price-year-prime')}>
                      Купить на год
                    </button>
                  </div>
                </div>

                <div className={style['pricing-footer']}>
                  <button className={style['price-more-btn']} onClick={() => navigate('/price')}>
                    Подробнее о тарифах здесь
                  </button>
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
      </div>
      <Footer />
    </>
  );
};

export default Index;
