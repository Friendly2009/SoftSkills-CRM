import React from 'react';

const mockFlow = [
    { id: 1, date: '2026-08-04', desc: 'Проведение урока №36', name: 'Группа Python', type: 'Доход (Списание со студента)', role: 'payer', amount: 800 },
    { id: 2, date: '2026-08-04', desc: 'Проведение урока №36', name: 'Иван Иванович', type: 'Расход (Выплата преподавателю)', role: 'recipient', amount: 1500 },
    { id: 3, date: '2026-08-03', desc: 'Проведение урока №32', name: 'Мария Сидорова', type: 'Доход (Списание со студента)', role: 'payer', amount: 800 },
];

export const Transactions: React.FC = () => {
    return (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>Последние операции</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                        <th style={{ padding: '10px 8px' }}>Дата</th>
                        <th style={{ padding: '10px 8px' }}>Описание</th>
                        <th style={{ padding: '10px 8px' }}>Контрагент</th>
                        <th style={{ padding: '10px 8px' }}>Тип</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    {mockFlow.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 500 }}>{item.desc}</td>
                            <td style={{ padding: '12px 8px' }}>{item.name}</td>
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{item.type}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, color: item.role === 'payer' ? '#10b981' : '#f43f5e' }}>
                                {item.role === 'payer' ? '+' : '-'} {item.amount.toLocaleString()} ₽
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
