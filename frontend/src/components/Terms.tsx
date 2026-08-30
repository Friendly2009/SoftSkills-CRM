import { useNavigate } from "react-router-dom";
import register from '@/components/cssmoduls/Signup.module.css'
import { Footer } from "./Footer";
export const TermsOfService: React.FC = () => {
    const navigate = useNavigate();
    return (
        <>
            <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-800 antialiased font-sans">
                <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 sm:p-10 border border-slate-200">
                    <button className={register['back-btn']} onClick={() => navigate('/')} style={{ position: "fixed" }}><img src="/img/user/dashboard/angle-left-solid.png" className={register['back-icon']} alt="exit" /></button>
                    <header className="border-b border-slate-200 pb-6 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase">
                            Пользовательское соглашение
                        </h1>
                        <p className="text-md font-medium text-indigo-600 mt-1">
                            Публичная оферта об использовании бета-версии сервиса «softskills crm»
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Дата последнего обновления: 30 августа 2026 года
                        </p>
                    </header>

                    <div className="mb-6 p-4 bg-indigo-50/50 rounded-lg text-sm sm:text-base border border-indigo-100 text-indigo-950">
                        Настоящее Пользовательское соглашение (далее — Соглашение) представляет собой официальное предложение (публичную оферту) физического лица <strong>Цыганова Кирилла Евгеньевича</strong> (далее — Лицензиар) и определяет условия использования веб-приложения «softskills crm» (далее — Сервис) юридическими лицами, индивидуальными предпринимателями или физическими лицами (далее — Пользователи). Регистрация в Сервисе означает полное и безоговорочное принятие (акцепт) условий настоящего Соглашения.
                    </div>

                    <div className="space-y-8 text-base leading-relaxed">

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                1. Термины и определения
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.1.</span>
                                    <span><strong>Сервис</strong> — веб-приложение «softskills crm», доступное в сети Интернет, представляющее собой программный комплекс для автоматизации процессов в образовательных организациях.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.2.</span>
                                    <span><strong>Лицензиар</strong> — физическое лицо Цыганов Кирилл Евгеньевич, являющийся правообладателем Сервиса.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.3.</span>
                                    <span><strong>Пользователь</strong> — представитель образовательной организации (администратор, руководитель, сотрудник), прошедший процедуру регистрации в Сервисе.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">1.4.</span>
                                    <span><strong>Бета-версия</strong> — тестовая версия Сервиса, выпускаемая с целью выявления ошибок, тестирования функционала и сбора обратной связи, которая может содержать недоработки.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                2. Предмет соглашения и порядок использования
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">2.1.</span>
                                    <span>Лицензиар предоставляет Пользователю безвозмездное, неисключительное право использования (простую неисключительную лицензию) бета-версии Сервиса в рамках его доступного функционала.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">2.2.</span>
                                    <span>Использование Сервиса на этапе бета-тестирования осуществляется на бесплатной основе. Лицензиар оставляет за собой право вводить платные тарифные планы и изменять стоимость доступа после завершения этапа бета-тестирования, заблаговременно уведомив об этом Пользователей.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">2.3.</span>
                                    <span>Пользователь самостоятельно несет ответственность за безопасность созданной учетной записи (логин и пароль), а также за любые действия, совершенные в Сервисе под его учетной записью.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                3. Особености использования бета-версии
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">3.1.</span>
                                    <span>Пользователь признает и соглашается с тем, что Сервис находится на стадии тестирования. Функционал Сервиса может изменяться, дополняться или удаляться Лицензиаром в одностороннем порядке без предварительного уведомления.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">3.2.</span>
                                    <span>Лицензиар не гарантирует непрерывную, безошибочную и бесперебойную работу Сервиса, а также полную сохранность данных на этапе бета-тестирования.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">3.3.</span>
                                    <span>Пользователь обязуется по мере возможности сообщать Лицензиару об обнаруженных ошибках (багах) и сбоях в работе системы через каналы технической поддержки.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                4. Ограничение ответственности
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">4.1.</span>
                                    <span>Сервис предоставляется Пользователю на условиях <strong className="text-red-600">«КАК ЕСТЬ» («AS IS»)</strong>. Лицензиар не предоставляет никаких гарантий в отношении коммерческой применимости Сервиса, его соответствия конкретным ожиданиям или целям Пользователя.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">4.2.</span>
                                    <span>Лицензиар не несет ответственности за любые прямые или косвенные убытки, упущенную выгоду, потерю данных, приостановку коммерческой деятельности образовательных организаций или иные финансовые потери Пользователя, возникшие в связи с использованием или невозможностью использования Сервиса.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">4.3.</span>
                                    <span>Максимальный размер ответственности Лицензиара по любым претензиям Пользователя ограничен суммой в 0 (ноль) рублей, если иное не предусмотрено применимым законодательством РФ.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                5. Права на интеллектуальную собственность
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">5.1.</span>
                                    <span>Все объекты, доступные в Сервисе, включая элементы дизайна, текст, графические изображения, иллюстрации, скрипты, программы, базы данных, исходный код и архитектура программного обеспечения, являются объектами исключительных прав Лицензиара.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">5.2.</span>
                                    <span>Пользователю запрещается осуществлять декомпиляцию, реверс-инжиниринг (обратную разработку) кода, копировать интерфейс Сервиса или создавать производные продукты на его основе.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                6. Связь с Политикой конфиденциальности
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">6.1.</span>
                                    <span>Обработка персональных данных Пользователей и вносимых ими данных третьих лиц регулируется Политикой конфиденциальности Сервиса, размещенной в общем доступе.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]"></span>
                                    Регистрируясь в Сервисе, Пользователь гарантирует, что имеет все необходимые законные основания и поручения (включая согласия законных представителей несовершеннолетних) для внесения данных своих сотрудников и учеников в Сервис.
                                </li>
                            </ul>
                        </section>
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                                7. Срок действия и изменение соглашения
                            </h2>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">7.1.</span>
                                    <span>Настоящее Соглашение вступает в силу с момента акцепта Пользователем и действует на протяжении всего периода использования Сервиса Пользователем либо до момента закрытия этапа бета-тестирования Лицензиаром.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">7.2.</span>
                                    <span>Лицензиар имеет право в любое время в одностороннем порядке изменить условия настоящего Соглашения. Новая редакция вступает в силу с момента ее публикации в Сервисе.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold text-slate-950 mr-2 min-w-[28px]">7.3.</span>
                                    <span>Если Пользователь не согласен с изменениями, он обязан прекратить использование Сервиса и удалить свою учетную запись.</span>
                                </li>
                            </ul>
                        </section>
                        <section className="bg-slate-100 rounded-lg p-5 border border-slate-200 mt-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide">
                                8. Реквизиты Лицензиара
                            </h2>
                            <div className="space-y-1 text-sm sm:text-base text-slate-700">
                                <p><strong>Лицензиар:</strong> Цыганов Кирилл Евгеньевич</p>
                                <div className="pt-2">
                                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                                        Контактный E-mail для связи:
                                    </p>
                                    <a
                                        href="mailto:kirill.tsyganov@internet.ru"
                                        className="text-base sm:text-lg font-bold text-indigo-600 hover:text-indigo-500 transition-colors break-all"
                                    >
                                        kirill.tsyganov@internet.ru
                                    </a>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}