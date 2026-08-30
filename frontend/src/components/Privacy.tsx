import { useNavigate } from "react-router-dom";
import register from '@/components/cssmoduls/Signup.module.css'
export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 antialiased">
            <button className={register['back-btn']} onClick={() => navigate('/')}><img src="/img/user/dashboard/angle-left-solid.png" className={register['back-icon']} alt="exit" /></button>
            <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 sm:p-10 border border-slate-200">

                <header className="border-b border-slate-200 pb-6 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
                        Политика конфиденциальности
                    </h1>
                    <p className="text-md font-medium text-indigo-600 mt-1">
                        Сервис «softskills crm» (Бета-версия)
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                        Дата последнего обновления: 29 августа 2026 года
                    </p>
                </header>

                <div className="space-y-8 text-base leading-relaxed">
                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            1. Общие положения
                        </h2>
                        <ul className="space-y-2 list-none pl-0">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.1.</span>
                                <span>Настоящая Политика конфиденциальности (далее — Политика) разработана в соответствии с Федеральным законом РФ от 27.07.2006 г. № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые Администрацией сервиса — физическим лицом <strong className="text-slate-950">Цыгановым Кириллом Евгеньевичем</strong> (далее — Оператор), в отношении пользователей веб-приложения softskills crm (далее — Сервис).</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.2.</span>
                                <span>Оператор ставит важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.3.</span>
                                <span>Настоящая Политика применяется ко всей информации, которую Сервис может получить о посетителях и пользователях (администраторах, сотрудниках образовательных организаций, клиентах, потенциальных клиентах).</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.4.</span>
                                <span>Использование Сервиса означает <strong className="text-indigo-600">безоговорочное согласие</strong> пользователя с настоящей Политикой и указанными в ней условиями обработки его персональных данных.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            2. Категории обрабатываемых персональных данных
                        </h2>
                        <p className="mb-4 text-slate-600 italic">
                            Оператор обрабатывает только те персональные данные, которые непосредственно вносятся пользователями в интерфейс Сервиса:
                        </p>

                        <div className="space-y-4 pl-4 border-l border-slate-200">
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1">2.1. Данные сотрудников и преподавателей:</h3>
                                <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-700">
                                    <li>Фамилия, имя, отчество;</li>
                                    <li>Адрес электронной почты;</li>
                                    <li>Дата рождения;</li>
                                    <li>Контактные данные (номер телефона);</li>
                                    <li>Пол;</li>
                                    <li>Сведения о роли и ранге пользователя в системе;</li>
                                    <li>Фотография профиля (аватар).</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1">2.2. Данные учеников и клиентов:</h3>
                                <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-700">
                                    <li>Имя или Фамилия, имя, отчество;</li>
                                    <li>Контактные данные (номер телефона);</li>
                                    <li>Фотография профиля (аватар);</li>
                                    <li>Сведения о навыках.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1">2.3. Данные потенциальных клиентов (лидов):</h3>
                                <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-700">
                                    <li>Имя;</li>
                                    <li>Контактные данные (номер телефона);</li>
                                    <li>Источник обращения и описание ситуации, предоставленное пользователем.</li>
                                </ul>
                            </div>
                        </div>

                        <ul className="space-y-2 list-none pl-0 mt-4">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">2.4.</span>
                                <span><strong className="text-slate-900">Внутренние системные и аналитические данные:</strong> Сведения о посещаемости занятий, расписании, статусах лидов, а также о виртуальном балансе и внутренних учетных операциях. Сервис не собирает данные банковских карт и не осуществляет обработку реальных платежей.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">2.5.</span>
                                <span><strong className="text-slate-900">Обезличенные технические данные:</strong> Сервис может автоматически собирать стандартные технические данные (файлы cookie, IP-адреса, тип браузера, операционная система) для обеспечения корректной пользовательской сессии и защиты бета-версии Сервиса от сетевых атак.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            3. Обработка данных несовершеннолетних
                        </h2>
                        <ul className="space-y-2 list-none pl-0">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">3.1.</span>
                                <span>Данные несовершеннолетних лиц вносятся в Сервис исключительно сотрудниками образовательных организаций, имеющими соответствующие права доступа.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">3.2.</span>
                                <span>Сами несовершеннолетние пользователи не имеют доступа к интерфейсу Сервиса, не могут самостоятельно осуществлять регистрацию, просматривать или изменять свои данные.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">3.3.</span>
                                <span>Образовательная организация, использующая Сервис, выступает в качестве самостоятельного оператора персональных данных детей и <strong className="text-indigo-600">гарантирует наличие письменного согласия</strong> родителей или иных законных представителей на обработку персональных данных и их передачу Оператору Сервиса.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            4. Цели обработки персональных данных
                        </h2>
                        <p className="mb-2 text-slate-600 italic">Персональные данные пользователей обрабатываются строго в следующих целях:</p>
                        <ul className="space-y-2 list-none pl-0">
                            <li className="flex items-start"><span className="font-semibold text-indigo-500 mr-2 min-w-[28px]">4.1.</span><span>Регистрация компаний и создание учетных записей сотрудников для организации работы CRM-системы.</span></li>
                            <li className="flex items-start"><span className="font-semibold text-indigo-500 mr-2 min-w-[28px]">4.2.</span><span>Ведение учета учебных групп, планирование расписания занятий и фиксация посещаемости учеников.</span></li>
                            <li className="flex items-start"><span className="font-semibold text-indigo-500 mr-2 min-w-[28px]">4.3.</span><span>Внутренний учет условного баланса, начислений за проведение занятий и аналитики образовательных организаций без проведения реальных платежных транзакций через Сервис.</span></li>
                            <li className="flex items-start"><span className="font-semibold text-indigo-500 mr-2 min-w-[28px]">4.4.</span><span>Обработка входящих заявок (лидов) и улучшение качества работы образовательных организаций.</span></li>
                            <li className="flex items-start"><span className="font-semibold text-indigo-500 mr-2 min-w-[28px]">4.4.</span><span>Обеспечение технической поддержки пользователей, выявление и устранение багов в работе бета-версии Сервиса.</span></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            5. Правовые основания обработки персональных данных
                        </h2>
                        <ul className="space-y-2 list-none pl-0">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">5.1.</span>
                                Согласие пользователя на обработку его персональных данных, выражаемое путем акцепта (принятия) условий настоящей Политики при регистрации и заполнении веб-форм в Сервисе.
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">5.2.</span>
                                Договоры, соглашения или поручения на обработку персональных данных, заключаемые между Оператором и образовательными организациями (клиентами Сервиса) в целях предоставления доступа к функционалу CRM-системы.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            6. УСЛОВИЯ ЛОКАЛИЗАЦИИ, ХРАНЕНИЯ И БЕЗОПАСНОСТИ
                        </h2>
                        <ul className="space-y-2 list-none pl-0">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">6.1.</span>
                                В соответствии с требованиями ч. 5 ст. 18 Закона № 152-ФЗ, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение персональных данных граждан Российской Федерации осуществляются строго с использованием баз данных, находящихся на территории Российской Федерации.
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">6.2.</span>
                                Сервис шифрует критически важные данные, включая пароли пользователей (password_hash), с использованием современных криптографических алгоритмов.
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">6.3.</span>
                                Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                            7. СРОКИ ОБРАБОТКИ И УНИЧТОЖЕНИЯ ДАННЫХ
                        </h2>
                        <ul className="space-y-2 list-none pl-0">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">7.1.</span>
                                Обработка персональных данных осуществляется на протяжении всего периода использования Сервиса пользователем или образовательной организацией, а также в течение сроков, предусмотренных законодательством Российской Федерации.
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">7.2.</span>
                                Условием прекращения обработки персональных данных является достижение целей их обработки, удаление учетной записи пользователя, прекращение действия договора с образовательной организацией, а также отзыв согласия на обработку персональных данных.
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">7.3.</span>
                                В случае отзыва пользователем согласия на обработку его персональных данных или поступления требования об их уничтожении, Оператор прекращает обработку и уничтожает данные в срок, не превышающий 10 (десяти) рабочих дней с даты получения указанного отзыва/требования, если иное не предусмотрено законодательством РФ.
                            </li>
                        </ul>
                    </section>

                    <section className="bg-slate-100 rounded-lg p-5 border border-slate-200 mt-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide">
                            8. Права пользователей и контактная информация
                        </h2>
                        <ul className="space-y-2 list-none pl-0 mb-4 text-sm sm:text-base">
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2">8.1.</span>
                                <span>Пользователи имеют право на получение информации, касающейся обработки их персональных данных, а также на их уточнение, блокирование или уничтожение в случае, если данные являются неполными или устаревшими.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold text-slate-950 mr-2">8.2.</span>
                                <span>Направление запросов, отзыв согласия на обработку данных или уведомления о неточностях в персональных данных осуществляются пользователем путем направления электронного письма Оператору.</span>
                            </li>
                        </ul>

                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                                Email для связи с Администрацией:
                            </p>
                            <a
                                href="mailto:kirill.tsyganov@internet.ru"
                                className="text-base sm:text-lg font-bold text-indigo-600 hover:text-indigo-500 transition-colors break-all"
                            >
                                kirill.tsyganov@internet.ru
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
};