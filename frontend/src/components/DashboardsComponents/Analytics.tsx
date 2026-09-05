import React, { useEffect, useState } from 'react';
import styles from '../cssmoduls/dashboardcomponentscssmoduls/analytic.module.css';

import { getAccupancyGroups, getBarColor } from '@/logic/analytic/accupancy_groups';
import { AnalyticsTable, AnalyticsChart, CustomTooltip } from '../DashboardsComponents/AnalyticModuls/AccupancyGroup';
import { FinancialAnalyticsDashboard } from '@/components/DashboardsComponents/AnalyticModuls/FinancialAnalyticsDashboard';
import { GroupAnalytics } from '@/interfaces/analyticsInterfaces';
import { TeacherBurnoutTracker } from '@/components/DashboardsComponents/AnalyticModuls/TeacherBurnoutTracker';
import { AttendanceTrendTracker } from '@/components/DashboardsComponents/AnalyticModuls/AttendanceTrendTracker';
export const Analytic: React.FC = () => {
    const [activeReport, setActiveReport] = useState<string>('main_finance');
    const [viewMode, setViewMode] = useState<string>('finance_chart');
    const [groupsLoading, setGroupsLoading] = useState<boolean>(true);
    const [accupancyGroup, setAccupancyGroup] = useState<GroupAnalytics[]>([]);

    useEffect(() => {
        if (activeReport === "groups") {
            setGroupsLoading(true);
            setViewMode('chart');
            getAccupancyGroups(setAccupancyGroup, setGroupsLoading);
        } else if (activeReport === "main_finance") {
            setViewMode('finance_chart');
        } else if (activeReport === "teachers") {
            setViewMode("default");
        }
    }, [activeReport]);

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
                        <option value="main_finance">Финансы</option>
                        <option value="groups">Заполняемость групп</option>
                        <option value="attendance">Посещаемость</option>
                        <option value="teachers">Нагрузка преподавателей</option>
                    </select>
                </div>

                <div className={styles['analytics-view-toggle']}>
                    {activeReport === 'groups' && (
                        <>
                            <button onClick={() => setViewMode('table')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'table' ? styles['analytics-toggle-btn--active'] : ''}`}>Таблица</button>
                            <button onClick={() => setViewMode('chart')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'chart' ? styles['analytics-toggle-btn--active'] : ''}`}>График</button>
                        </>
                    )}

                    {activeReport === 'main_finance' && (
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
                {activeReport === 'groups' && (
                    groupsLoading ? (
                        <div className={styles.loading}>Загрузка групп...</div>
                    ) : viewMode === 'chart' ? (
                        <AnalyticsChart data={accupancyGroup} getBarColor={getBarColor} CustomTooltip={CustomTooltip} />
                    ) : (
                        <AnalyticsTable data={accupancyGroup} getBarColor={getBarColor} />
                    )
                )}

                {activeReport === 'main_finance' && (
                    <FinancialAnalyticsDashboard subView={viewMode} />
                )}

                {activeReport === 'teachers' && (
                    <TeacherBurnoutTracker />
                )}
                {activeReport === 'attendance' && (
                    <AttendanceTrendTracker />
                )}
            </div>
        </div>
    );
};
