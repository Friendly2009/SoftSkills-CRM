import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { fetchAttendanceTrends } from '@/logic/analytic/Clients';
import { AttendanceTrendData } from '@/interfaces/AnalyticsInterfaces'
export const AttendanceTrendTracker: React.FC = () => {
    const [data, setData] = useState<AttendanceTrendData[]>([]);
    const [range, setRange] = useState<string>('month');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        fetchAttendanceTrends(range).then(res => {
            if (isMounted) {
                setData(res);
                setIsLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, [range]); 

    const filterButtons = [
        { key: 'week', label: 'Неделя' },
        { key: 'month', label: 'Месяц' },
        { key: 'quarter', label: 'Квартал' }
    ];

    return (
        <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                        Аналитика посещаемости студентов
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        Динамика вовлеченности для предотвращения оттока клиентов
                    </p>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                    {filterButtons.map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => setRange(btn.key)}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                backgroundColor: range === btn.key ? '#ffffff' : 'transparent',
                                color: range === btn.key ? '#0f172a' : '#64748b',
                                boxShadow: range === btn.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoading ? (
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Загрузка трендов...</span>
                ) : data.length === 0 ? (
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Нет данных о посещаемости за выбранный период</span>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="period"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                domain={[0, 100]}
                                tickFormatter={(val) => `${val}%`}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={false}
                                formatter={(value: any) => [`${value}% посещаемости`]}
                                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="rate"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#attendanceColor)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
