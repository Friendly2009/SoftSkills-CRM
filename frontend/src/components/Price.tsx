import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PriceCard } from '@/components/Prices/PriceCard';
import styles from '@/components/cssmoduls/Pricing.module.css';
import style from '@/components/cssmoduls/index.module.css'
export const PricingSection = () => {
    const navigate = useNavigate();
    const tariffsData = [
        {
            level: 'Пробный период',
            price: '0 ₽',
            period: '',
            description: 'Доступ на 14 дней',
            features: ['Весь функционал MVP', 'До 300 активных учеников', 'Помощь с переносом базы'],
            buttonText: 'Попробовать бесплатно',
            isPopular: false,
            onSelect: () => { navigate('/tarid-details/trial') }
        },
        {
            level: 'Базовый месяц',
            price: '1 999 ₽',
            period: '/ мес',
            description: 'Гибкая оплата без обязательств',
            features: ['Базовый функционал CRM', 'До 300 активных учеников', 'Техподдержка в чате'],
            buttonText: 'Выбрать Базовый',
            isPopular: false,
            onSelect: () => { navigate('/tarid-details/base-month') }
        },
        {
            level: 'Прайм месяц',
            price: '3 499 ₽',
            period: '/ мес',
            description: 'Для растущих учебных центров',
            features: ['Продвинутый функционал', 'Безлимит по ученикам', 'Интеграция со смарт-сервисами'],
            buttonText: 'Выбрать Прайм',
            isPopular: false,
            onSelect: () => { navigate('/tarid-details/prime-month') }
        },
        {
            level: 'Базовый год',
            price: '14 990 ₽',
            period: '/ год',
            description: 'Экономия при оплате за год',
            features: ['Базовый функционал CRM', 'До 300 активных учеников', 'Приоритетная поддержка'],
            buttonText: 'Купить Базовый год',
            isPopular: false,
            onSelect: () => { navigate('/tarid-details/base-year') }
        },
        {
            level: 'Прайм год',
            price: '24 990 ₽',
            period: '/ год',
            description: 'Максимальные возможности и выгода',
            features: ['Полный функционал CRM', 'Безлимит по ученикам', 'Персональный менеджер'],
            buttonText: 'Купить Прайм год',
            isPopular: true,
            badgeText: 'Выгода ~40%',
            onSelect: () => { navigate('/tarid-details/prime-year') }
        }
    ];

    return (
        <div className={style['page-font']}>
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
                    </div>
                </div>
            </header>
            <div className={styles['pricing-wrapper']}>
                <div className={styles['pricing-header']}>
                    <span className={styles['pricing-label']}>Тарифы</span>
                    <h2>Выберите идеальный формат для вашей школы</h2>
                </div>

                <div className={styles['pricing-grid']}>
                    {tariffsData.map((tariff, index) => (
                        <PriceCard
                            key={index}
                            level={tariff.level}
                            price={tariff.price}
                            period={tariff.period}
                            description={tariff.description}
                            features={tariff.features}
                            buttonText={tariff.buttonText}
                            isPopular={tariff.isPopular}
                            badgeText={tariff.badgeText}
                            onSelect={() => tariff.onSelect()}
                        />
                    ))}
                </div>
            </div>
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
                                <a>Договор-оферта</a>
                                <a>Политика cookie</a>
                                <a>Конфиденциальность</a>
                                <a>Юридическая информация</a>
                            </nav>
                        </div>
                    </div>
                    <div className={style['footer-bottom']}>
                        <p className={style['footer-copy']}>© 2026, ООО «Soft Skills»</p>
                        <div className={style['footer-socials']}>
                            <a><img src="/img/index/vk.svg" alt="VK" /></a>
                            <a><img src="/img/index/tg.svg" alt="TG" /></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
