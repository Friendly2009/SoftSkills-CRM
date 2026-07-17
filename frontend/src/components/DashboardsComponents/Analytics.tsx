import React, { useEffect, useState } from 'react';
import styles from '../cssmoduls/DashboardComponentsCssModuls/analytic.module.css';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { getAccupancyGroups } from '../../logic/analytic/accupancy_groups'
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

    const [reportData, setReportData] = useState<GroupAnalytics[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        if (activeReport === 'groups') {
            setLoading(true);
            getAccupancyGroups(setReportData, setLoading);
        }
    }, [activeReport]);

    const getBarColor = (rate: number): string => {
        if (rate < 30) return '#ef4444';
        if (rate < 60) return '#f59e0b';
        return '#10b981';
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data: GroupAnalytics = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: '#fff',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{data.group_name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Преподаватель: {data.teacher_name || '—'}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#1e293b' }}>
                        Заполненность: <strong>{data.current_students} из {data.max_capacity} ({data.occupancy_rate}%)</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

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
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', width: '100%', height: 400 }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>Аналитика заполняемости групп (%)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="group_name"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickCount={6}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar
                                    dataKey="occupancy_rate"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                >
                                    {reportData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancy_rate)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
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
