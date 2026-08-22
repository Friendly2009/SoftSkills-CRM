import React, { useEffect, useState } from 'react';
import { Users, Phone, ShieldAlert } from 'lucide-react';
import { getDebtClient } from '@/logic/analytic/Finance';

interface DebtorItem {
    id: number;
    name: string;
    debt: number;
    contact: string;
    group_names: string;
}

export const Debts: React.FC = () => {
    const [debtors, setDebtors] = useState<DebtorItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);

    useEffect(() => {
        getDebtClient()
            .then(res => {
                if (res?.status === 403) {
                    setIsForbidden(true);
                } else if (Array.isArray(res)) {
                    setDebtors(res);
                }
            })
            .catch(err => {
                console.error("Ошибка загрузки списка должников:", err);
                if (err?.status === 403 || err?.message?.includes('403')) {
                    setIsForbidden(true);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '13px', margin: 0 }}>Загрузка списка должников...</p>
            </div>
        );
    }

    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли недостаточно прав для просмотра списка должников.
                </p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ShieldAlert size={18} color="#ef4444" />
                <h3 style={{ margin: '0', fontSize: '15px', fontWeight: 600 }}>Должники (Отрицательный баланс)</h3>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Список клиентов с кассовым разрывом, требующих уведомления</p>

            {debtors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 500, fontSize: '13px' }}>
                    Все клиенты имеют положительный баланс! Должников нет.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {debtors.map(debtor => (
                        <div
                            key={debtor.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '14px 16px',
                                backgroundColor: '#fff5f5',
                                borderRadius: '10px',
                                border: '1px solid #fee2e2',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={16} color="#ef4444" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{debtor.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ color: '#475569', fontWeight: 500 }}>{debtor.group_names}</span>
                                        {debtor.contact && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} color="#94a3b8" /> {debtor.contact}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', fontWeight: 700, color: '#ef4444' }}>
                                {Number(debtor.debt).toLocaleString('ru-RU')} ₽
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
