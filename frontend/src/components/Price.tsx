import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PriceCard } from '@/components/Prices/PriceCard';
import styles from '@/components/cssmoduls/Pricing.module.css';

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
        },
        {
            level: 'Базовый месяц',
            price: '1 999 ₽',
            period: '/ мес',
            description: 'Гибкая оплата без обязательств',
            features: ['Базовый функционал CRM', 'До 300 активных учеников', 'Техподдержка в чате'],
            buttonText: 'Выбрать Базовый',
            isPopular: false,
        },
        {
            level: 'Прайм месяц',
            price: '3 499 ₽',
            period: '/ мес',
            description: 'Для растущих учебных центров',
            features: ['Продвинутый функционал', 'Безлимит по ученикам', 'Интеграция со смарт-сервисами'],
            buttonText: 'Выбрать Прайм',
            isPopular: false,
        },
        {
            level: 'Базовый год',
            price: '14 990 ₽',
            period: '/ год',
            description: 'Экономия при оплате за год',
            features: ['Базовый функционал CRM', 'До 300 активных учеников', 'Приоритетная поддержка'],
            buttonText: 'Купить Базовый год',
            isPopular: false,
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
        }
    ];

    return (
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
                        onSelect={() => navigate('/registration')}
                    />
                ))}
            </div>

            <div className={styles['pricing-footer']}>
                <button className={styles['price-more-btn']} onClick={() => navigate('/pricing-details')}>
                    Подробнее о тарифах здесь
                </button>
            </div>
        </div>
    );
};
