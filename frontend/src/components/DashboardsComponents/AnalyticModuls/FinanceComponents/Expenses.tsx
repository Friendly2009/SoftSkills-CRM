import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
    { name: 'ФОТ Преподавателей', value: 135000 },
    { name: 'Аренда помещений', value: 30000 },
    { name: 'Маркетинг и реклама', value: 15000 },
];
const COLORS = ['#f43f5e', '#fb923c', '#94a3b8'];

export const Expenses: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>Структура расходов</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b' }}>Основные статьи операционных затрат филиала</p>
            <div style={{ width: '100%', height: 310, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ₽`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
