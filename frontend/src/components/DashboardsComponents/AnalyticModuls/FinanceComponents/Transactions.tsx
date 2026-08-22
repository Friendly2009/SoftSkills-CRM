import React, { useEffect, useState } from 'react';
import { TransactionsFrontend } from '@/interfaces/AnalyticsInterfaces';
import { get_transactions_list } from '@/logic/analytic/Finance';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionsFrontend[]>([]);
  const [isForbidden, setIsForbidden] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState<boolean>(true);     

  useEffect(() => {
    get_transactions_list()
      .then((res: any) => {
        if (res?.status === 403) {
          setIsForbidden(true);
        } else {
          setTransactions(res || []);
        }
      })
      .catch((err: any) => {
        if (err?.status === 403 || err?.message?.includes('403')) {
          setIsForbidden(true);
        } else {
          console.error('Ошибка загрузки транзакций:', err);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isForbidden) {
    return (
      <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          У вашей роли недостаточно прав для просмотра финансовых транзакций.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
        Загрузка транзакций...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Последние операции</h3>
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
          {transactions.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 8px', color: '#64748b' }}>
                {new Date(item.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                {item.description}
              </td>
              <td style={{ padding: '12px 8px' }}>
                {item.client_name || item.user_name || '—'}
              </td>
              <td style={{ padding: '12px 8px', color: '#64748b' }}>
                {item.type === 'wallet_topup' ? 'Пополнение' : item.type === 'expense' ? 'Расход' : item.type}
              </td>
              <td style={{
                padding: '12px 8px',
                textAlign: 'right',
                fontWeight: 600,
                color: item.type === 'wallet_topup' ? '#10b981' : '#f43f5e'
              }}>
                {item.type === 'wallet_topup' ? '+' : '-'}
                {Number(item.amount).toLocaleString('ru-RU')} ₽
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
