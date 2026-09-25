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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-1 bg-[#e2e8f0] p-1 rounded-md w-full md:w-auto">
                    {activeReport === 'groups' && (
                        <>
                            <button onClick={() => setViewMode('table')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'table' ? styles['analytics-toggle-btn--active'] : ''}`}>Таблица</button>
                            <button onClick={() => setViewMode('chart')} className={`${styles['analytics-toggle-btn']} ${viewMode === 'chart' ? styles['analytics-toggle-btn--active'] : ''}`}>График</button>
                        </>
                    )}

                    {activeReport === 'main_finance' && (
                        <>
                            <button
                                onClick={() => setViewMode('revenue')}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all text-center
                    ${viewMode === 'revenue' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#475569] hover:text-[#0f172a]'}`}
                            >
                                Выручка
                            </button>

                            <button
                                onClick={() => setViewMode('profit')}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all text-center
                    ${viewMode === 'profit' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#475569] hover:text-[#0f172a]'}`}
                            >
                                Чистая прибыль
                            </button>

                            <button
                                onClick={() => setViewMode('expenses')}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all text-center
                    ${viewMode === 'expenses' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#475569] hover:text-[#0f172a]'}`}
                            >
                                Расходы
                            </button>

                            <button
                                onClick={() => setViewMode('debts')}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all text-center
                    ${viewMode === 'debts' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#475569] hover:text-[#0f172a]'}`}
                            >
                                Долги клиентов
                            </button>

                            <button
                                onClick={() => setViewMode('transactions')}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all text-center
                    ${viewMode === 'transactions' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#475569] hover:text-[#0f172a]'}`}
                            >
                                Лента транзакций
                            </button>

                            <button
                                onClick={() => setViewMode('finance_chart')}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all text-center
                    ${viewMode === 'finance_chart' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#475569] hover:text-[#0f172a]'}`}
                            >
                                Общий график
                            </button>
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
