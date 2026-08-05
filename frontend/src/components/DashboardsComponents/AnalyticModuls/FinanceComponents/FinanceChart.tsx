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
import { FinancialTimelineData, FinanceChartProps } from '@/interfaces/analyticsInterfaces';

// Моковые исторические данные по месяцам
const mockTimelineData: FinancialTimelineData[] = [
    { period: 'Март', revenue: 310000, profit: 190000, expenses: 120000, debts: 45000 },
    { period: 'Апр', revenue: 380000, profit: 220000, expenses: 160000, debts: 40000 },
    { period: 'Май', revenue: 420000, profit: 250000, expenses: 170000, debts: 38000 },
    { period: 'Июнь', revenue: 400000, profit: 230000, expenses: 170000, debts: 42000 },
    { period: 'Июль', revenue: 450000, profit: 270000, expenses: 180000, debts: 35000 },
];

export const FinanceChart: React.FC<FinanceChartProps> = ({ companyId }) => {
    const [chartData, setChartData] = useState<FinancialTimelineData[]>([]);

    useEffect(() => {
        // Тут в будущем будет fetch-запрос к бэку с передачей companyId
        setChartData(mockTimelineData);
    }, [companyId]);

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

                        {/* 1. Выручка — Синяя линия */}
                        <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            name="Выручка" 
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            dot={{ r: 4 }} 
                            activeDot={{ r: 7 }} 
                        />
                        
                        {/* 2. Чистая прибыль — Зеленая линия */}
                        <Line 
                            type="monotone" 
                            dataKey="profit" 
                            name="Чистая прибыль" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ r: 4 }} 
                            activeDot={{ r: 7 }} 
                        />
                        
                        {/* 3. Расходы — Красная линия (Штрихованная) */}
                        <Line 
                            type="monotone" 
                            dataKey="expenses" 
                            name="Расходы" 
                            stroke="#f43f5e" 
                            strokeWidth={2} 
                            strokeDasharray="4 4"
                            dot={{ r: 3 }} 
                        />
                        
                        {/* 4. Долги клиентов — Фиолетовая линия */}
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
            </div>
        </div>
    );
};
