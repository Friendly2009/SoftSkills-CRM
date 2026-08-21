import React, { useEffect, useState } from 'react';
import { getExpensesData, addManualExpenseRequest } from '@/logic/analytic/Finance';
import { PlusCircle, Wallet, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ExpenseTransactionItem {
    transaction_id: number;
    date: string;
    expense_amount: string | number;
    operation_description: string;
    lesson_id: number | null;
    teacher_id: number | null;
}

export const Expenses: React.FC = () => {
    const [transactions, setTransactions] = useState<ExpenseTransactionItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [amount, setAmount] = useState<string>('');
    const [category, setCategory] = useState<string>('Аренда помещений');
    const [comment, setComment] = useState<string>('');
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [successStatus, setSuccessStatus] = useState<boolean>(false);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);

    const loadExpensesData = () => {
        getExpensesData()
            .then((res: any) => {
                // ПРАВИЛЬНЫЙ ПЕРЕХВАТ: Если функция API вернула маркер 403 ошибки
                if (res?.status === 403) {
                    setIsForbidden(true);
                } else if (Array.isArray(res)) {
                    setTransactions(res);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                if (err?.status === 403 || err?.message?.includes('403')) {
                    setIsForbidden(true);
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

    if (loading) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>Загрузка ленты расходов...</p>
            </div>
        );
    }

    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли нет доступа к просмотру финансовых расходов компании.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginTop: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>История расходов</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Список всех начислений и списаний со счета компании</p>

                    {transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '14px', fontWeight: 500 }}>Нет трат</div>
                    ) : (
                        <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                                        <th style={{ padding: '8px 4px', fontWeight: 600 }}>Дата</th>
                                        <th style={{ padding: '8px 4px', fontWeight: 600 }}>Описание</th>
                                        <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Сумма</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                                            <td style={{ padding: '10px 4px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                {tx.date}
                                            </td>
                                            <td style={{ padding: '10px 4px', fontWeight: 500, color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.operation_description}>
                                                {tx.operation_description}
                                            </td>
                                            <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600, color: '#f43f5e', whiteSpace: 'nowrap' }}>
                                                - {Number(tx.expense_amount).toLocaleString('ru-RU')} ₽
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
