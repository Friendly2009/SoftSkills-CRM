import React from 'react';
import styles from "@/components/cssmoduls/DashboardComponentsCssModuls/lessonModal.module.css";
interface LessonModalWindowProps {
    lessonId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const LessonModalWindow: React.FC<LessonModalWindowProps> = ({ lessonId, onClose }) => {
    return (
        <div className={styles['modal-overlay']} onClick={onClose}>
            <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>

                {/* Хедер панели */}
                <div className={styles.header}>
                    <div className={styles['header-left']}>
                        <span className={styles['status-badge-planned']}>
                            Запланирован (Шаблон)
                        </span>
                        <h3 className={styles['group-name']}>TypeScript по пятницам (старшая)</h3>
                    </div>
                    <button onClick={onClose} className={styles['btn-close']}>&times;</button>
                </div>

                {/* Сетка параметров времени и даты */}
                <div className={styles['meta-grid']}>
                    <div className={styles['meta-card']}>
                        <span className={styles['meta-label']}>Дата проведения урока</span>
                        <div className={styles['meta-value']}>27.07.2026</div>
                    </div>
                    <div className={styles['meta-card']}>
                        <span className={styles['meta-label']}>Временной интервал занятия</span>
                        <div className={styles['meta-value']}>15:00 — 16:30</div>
                    </div>
                </div>

                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className={styles['scroll-content']}>

                        <div>
                            <h4 className={styles['section-title']}>Ответственный преподаватель</h4>
                            <div className={styles['teacher-card']}>
                                <div className={styles['teacher-select-wrapper']}>
                                    <select value="1" className={styles['teacher-select']}>
                                        <option value="1">Иван Иванов (Основной преподаватель)</option>
                                        <option value="2">Петр Петров</option>
                                    </select>
                                </div>
                                <div className={styles['teacher-pay-wrapper']}>
                                    <div className={styles['teacher-pay-input-group']}>
                                        <input type="number" value="1500" readOnly className={styles['teacher-pay-input']} />
                                        <span className={styles['price-symbol']}>₽</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className={styles['section-title']}>Студенты и фиксация посещаемости</h4>
                            <div className={styles['students-list']}>

                                {/* Ученик 1: Статус "Был" (Выделен темным) */}
                                <div className={styles['student-card']}>
                                    <div>
                                        <div className={styles['student-name']}>Aлексей Смирнов</div>
                                        <div className={styles['student-balance']}>
                                            Баланс: <span className={styles['balance-positive']}>+2 500 ₽</span>
                                        </div>
                                    </div>
                                    <div className={styles['enum-group']}>
                                        <button type="button" className={`${styles['enum-btn']} ${styles['enum-btn-present']}`}>Был</button>
                                        <button type="button" className={styles['enum-btn']}>Прогул</button>
                                        <button type="button" className={styles['enum-btn']}>Уважительная</button>
                                    </div>
                                    <div className={styles['price-container']}>
                                        <input type="number" value="500" readOnly className={styles['price-input']} />
                                        <span className={styles['price-symbol']}>₽</span>
                                    </div>
                                </div>

                                <div className={styles['student-card']}>
                                    <div>
                                        <div className={styles['student-name']}>Мария Козлова</div>
                                        <div className={styles['student-balance']}>
                                            Баланс: <span className={styles['balance-negative']}>-150 ₽</span>
                                        </div>
                                    </div>
                                    <div className={styles['enum-group']}>
                                        <button type="button" className={styles['enum-btn']}>Был</button>
                                        <button type="button" className={`${styles['enum-btn']} ${styles['enum-btn-absent']}`}>Прогул</button>
                                        <button type="button" className={styles['enum-btn']}>Уважительная</button>
                                    </div>
                                    <div className={styles['price-container']}>
                                        <input type="number" value="500" readOnly className={styles['price-input']} />
                                        <span className={styles['price-symbol']}>₽</span>
                                    </div>
                                </div>

                                <div className={styles['student-card']}>
                                    <div>
                                        <div className={styles['student-name']}>Дмитрий Морозов</div>
                                        <div className={styles['student-balance']}>
                                            Баланс: <span style={{ fontWeight: 500, color: '#334155' }}>0 ₽</span>
                                        </div>
                                    </div>
                                    <div className={styles['enum-group']}>
                                        <button type="button" className={styles['enum-btn']}>Был</button>
                                        <button type="button" className={styles['enum-btn']}>Прогул</button>
                                        <button type="button" className={`${styles['enum-btn']} ${styles['enum-btn-excused']}`}>Уважительная</button>
                                    </div>
                                    <div className={styles['price-container']}>
                                        <input type="number" value="0" readOnly className={`${styles['price-input']} ${styles['price-input-disabled']}`} />
                                        <span className={styles['price-symbol']}>₽</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles['btn-cancel']}>
                            Отмена
                        </button>
                        <button type="button" className={styles['btn-submit']}>
                            Провести урок и зафиксировать данные
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};