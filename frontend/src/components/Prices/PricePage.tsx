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
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice'>('card');
    const [inn, setInn] = useState('');
    const currentTariff = TARIFFS_DATABASE[tariffId!];

    const [formData, setFormData] = useState({
        company: '',
        fullname: '',
        email: '',
        contact: '',
        password: ''
    });
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreeTerms) {
            alert('Требуется соглашение с политикой конфиленциальности и публичной оферты');
            return;
        }
        try {
            const response = await fetch(`${process.env.HOST}:${process.env.PORT}/signup`, {
                credentials: "include",
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                navigate('/dashboard');
            }
        } catch (ex) {
            console.log(ex);
        }
    }

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
                            <form onSubmit={handleSubmit} className={styles['checkout-form']}>

                                <div className={styles['form-group']}>
                                    <label htmlFor="centerName">Имя центра</label>
                                    <input
                                        type="text"
                                        id="centerName"
                                        placeholder="AnyCompany"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="fullName">ФИО</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        placeholder="Иван Иванов Иванович"
                                        value={formData.fullname}
                                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="email">Эл. почта</label>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="mail@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="phone">Номер телефона</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        placeholder="+71234567890"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="password">Пароль</label>
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                {currentTariff.price !== '0 ₽' && (
                                    <div className={styles['payment-method-section']}>
                                        <label className={styles['method-label']}>Способ оплаты</label>
                                        <div className={styles['method-selector']}>
                                            <label className={`${styles['method-option']} ${paymentMethod === 'card' ? styles['active-method'] : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={paymentMethod === 'card'}
                                                    onChange={() => setPaymentMethod('card')}
                                                />
                                                <span>Онлайн-оплата (Карта, СБП)</span>
                                            </label>

                                            <label className={`${styles['method-option']} ${paymentMethod === 'invoice' ? styles['active-method'] : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={paymentMethod === 'invoice'}
                                                    onChange={() => setPaymentMethod('invoice')}
                                                />
                                                <span>Счет для юрлиц (ИП / ООО)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                                {currentTariff.price !== '0 ₽' && paymentMethod === 'invoice' && (
                                    <div className={styles['form-group']}>
                                        <label htmlFor="inn">ИНН организации *</label>
                                        <input
                                            type="text"
                                            id="inn"
                                            placeholder="10-значный ИНН для ИП или 12-значный для ООО"
                                            value={inn}
                                            onChange={(e) => setInn(e.target.value)}
                                            required={paymentMethod === 'invoice'}
                                        />
                                    </div>
                                )}
                                <p className={styles['tariff-notice-text']}>
                                    Вы выбрали {currentTariff.name}, для смены тарифа перейдите в {' '}
                                    <span className={styles['link-span']} onClick={() => navigate('/pricing')}>
                                        тарифы
                                    </span>
                                </p>
                                <div className={styles['checkbox-group']}>
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <label htmlFor="terms">
                                        Я согласен с условиями <a href="/terms" target="_blank">Публичной оферты</a>
                                    </label>
                                </div>
                                <button type="submit" className={styles['submit-pay-btn']}>
                                    {currentTariff.price === '0 ₽'
                                        ? 'Создать центр бесплатно'
                                        : paymentMethod === 'card'
                                            ? `Перейти к оплате ${currentTariff.price}`
                                            : 'Сгенерировать счет и создать центр'
                                    }
                                </button>
                            </form>
                        </section>

                        <section className={styles['security-banner']}>
                            <div className={styles['security-icon']}>🛡️</div>
                            <div>
                                <h3>Ваши данные под защитой</h3>
                                <p>Мы используем современные протоколы шифрования. Ваши персональные данные и учебные базы защищены в соответствии с ФЗ-152.</p>
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
                                <a onClick={() => navigate('/privacy')}>Конфиденциальность</a>
                                <a>Юридическая информация</a>
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
        </>
    );
};
