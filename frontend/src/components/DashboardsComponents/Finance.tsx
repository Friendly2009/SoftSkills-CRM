import React, { useEffect, useState } from 'react';
import { getExpensesStructureData, addManualExpenseRequest } from '@/logic/analytic/Finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PlusCircle, Wallet, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ExpenseItem {
    name: string;
    value: number;
}

const COLORS = ['#f43f5e', '#fb923c', '#8b5cf6', '#64748b'];


export const Expenses: React.FC = () => {
    const [data, setData] = useState<ExpenseItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [amount, setAmount] = useState<string>('');
    const [category, setCategory] = useState<string>('Аренда помещений');
    const [comment, setComment] = useState<string>('');
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [successStatus, setSuccessStatus] = useState<boolean>(false);


    const loadExpensesData = () => {
        getExpensesStructureData().then(res => {
            if (Array.isArray(res)) {
                setData(res);
            }
            setLoading(false);
        });
    };

    useEffect(() => {
        loadExpensesData();
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) return;

        setFormLoading(true);
        const res = await addManualExpenseRequest({ amount: numAmount, category, comment });
        setFormLoading(false);

        if (res?.success) {
            setAmount('');
            setComment('');
            setSuccessStatus(true);
            loadExpensesData();
            setTimeout(() => setSuccessStatus(false), 3000);
        } else {
            alert(res?.message || 'Не удалось сохранить расход');
        }
    };

    const totalExpenses = data.reduce((sum, item) => sum + Number(item.value), 0);

    if (loading) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>Загрузка структуры расходов...</p>
            </div>
        );
    }
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginTop: '16px' }}>

            <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Structuring Cost</h3>
                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b' }}>Операционные расходы филиала из единой кассы</p>

                    {data.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '14px', fontWeight: 500 }}>Расходы за текущий период отсутствуют</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '200px', height: 180, position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ₽`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Всего трат</span>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{totalExpenses.toLocaleString()} ₽</div>
                                </div>
                            </div>

                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.map((item, index) => {
                                    const percentage = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : '0';
                                    return (
                                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ width: '8px', height: '8px', backgroundColor: COLORS[index % COLORS.length], borderRadius: '50%' }}></span>
                                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{item.name}</span>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                                {Number(item.value).toLocaleString()} ₽
                                                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontWeight: 500 }}>({percentage}%)</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlusCircle size={18} color="#f43f5e" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Зафиксировать новый расход</h3>
                </div>
                <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b' }}>Прямое списание денежных средств со счета компании</p>

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Сумма расхода (₽)</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                min="1"
                                disabled={formLoading}
                                style={{ width: '100%', padding: '12px 14px 10px 40px', fontSize: '14px', color: '#0f172a', fontWeight: 500, border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#f43f5e'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                            <Wallet size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Категория затрат</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={formLoading}
                            style={{ width: '100%', padding: '12px 14px', fontSize: '14px', color: '#0f172a', fontWeight: 500, border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = '#f43f5e'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        >
                            <option value="Аренда помещений">Аренда помещений</option>
                            <option value="Маркетинг и реклама">Маркетинг и реклама</option>
                            <option value="Канцелярия и материалы">Канцелярия и материалы</option>
                            <option value="Хозяйственные расходы">Хозяйственные расходы</option>
                            <option value="ФОТ Преподавателей (Вручную)">ФОТ Преподавателей (Вручную)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Комментарий / Пояснение</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={100}
                                disabled={formLoading}
                                style={{ width: '100%', padding: '12px 14px 10px 40px', fontSize: '14px', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#f43f5e'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                            <FileText size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
                        </div>
                    </div>

                    {successStatus && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '13px', fontWeight: 500 }}>
                            <CheckCircle2 size={16} color="#10b981" />
                            Расход успешно записан и добавлен в кассу!
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={formLoading || !amount}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#fff',
                            backgroundColor: formLoading || !amount ? '#fda4af' : '#f43f5e',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: formLoading || !amount ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: formLoading || !amount ? 'none' : '0 4px 12px rgba(244, 63, 94, 0.2)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!formLoading && amount) e.currentTarget.style.backgroundColor = '#e11d48';
                        }}
                        onMouseLeave={(e) => {
                            if (!formLoading && amount) e.currentTarget.style.backgroundColor = '#f43f5e';
                        }}
                    >
                        {formLoading ? 'Сохранение...' : (
                            <>
                                Подтвердить списание <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>
            </div>

        </div>
    );
};
