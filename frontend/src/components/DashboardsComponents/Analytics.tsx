import React, { useEffect, useState } from 'react';
import styles from '../cssmoduls/DashboardComponentsCssModuls/analytic.module.css';
import { getAccupancyGroups, getBarColor } from '../../logic/analytic/accupancy_groups';
import { AnalyticsTable, AnalyticsChart, CustomTooltip } from '../DashboardsComponents/AnalyticModuls/AccupancyGroup';
export interface GroupAnalytics {
    group_id: number;
    group_name: string;
    teacher_name: string | null;
    current_students: number;
    max_capacity: number;
    occupancy_rate: number;
    group_status: number;
}

export const Analytic: React.FC = () => {
    const [activeReport, setActiveReport] = useState<string>('groups');
    const [viewMode, setViewMode] = useState<string>('chart');
    const [loading, setLoading] = useState<boolean>(true);
    const [accupancyGroup, setAccupancyGroup] = useState<GroupAnalytics[]>([]);

    useEffect(() => {
        if (activeReport === 'groups') {
            setLoading(true);
            getAccupancyGroups(setAccupancyGroup, setLoading);
        }
    }, [activeReport]);

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

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
                        <option value="groups">Заполняемость групп</option>
                    </select>
                </div>

                <div className={styles['analytics-view-toggle']}>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`${styles['analytics-toggle-btn']} ${viewMode === 'table' ? styles['analytics-toggle-btn--active'] : ''}`}
                    >
                        Таблица
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`${styles['analytics-toggle-btn']} ${viewMode === 'chart' ? styles['analytics-toggle-btn--active'] : ''}`}
                    >
                        График
                    </button>
                </div>
            </div>

            <div className={styles['analytics-content']}>
                {loading ? (
                    <div className={styles['analytics-loading']}>Загрузка данных аналитики...</div>
                ) : viewMode === 'chart' ? (
                    <AnalyticsChart
                        data={accupancyGroup}
                        getBarColor={getBarColor}
                        CustomTooltip={CustomTooltip}
                    />
                ) : activeReport === 'groups' ? (
                    <AnalyticsTable
                        data={accupancyGroup}
                        getBarColor={getBarColor}
                    />
                ) : (
                    <div className={styles['analytics-empty']}>
                        <h3 className={styles['analytics-empty__title']}>Отчет в процессе подключения</h3>
                        <p className={styles['analytics-empty__text']}>
                            Табличный вывод для "{activeReport === 'finance' ? 'Финансовый отчет' : 'Баланс клиентов'}" будет настроен на следующем шаге.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
