import React, { useEffect, useState } from 'react';
import styles from '../cssmoduls/DashboardComponentsCssModuls/analytic.module.css';
import { getAccupancyGroups, getBarColor } from '../../logic/analytic/accupancy_groups';
import { AnalyticsTable, AnalyticsChart, CustomTooltip } from '../DashboardsComponents/AnalyticModuls/AccupancyGroup';
import { FinancialAnalyticsDashboard } from '@/components/DashboardsComponents/AnalyticModuls/FinancialAnalyticsDashboard';
import { GroupAnalytics } from '@/interfaces/analyticsInterfaces';

export const Analytic: React.FC = () => {
    const [activeReport, setActiveReport] = useState<string>('groups');
    const [viewMode, setViewMode] = useState<string>('chart');
    const [loading, setLoading] = useState<boolean>(true);
    const [accupancyGroup, setAccupancyGroup] = useState<GroupAnalytics[]>([]);

    useEffect(() => {
        switch (activeReport) {
            case "groups":
                setLoading(true);
                setViewMode('chart');
                getAccupancyGroups(setAccupancyGroup, setLoading);
                break;
            case "main_finance":
                setLoading(false);
                setViewMode('finance_chart');
                break;
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
                        <option value="main_finance">Общая выручка</option>
                    </select>
                </div>

                <div className={styles['analytics-view-toggle']}>
                    {activeReport === 'groups' ? (
                        <>
                            <button onClick={() => setViewMode('table')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'table' ? styles['analytics-toggle-btn--active'] : ''}`}>Таблица</button>
                            <button onClick={() => setViewMode('chart')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'chart' ? styles['analytics-toggle-btn--active'] : ''}`}>График</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setViewMode('revenue')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'revenue' ? styles['analytics-toggle-btn--active'] : ''}`}>Выручка</button>
                            <button onClick={() => setViewMode('profit')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'profit' ? styles['analytics-toggle-btn--active'] : ''}`}>Чистая прибыль</button>
                            <button onClick={() => setViewMode('expenses')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'expenses' ? styles['analytics-toggle-btn--active'] : ''}`}>Расходы</button>
                            <button onClick={() => setViewMode('debts')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'debts' ? styles['analytics-toggle-btn--active'] : ''}`}>Долги клиентов</button>
                            <button onClick={() => setViewMode('transactions')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'transactions' ? styles['analytics-toggle-btn--active'] : ''}`}>Лента транзакций</button>
                            <button onClick={() => setViewMode('finance_chart')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'finance_chart' ? styles['analytics-toggle-btn--active'] : ''}`}>Общий график</button>
                        </>
                    )}
                </div>
            </div>

            <div className={styles['analytics-content']}>
                {activeReport === 'groups' ? (
                    viewMode === 'chart' ? (
                        <AnalyticsChart data={accupancyGroup} getBarColor={getBarColor} CustomTooltip={CustomTooltip} />
                    ) : (
                        <AnalyticsTable data={accupancyGroup} getBarColor={getBarColor} />
                    )
                ) : (
                    <FinancialAnalyticsDashboard subView={viewMode} />
                )}
            </div>
        </div>
    );
};
