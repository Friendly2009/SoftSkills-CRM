import React, { useEffect, useState } from 'react';
import { getExpensesStructureData } from '@/logic/analytic/Finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpenseStructureItem {
    name: string;
    value: string | number;
}

const COLORS = ['#f43f5e', '#fb923c', '#8b5cf6', '#64748b'];

export const Expenses: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<ExpenseStructureItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);

    useEffect(() => {
        getExpensesStructureData()
            .then(res => {
                if (res?.status === 403) {
                    setIsForbidden(true);
                } else if (Array.isArray(res)) {
                    setAnalyticsData(res);
                }
            })
            .catch(err => {
                console.error("Ошибка загрузки структуры расходов:", err);
                if (err?.status === 403 || err?.message?.includes('403')) {
                    setIsForbidden(true);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const totalExpenses = analyticsData.reduce((sum, item) => sum + Number(item.value), 0);

    if (loading) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>Загрузка структуры расходов...</p>
            </div>
        );
    }

    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли недостаточно прав для просмотра структуры операционных расходов.
                </p>
            </div>
        );
    }

    if (analyticsData.length === 0) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Структура расходов</h3>
                <p style={{ fontSize: '13px', margin: '20px 0 0 0' }}>Данные о расходах за текущий период отсутствуют</p>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#ffffff',
            padding: '28px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
        }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Структура операционных расходов</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b' }}>Распределение затрат и выплат компании по ключевым категориям</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}>

                <div style={{ width: '220px', height: 220, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={analyticsData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={95}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {analyticsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ₽`} />
                        </PieChart>
                    </ResponsiveContainer>

                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Всего расходов</span>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                            {totalExpenses.toLocaleString()} ₽
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '300px' }}>
                    {analyticsData.map((item, index) => {
                        const itemValue = Number(item.value);
                        const percentage = totalExpenses > 0 ? ((itemValue / totalExpenses) * 100).toFixed(1) : '0';

                        return (
                            <div
                                key={item.name}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px solid #f1f5f9',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ width: '10px', height: '10px', backgroundColor: COLORS[index % COLORS.length], borderRadius: '50%' }}></span>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{item.name}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                        {itemValue.toLocaleString()} ₽
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px', fontWeight: 500 }}>
                                        ({percentage}%)
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};
