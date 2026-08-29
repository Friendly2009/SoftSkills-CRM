import { useNavigate, useParams } from 'react-router-dom';
import styles from '@/components/cssmoduls/PricingPage.module.css';
import style from '@/components/cssmoduls/index.module.css'
import { useState } from 'react';
interface TariffDetails {
    name: string;
    price: string;
    period: string;
    summary: string;
    features: string[];
}
const TARIFFS_DATABASE: Record<string, TariffDetails> = {
    'trial': {
        name: 'Пробный',
        price: '0 ₽',
        period: '14 дней',
        summary: 'Идеально чтобы разобраться в приобретении',
        features: ['До 100 активных учеников', 'Техподдержка в чате'],
    },
    'base-month': {
        name: 'Базовый месяц',
        price: '1 999 ₽',
        period: 'месяц',
        summary: 'Идеально для стабильного учета в одном учебном центре.',
        features: ['До 300 активных учеников', 'Техподдержка в чате'],
    },
    'prime-month': {
        name: 'Прайм месяц',
        price: '3 499 ₽',
        period: 'месяц',
        summary: 'Для растущих школ, которым нужен максимум возможностей.',
        features: ['Безлимит по ученикам', 'Интеграция со смарт-сервисами'],
    },
    'base-year': {
        name: 'Базовый год',
        price: '14 990 ₽',
        period: 'год',
        summary: 'Экономичный пакет для долгосрочного планирования.',
        features: ['До 300 активных учеников', 'Приоритетная поддержка', 'Выгода при оплате за год'],
    },
    'prime-year': {
        name: 'Прайм год',
        price: '24 990 ₽',
        period: 'год',
        summary: 'Максимальный безлимит для крупных сетей и франшиз.',
        features: ['Безлимит по ученикам', 'Персональный менеджер'],
    }
};
export const PricePage = () => {
    const { tariffId } = useParams<{ tariffId: string }>();
    const navigate = useNavigate();

    const currentTariff = TARIFFS_DATABASE[tariffId!];

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreeTerms) {
            alert('Пожалуйста, примите условия оферты');
            return;
        }
        console.log('Отправка на оплату:', { email, phone, schoolName, tariff: currentTariff.name });
        alert(`Перенаправление на шлюз оплаты для тарифа "${currentTariff.name}"`);
    };

    return (
        <>
            <div className={styles['checkout-container']}>
                <header className={styles['checkout-header']}>
                    <button className={styles['back-btn']} onClick={() => navigate(-1)}>
                        ← Назад к тарифам
                    </button>
                    <h1>Оформление подписки</h1>
                    <p className={styles['subtitle']}>Вы переходите на безопасную страницу оплаты лицензии CRM</p>
                </header>

                <div className={styles['checkout-layout']}>
                    <main className={styles['checkout-main']}>
                        <section className={styles['card-section']}>
                            <h2 className={styles['section-title']}>1. Данные вашей организации</h2>
                            <form onSubmit={handleSubmit} className={styles['checkout-form']}>
                                <div className={styles['form-group']}>
                                    <label htmlFor="schoolName">Название учебного центра *</label>
                                    <input
                                        type="text"
                                        id="schoolName"
                                        placeholder="Например: Языковая школа 'Слово'"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles['form-row']}>
                                    <div className={styles['form-group']}>
                                        <label htmlFor="email">Email для закрывающих документов *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="director@school.ru"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles['form-group']}>
                                        <label htmlFor="phone">Контактный телефон *</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            placeholder="+7 (999) 999-99-99"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles['checkbox-group']}>
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <label htmlFor="terms">
                                        Я согласен с условиями <a href="/terms" target="_blank" rel="noreferrer">Публичной оферты</a> и <a href="/privacy" target="_blank" rel="noreferrer">Политикой конфиденциальности</a>.
                                    </label>
                                </div>

                                <button type="submit" className={styles['submit-pay-btn']}>
                                    Оплатить {currentTariff.price}
                                </button>
                            </form>
                        </section>

                        <section className={styles['security-banner']}>
                            <div className={styles['security-icon']}>🛡️</div>
                            <div>
                                <h3>Безопасность платежей гарантирована</h3>
                                <p>Все транзакции шифруются по протоколу SSL. Мы не сохраняем данные ваших банковских карт. Оплата проходит через сертифицированный платежный шлюз.</p>
                            </div>
                        </section>

                        <section className={styles['faq-section']}>
                            <h2 className={styles['section-title']}>Частые вопросы по подписке</h2>
                            <div className={styles['faq-item']}>
                                <h4>Можно ли изменить тариф в процессе использования?</h4>
                                <p>Да, вы можете перейти на тариф выше или ниже в любой момент в личном кабинете. Остаток средств автоматически пересчитается.</p>
                            </div>
                            <div className={styles['faq-item']}>
                                <h4>Предоставляете ли вы закрывающие документы?</h4>
                                <p>Конечно. Мы работаем официально. После оплаты на ваш Email придет чек, а в ЛК будут доступны акты для бухгалтерии (для Юр. лиц).</p>
                            </div>
                            <div className={styles['faq-item']}>
                                <h4>Что произойдет, если лимит учеников будет превышен?</h4>
                                <p>Система не заблокируется внезапно. Мы отправим вам уведомление и предложим плавно перейти на расширенный пакет («Прайм»).</p>
                            </div>
                        </section>
                    </main>

                    <aside className={styles['checkout-sidebar']}>
                        <div className={styles['order-summary-card']}>
                            <h3 className={styles['summary-title']}>Ваш заказ</h3>

                            <div className={styles['tariff-badge-info']}>
                                <span className={styles['tariff-name']}>{currentTariff.name}</span>
                                <span className={styles['tariff-price-tag']}>{currentTariff.price}</span>
                            </div>

                            <p className={styles['tariff-descr']}>{currentTariff.summary}</p>

                            <hr className={styles['divider']} />

                            <h4 className={styles['include-title']}>Что включено в тариф:</h4>
                            <ul className={styles['summary-features']}>
                                {currentTariff.features.map((feat, idx) => (
                                    <li key={idx}>✓ {feat}</li>
                                ))}
                            </ul>

                            <hr className={styles['divider']} />

                            <div className={styles['total-row']}>
                                <span>Итого к оплате:</span>
                                <span className={styles['total-price']}>{currentTariff.price}</span>
                            </div>
                            <p className={styles['billing-period-text']}>Период действия лицензии: 1 {currentTariff.period}</p>
                        </div>

                        <div className={styles['support-card']}>
                            <h4>Нужна помощь с оплатой?</h4>
                            <p>Если у вас возникли проблемы с транзакцией или вам нужен счет для юрлица, свяжитесь с нами напрямую:</p>
                            <a href="mailto:support@yourcrm.ru" className={styles['support-link']}>support@yourcrm.ru</a>
                            <p className={styles['support-phone']}>8 (800) 555-35-35</p>
                        </div>
                    </aside>
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
        </>
    );
};
