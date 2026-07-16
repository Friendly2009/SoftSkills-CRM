import React, { useEffect, useState } from 'react';
import styles from '../cssmoduls/DashboardComponentsCssModuls/analytic.module.css';

interface GroupAnalytics {
    group_id: number;
    group_name: string;
    teacher_name: string | null;
    current_students: number;
    max_capacity: number;
    occupancy_rate: number;
    group_status: number;
}

export const Analytic: React.FC = () => {
    const [activeReport, setActiveReport] = useState<string>('groups'); // Переключатель отчетов (Select)
    const [viewMode, setViewMode] = useState<string>('table'); // Режим отображения: 'table' или 'chart'

    const [reportData, setReportData] = useState<GroupAnalytics[]>([]);
    const [loading, setLoading] = useState<boolean>(true);


    useEffect(() => {
        if (activeReport !== 'groups') {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch('/api/analytics/groups-occupancy')
            .then((res) => res.json())
            .then((data: GroupAnalytics[]) => {
                setReportData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Ошибка при получении аналитики:", err);
                setReportData([
                    { group_id: 5, group_name: "Data Science & AI", teacher_name: "Светлана Николаева", current_students: 0, max_capacity: 10, occupancy_rate: 0.0, group_status: 1 },
                    { group_id: 6, group_name: "new group", teacher_name: "new director", current_students: 1, max_capacity: 10, occupancy_rate: 10.0, group_status: 1 },
                    { group_id: 1, group_name: "TypeScript in friday", teacher_name: "Иванов Иванович", current_students: 2, max_capacity: 10, occupancy_rate: 20.0, group_status: 0 },
                    { group_id: 2, group_name: "C# on monday", teacher_name: "Иванов Иванович", current_students: 3, max_capacity: 10, occupancy_rate: 30.0, group_status: 1 },
                    { group_id: 3, group_name: "Java in monday", teacher_name: "Иванов Иванович", current_students: 3, max_capacity: 10, occupancy_rate: 30.0, group_status: 1 },
                    { group_id: 4, group_name: "JavaScript Advanced", teacher_name: "Светлана Николаева", current_students: 4, max_capacity: 8, occupancy_rate: 50.0, group_status: 1 }
                ]);
                setLoading(false);
            });
    }, [activeReport]);

    const getBarColor = (rate: number): string => {
        if (rate < 30) return '#ef4444';
        if (rate < 60) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className={styles['analytics-container']}>
            <div className={styles['analytics-toolbar']}>
                <div className={styles['analytics-toolbar__left']}>
                    <span className={styles['analytics-toolbar__label']}>Тип аналитики:</span>
                    <select
                        value={activeReport}
                        onChange={(e) => setActiveReport(e.target.value)}
                        className={styles['analytics-select']}
                    >
                        <option value="groups">📈 Заполняемость групп</option>
                        <option value="finance">💰 Финансовый отчет</option>
                        <option value="balances">👥 Баланс клиентов</option>
                    </select>
                </div>

                <div className={styles['analytics-view-toggle']}>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`${styles['analytics-toggle-btn']} ${viewMode === 'table' ? styles['analytics-toggle-btn--active'] : ''}`}
                    >
                        📋 Таблица
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`${styles['analytics-toggle-btn']} ${viewMode === 'chart' ? styles['analytics-toggle-btn--active'] : ''}`}
                    >
                        📊 График
                    </button>
                </div>
            </div>

            <div className={styles['analytics-content']}>
                {loading ? (
                    <div className={styles['analytics-loading']}>Загрузка данных аналитики...</div>
                ) : viewMode === 'chart' ? (

                    <div className={styles['analytics-empty']}>
                        <h3 className={styles['analytics-empty__title']}>Визуализация графиков</h3>
                        <p className={styles['analytics-empty__text']}>Здесь будет отрисовываться Chart.js / Recharts диаграмма для выбранного отчета.</p>
                    </div>

                ) : activeReport === 'groups' ? (

                    <div className={styles['analytics-table-wrapper']}>
                        <table className={styles['analytics-table']}>
                            <thead>
                                <tr className={styles['analytics-table__head-row']}>
                                    <th className={styles['analytics-table__th']}>Группа</th>
                                    <th className={styles['analytics-table__th']}>Преподаватель</th>
                                    <th className={styles['analytics-table__th']}>Статус</th>
                                    <th className={`${styles['analytics-table__th']} ${styles['analytics-table__th--center']}`}>Ученики (Занято / Всего)</th>
                                    <th className={styles['analytics-table__th']}>Заполняемость</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((group) => (
                                    <tr key={group.group_id} className={styles['analytics-table__row']}>
                                        <td className={`${styles['analytics-table__td']} ${styles['analytics-table__td--group-name']}`}>
                                            {group.group_name}
                                        </td>
                                        <td className={styles['analytics-table__td']}>{group.teacher_name || 'Не назначен'}</td>
                                        <td className={styles['analytics-table__td']}>
                                            <span className={`${styles['analytics-badge']} ${group.group_status === 1 ? styles['analytics-badge--active'] : styles['analytics-badge--archived']}`}>
                                                {group.group_status === 1 ? 'Набор / Активна' : 'Архив'}
                                            </span>
                                        </td>
                                        <td className={`${styles['analytics-table__td']} ${styles['analytics-table__td--center']}`}>
                                            <strong className={styles['analytics-table__student-count']}>{group.current_students}</strong>
                                            <span className={styles['analytics-table__student-max']}> / {group.max_capacity}</span>
                                        </td>
                                        <td className={styles['analytics-table__td']}>
                                            <div className={styles['analytics-progress']}>
                                                <span className={styles['analytics-progress__text']}>{group.occupancy_rate}%</span>
                                                <div className={styles['analytics-progress__bg']}>
                                                    <div
                                                        className={styles['analytics-progress__fill']}
                                                        style={{
                                                            width: `${Math.min(group.occupancy_rate, 100)}%`,
                                                            backgroundColor: getBarColor(group.occupancy_rate),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles['analytics-empty']}>
                        <h3 className={styles['analytics-empty__title']}>Отчет в процессе подключения</h3>
                        <p className={styles['analytics-empty__text']}>Табличный вывод для "{activeReport === 'finance' ? 'Финансовый отчет' : 'Баланс клиентов'}" будет настроен на следующем шаге.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
