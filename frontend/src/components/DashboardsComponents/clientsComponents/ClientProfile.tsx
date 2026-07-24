import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientTemplate } from '@/interfaces/clientsInterfaces.tsx';
import { getClient } from '@/logic/Requests.ts'; // твоя рабочая функция запросов

export const ClientProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // достаем id из URL
    const navigate = useNavigate(); // для кнопки Назад
    
    const [client, setClient] = useState<ClientTemplate | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!id) return;
        // Загружаем клиентов и находим нужного по id из роутера
        getClient().then((data) => {
            if (data) {
                const foundClient = data.find((c: ClientTemplate) => c.id === parseInt(id, 10));
                setClient(foundClient || null);
            }
            setLoading(false);
        });
    }, [id]);

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
    };

    const formatBalance = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Загрузка...</div>;
    if (!client) return <div style={{ padding: '24px', textAlign: 'center', color: 'red' }}>Клиент не найден</div>;

    return (
        <div style={styles.container}>
            {/* Кнопка назад теперь просто перенаправляет обратно на дашборд */}
            <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
                ← Назад к списку
            </button>

            <div style={styles.headerCard}>
                <div style={styles.profileMain}>
                    <div style={styles.avatar}>
                        {getInitials(client.name)}
                    </div>
                    <div style={styles.nameBlock}>
                        <h1 style={styles.name}>{client.name || 'Тестовый Клиент'}</h1>
                        <span style={{
                            ...styles.badge,
                            backgroundColor: client.status === 1 ? '#e6f4ea' : '#fce8e6',
                            color: client.status === 1 ? '#137333' : '#c5221f',
                        }}>
                            {client.status === 1 ? 'Активен' : 'Заморожен'}
                        </span>
                    </div>
                </div>

                <div style={styles.balanceBlock}>
                    <span style={styles.balanceLabel}>Текущий баланс</span>
                    <span style={styles.balanceValue}>{formatBalance(client.balance)}</span>
                </div>
            </div>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Основная информация</h3>
                    <div style={styles.infoGroup}>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>ID Клиента</span>
                            <span style={styles.infoValue}>#{client.id}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Телефон / Контакт</span>
                            <span style={styles.infoValue}>{client.contact || '—'}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>Следующий визит</span>
                            <span style={styles.infoValue}>{client.next_visit || 'Не назначен'}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Обучение и группы</h3>
                    <div style={styles.infoGroup}>
                        <div>
                            <span style={{...styles.infoLabel, display: 'block', marginBottom: '8px', fontSize: '14px'}}>
                                Накопленные скилы (очки)
                            </span>
                            <div style={styles.skillsCount}>
                                {client.skills || 0} <span style={{fontSize: '16px', color: '#666666'}}>pts</span>
                            </div>
                        </div>
                        
                        <div style={{marginTop: '8px'}}>
                            <span style={{...styles.infoLabel, display: 'block', marginBottom: '8px', fontSize: '14px'}}>
                                Состоит в группах
                            </span>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                                {client.group_names && client.group_names.length > 0 ? (
                                    client.group_names.map((name, i) => (
                                        <span key={i} style={styles.groupBadge}>
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{fontSize: '14px', color: '#9ca3af', fontStyle: 'italic'}}>
                                        Нет привязанных групп
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' },
    backButton: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' },
    headerCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
    profileMain: { display: 'flex', alignItems: 'center', gap: '20px' },
    avatar: { width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' },
    nameBlock: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
    name: { margin: 0, fontSize: '24px' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px' },
    balanceBlock: { textAlign: 'right' as const },
    balanceLabel: { fontSize: '13px', color: '#666' },
    balanceValue: { fontSize: '28px', fontWeight: 700, color: '#10b981' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 20px 0', fontSize: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' },
    infoGroup: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
    infoLabel: { color: '#666' },
    infoValue: { fontWeight: 500 },
    skillsCount: { fontSize: '32px', fontWeight: 700, color: '#3b82f6' },
    groupBadge: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }
};
