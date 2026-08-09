import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Группа Web', value: 140000 },
    { name: 'Группа Python', value: 180000 },
    { name: 'Группа Design', value: 90000 },
    { name: 'Индивидуальные', value: 40000 },
];

export const Revenue: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>Источники выручки</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Распределение входящего потока денег по направлениям обучения</p>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `${v / 1000}к`} />
                        <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} ₽`, 'Выручка']} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
