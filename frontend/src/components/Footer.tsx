import style from '@/components/cssmoduls/index.module.css'
import { useNavigate } from 'react-router-dom'
export const Footer = () => {
    const navigate = useNavigate();
    return (
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
                            <a onClick={() => navigate('/')}>Главная</a>
                            <a onClick={() => navigate('/price')}>Тарифы</a>
                            <a onClick={() => navigate('/support')}>Поддержка</a>
                            <a onClick={() => navigate('/contact')}>Контакты</a>
                        </nav>
                        <nav className={style['footer-nav']}>
                            <h4>Документы</h4>
                            <a onClick={() => navigate('/terms')}>Договор-оферта</a>
                            <a onClick={() => navigate('/privacy#cookie')}>Политика cookie</a>
                            <a onClick={() => navigate('/privacy')}>Конфиденциальность</a>
                        </nav>
                    </div>
                </div>
                <div className={style['footer-bottom']}>
                    <p className={style['footer-copy']}>© 2026, ООО «Soft Skills»</p>
                    <div className={style['footer-socials']}>
                        <a><img src="/img/index/tg.svg" alt="TG" /></a>
                    </div>
                </div>
            </div>
        </footer>
    )
}