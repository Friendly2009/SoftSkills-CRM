import style from './cssmoduls/index.module.css';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className={style['page-wrapper']}>
      <header className={style['main-header']}>
        <div className={style['container']}>
          <div className={style['header-inner']}>
            <a href="/" className={style['header-logo']}>
              <img src="/img/index/brand-logo-2024.webp" alt="alfacrm" />
            </a>
            <nav className={style['header-nav']}>
              <a href="#" className={style['header-nav-link']}>Новости</a>
              <a href="#" className={style['header-nav-link']}>Тарифы</a>
              <a href="#" className={style['header-nav-link']}>База знаний</a>
              <a href="#" className={style['header-nav-link']}>Контакты</a>
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
                    <img src="/img/index/benefits/benefit-3-1024.png" alt="" />
                  </div>
                  <p>Система лояльности и накопление баллов</p>
                </div>
                <div className={style['feature-item']}>
                  <div className={style['icon-wrapper']}>
                    <img src="/img/index/benefits/benefit-4-1024.png" alt="" />
                  </div>
                  <p>Мобильное приложение ученика</p>
                </div>
                <div className={style['feature-item']}>
                  <div className={style['icon-wrapper']}>
                    <img src="/img/index/benefits/benefit-5-1024.png" alt="" />
                  </div>
                  <p>Простая настройка и бесплатная поддержка</p>
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
      </main>

      <footer className={style['footer']}>
        <div className={style['container']}>
          <div className={style['footer-top']}>
            <div className={style['footer-brand']}>
              <img src="/img/index/alfacrm-bw-2024.svg" alt="AlfaCRM" className={style['footer-logo-img']} />
              <p className={style['footer-desc']}>SoftSkills CRM — CRM система для учебного центра.</p>
            </div>
            <div className={style['footer-links-group']}>
              <nav className={style['footer-nav']}>
                <h4>Навигация</h4>
                <a href="#">Главная</a>
                <a href="#">Тарифы</a>
                <a href="#">База знаний</a>
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
