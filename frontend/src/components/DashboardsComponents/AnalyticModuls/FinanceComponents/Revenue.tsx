import React, { useEffect, useState } from 'react';
import { getRevenueSources } from '@/logic/analytic/Finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueSourceItem {
    name: string;
    value: number;
}

export const Revenue: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<RevenueSourceItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getRevenueSources().then(res => {
            if (Array.isArray(res)) {
                setAnalyticsData(res);
            }
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '13px', margin: 0 }}>Загрузка источников доходов...</p>
            </div>
        );
    }

    if (!analyticsData || analyticsData.length === 0) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Источники выручки</h3>
                <p style={{ fontSize: '13px', margin: '20px 0 0 0' }}>Данные о поступлениях за этот период отсутствуют</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>Источники выручки</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Распределение входящего потока денег по направлениям обучения</p>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            tickFormatter={(v) => `${v / 1000}к`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                            formatter={(v) => [`${Number(v).toLocaleString()} ₽`, 'Выручка']}
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};











