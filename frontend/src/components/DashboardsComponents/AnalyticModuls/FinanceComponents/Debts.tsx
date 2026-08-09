import React from 'react';

const mockDebtors = [
    { id: 1, name: 'Алексей Петров', group: 'Группа Python', debt: -4800, contact: '+7 (999) 111-22-33' },
    { id: 2, name: 'Мария Сидорова', group: 'Группа Web', debt: -3200, contact: '+7 (999) 444-55-66' },
    { id: 3, name: 'Иван Кравцов', group: 'Индивидуальные', debt: -1600, contact: '+7 (999) 777-88-99' },
];

export const Debts: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>Должники (Отрицательный баланс)</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Список клиентов с кассовым разрывом, требующих уведомления</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mockDebtors.map(debtor => (
                    <div key={debtor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#fff5f5', borderRadius: '10px', border: '1px solid #fee2e2' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{debtor.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{debtor.group} • {debtor.contact}</div>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>
                            {debtor.debt.toLocaleString('ru-RU')} ₽
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
