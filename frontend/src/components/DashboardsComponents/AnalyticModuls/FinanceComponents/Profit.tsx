import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { FinancialTimelineData } from '@/interfaces/AnalyticsInterfaces';
import { getFinancialTimelineData } from '@/logic/analytic/Finance';

export const Profit: React.FC = () => {
    const [chartData, setChartData] = useState<FinancialTimelineData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        getFinancialTimelineData()
            .then(res => {
                if (isMounted) {
                    if (res?.status === 403) {
                        setIsForbidden(true);
                    } else if (Array.isArray(res)) {
                        setChartData(res);
                    }
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Ошибка загрузки графика прибыли:", err);
                if (isMounted) {
                    if (err?.status === 403 || err?.message?.includes('403')) {
                        setIsForbidden(true);
                    }
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '14px', margin: 0 }}>Загрузка financial графика...</p>
            </div>
        );
    }

    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли недостаточно прав для просмотра графиков прибыли.
                </p>
            </div>
        );
    }

    if (!chartData || chartData.length === 0) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Сравнительный график финансовых потоков</h3>
                <p style={{ fontSize: '13px', margin: '20px 0 0 0' }}>Данные для построения графиков за текущий период отсутствуют</p>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
        }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                Сравнительный график финансовых потоков филиала
            </h3>

            <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="period"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            tickFormatter={(value) => `${value.toLocaleString('ru-RU')} ₽`}
                        />
                        <Tooltip
                            formatter={(value: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`]}
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Legend verticalAlign="top" height={40} iconType="circle" />
                        <Line
                            type="monotone"
                            dataKey="profit"
                            name="Чистая прибыль"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 7 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
