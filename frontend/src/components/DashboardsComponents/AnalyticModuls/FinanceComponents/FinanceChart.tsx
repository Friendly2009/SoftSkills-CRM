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
import { getFinanceChartData } from '@/logic/analytic/Finance';

export const FinanceChart: React.FC = () => {
    const [chartData, setChartData] = useState<FinancialTimelineData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchChartData = async () => {
            try {
                setIsLoading(true);
                const data = await getFinanceChartData();
                if (isMounted && data) {
                    setChartData(data);
                }
            } catch (error) {
                console.error("Ошибка при загрузке графика:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchChartData();
        return () => { isMounted = false; };
    }, []); 

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

            <div style={{ width: '100%', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoading ? (
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Загрузка данных графика...</span>
                ) : chartData.length === 0 ? (
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Нет данных за выбранный период</span>
                ) : (
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
                                dataKey="revenue" 
                                name="Выручка" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                dot={{ r: 4 }} 
                                activeDot={{ r: 7 }} 
                            />
                            
                            <Line 
                                type="monotone" 
                                dataKey="profit" 
                                name="Чистая прибыль" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                dot={{ r: 4 }} 
                                activeDot={{ r: 7 }} 
                            />
                            
                            <Line 
                                type="monotone" 
                                dataKey="expenses" 
                                name="Расходы" 
                                stroke="#f43f5e" 
                                strokeWidth={2} 
                                strokeDasharray="4 4"
                                dot={{ r: 3 }} 
                            />
                            
                            <Line 
                                type="monotone" 
                                dataKey="debts" 
                                name="Долги клиентов" 
                                stroke="#8b5cf6" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
