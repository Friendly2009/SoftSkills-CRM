import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { GroupAnalytics } from '../../DashboardsComponents/Analytics';
import styles from '../../cssmoduls/DashboardComponentsCssModuls/analytic.module.css'
interface AnalyticsChartProps {
    data: GroupAnalytics[];
    getBarColor: (rate: number) => string;
    CustomTooltip: React.ComponentType<any>;
}
interface AnalyticsTableProps {
    data: GroupAnalytics[];
    getBarColor: (rate: number) => string;
}

export const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ data, getBarColor }) => {
    return (
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
                    {data.map((group) => (
                        <tr key={group.group_id} className={styles['analytics-table__row']}>
                            <td className={`${styles['analytics-table__td']} ${styles['analytics-table__td--group-name']}`}>{group.group_name}</td>
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
    );
};
export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, getBarColor, CustomTooltip }) => {
    return (
        <div style={{ 
            backgroundColor: '#fff', 
            padding: '24px', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
            width: '100%', 
            height: 400,
            boxSizing: 'border-box'
        }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>Аналитика заполняемости групп (%)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="group_name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickCount={6} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="occupancy_rate" radius={[6, 6, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancy_rate)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const CustomTooltip = ({ active, payload }: any) => {
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