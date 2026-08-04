import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientTemplate } from '@/interfaces/clientsInterfaces.tsx';
import { getClient } from '@/logic/ClientRequests';

export const ClientProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [client, setClient] = useState<ClientTemplate | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!id) return;
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
                            <span style={styles.infoValue}>
                                {client.next_visit instanceof Date ? client.next_visit.toLocaleDateString('ru-RU') : 'Не назначен'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Обучение и группы</h3>
                    <div style={styles.infoGroup}>
                        <div>
                            <span style={{ ...styles.infoLabel, display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                                Накопленные скилы (очки)
                            </span>
                            <div style={styles.skillsCount}>
                                {client.skills || 0} <span style={{ fontSize: '16px', color: '#666666' }}>pts</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '8px' }}>
                            <span style={{ ...styles.infoLabel, display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                                Состоит в группах
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {client.group_names && client.group_names.length > 0 ? (
                                    client.group_names.map((name, i) => (
                                        <span key={i} style={styles.groupBadge}>
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
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
    container: { padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' },
    backButton: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: 500, marginBottom: '20px' },
    headerCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    profileMain: { display: 'flex', alignItems: 'center', gap: '16px' },
    avatar: { width: '64px', height: '64px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 600, color: '#475569' },
    nameBlock: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
    name: { margin: 0, fontSize: '24px', fontWeight: 600, color: '#1e293b' },
    badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, display: 'inline-block', width: 'fit-content' },
    balanceBlock: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end' },
    balanceLabel: { fontSize: '13px', color: '#64748b' },
    balanceValue: { fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '4px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    card: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' },
    infoGroup: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' },
    infoLabel: { fontSize: '13px', color: '#64748b' },
    infoValue: { fontSize: '14px', fontWeight: 500, color: '#1e293b' },
    skillsCount: { fontSize: '28px', fontWeight: 700, color: '#2563eb', marginTop: '4px' },
    groupBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }
};
