import { ILead, ICreateLeadDto } from '@/interfaces/LeadInterfaces';
import React, { useState, useEffect } from 'react';
import { CreateLeadModal } from './LeadsComponents/CreateLeadModal';

const styles = {
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        color: '#333333',
    },
    actionBar: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
    },
    btnCreate: {
        backgroundColor: '#1d3557',
        color: '#ffffff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
    },
    btnEdit: {
        backgroundColor: '#e2f0fd',
        color: '#1d3557',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
    },
    btnDelete: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
    },
    tableWrapper: {
        border: '1px solid #eef2f5',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
    },
    headerRow: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr 1.5fr 0.5fr',
        backgroundColor: '#f8fafc',
        padding: '12px 16px',
        borderBottom: '1px solid #eef2f5',
        color: '#8a99a8',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr 1.5fr 0.5fr',
        padding: '14px 16px',
        borderBottom: '1px solid #eef2f5',
        alignItems: 'center',
        fontSize: '13px',
        color: '#2c3e50',
        backgroundColor: '#ffffff',
        transition: 'background-color 0.2s',
        cursor: 'pointer',
    },
    rowSelected: {
        backgroundColor: '#f1f5f9',
    },
    avatarCircle: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '12px',
        marginRight: '10px',
    },
    clientCell: {
        display: 'flex',
        alignItems: 'center',
    },
    clientName: {
        fontWeight: 500,
        color: '#1e293b',
    },
    sourceTag: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        display: 'inline-block',
    },
    statusNew: { color: '#3b82f6', fontWeight: 500 },
    statusProgress: { color: '#eab308', fontWeight: 500 },
    statusScheduled: { color: '#a855f7', fontWeight: 500 },
    statusAttended: { color: '#06b6d4', fontWeight: 500 },
    statusWon: { color: '#10b981', fontWeight: 500 },
    statusLost: { color: '#ef4444', fontWeight: 500 },
    actionsBtn: {
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold' as const,
        textAlign: 'right' as const,
    },
    inlineSelect: {
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        fontSize: '12px',
        outline: 'none',
    }
};

export const LeadsTable: React.FC = () => {
    const [leads, setLeads] = useState<ILead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

    const baseUrl = '/api/leads';

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/get-lead`);
            const result = await response.json();
            if (result.success) {
                setLeads(result.data);
            }
        } catch (error) {
            console.error('Ошибка при загрузке лидов:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleCreateLead = async (dto: ICreateLeadDto) => {
        try {
            const response = await fetch(`${baseUrl}/create-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto),
            });
            const result = await response.json();
            if (result.success) {
                await fetchLeads();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Ошибка создания лида:', error);
        }
    };

    const handleStatusChange = async (id: number, nextStatus: ILead['status']) => {
        let loss_reason_id: number | null = null;

        if (nextStatus === 'lost') {
            const reasonInput = prompt(
                'Укажите ID причины отказа:\n1 - Too expensive\n2 - Inconvenient schedule\n3 - Chose competitors\n4 - Not interested'
            );
            if (!reasonInput) return;
            loss_reason_id = parseInt(reasonInput, 10);
            if (isNaN(loss_reason_id)) {
                alert('Некорректный ID причины');
                return;
            }
        }

        try {
            const response = await fetch(`${baseUrl}/update-lead/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus, loss_reason_id }),
            });
            const result = await response.json();

            alert(result.message);
            await fetchLeads();
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
        }
    };

    const handleDeleteLead = async () => {
        if (!selectedLeadId) return;
        if (!confirm('Вы уверены, что хотите удалить выбранного лида?')) return;

        try {
            const response = await fetch(`${baseUrl}/delete-lead/${selectedLeadId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                setSelectedLeadId(null);
                await fetchLeads();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Ошибка при удалении лида:', error);
        }
    };

    const getInitials = (name: string) => {
        return name ? name.slice(0, 2).toUpperCase() : 'LD';
    };

    const getStatusStyle = (status: ILead['status']) => {
        switch (status) {
            case 'new': return styles.statusNew;
            case 'in_progress': return styles.statusProgress;
            case 'trial_scheduled': return styles.statusScheduled;
            case 'trial_attended': return styles.statusAttended;
            case 'won': return styles.statusWon;
            case 'lost': return styles.statusLost;
            default: return {};
        }
    };

    const translateStatus = (status: ILead['status']) => {
        switch (status) {
            case 'new': return 'Новый';
            case 'in_progress': return 'В работе';
            case 'trial_scheduled': return 'Пробный назначен';
            case 'trial_attended': return 'Пробный посещен';
            case 'won': return 'Конвертирован (Won)';
            case 'lost': return 'Проигран';
            default: return status;
        }
    };
    return (
        <div style={styles.container}>
            <div style={styles.actionBar}>
                <button
                    style={styles.btnCreate}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    + Добавить
                </button>
                <button
                    style={styles.btnEdit}
                    onClick={() => {
                        if (!selectedLeadId) return alert('Выберите лида из списка для редактирования');
                        const target = leads.find(l => l.id === selectedLeadId);
                        if (target) {
                            const next = prompt('Введите новый статус лида:\nnew, in_progress, trial_scheduled, trial_attended, won, lost', target.status);
                            if (next) handleStatusChange(target.id, next as any);
                        }
                    }}
                >
                    Править
                </button>
                <button
                    style={{
                        ...styles.btnDelete,
                        opacity: selectedLeadId ? 1 : 0.6,
                        cursor: selectedLeadId ? 'pointer' : 'not-allowed'
                    }}
                    onClick={handleDeleteLead}
                    disabled={!selectedLeadId}
                >
                    Удалить
                </button>
            </div>

            <div style={styles.tableWrapper}>
                <div style={styles.headerRow}>
                    <div>ЛИД / ПОТЕНЦИАЛЬНЫЙ КЛИЕНТ</div>
                    <div>ИСТОЧНИК</div>
                    <div>КОНТАКТЫ</div>
                    <div>ЗАМЕТКИ МЕНЕДЖЕРА</div>
                    <div>СТАТУС ВОРОНКИ</div>
                    <div>БЫСТРАЯ СМЕНА ЭТАПА</div>
                    <div style={{ textAlign: 'right' }}>ДЕЙСТВИЯ</div>
                </div>

                {loading && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Загрузка списка лидов...
                    </div>
                )}

                {!loading && leads.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Список лидов пуст. Нажмите «+ Добавить», чтобы создать первую запись.
                    </div>
                )}

                {!loading && leads.map((lead) => {
                    const isSelected = lead.id === selectedLeadId;
                    return (
                        <div
                            key={lead.id}
                            style={{
                                ...styles.row,
                                ...(isSelected ? styles.rowSelected : {})
                            }}
                            onClick={() => setSelectedLeadId(lead.id === selectedLeadId ? null : lead.id)}
                        >
                            <div style={styles.clientCell}>
                                <div style={styles.avatarCircle}>
                                    {getInitials(lead.name)}
                                </div>
                                <span style={styles.clientName}>{lead.name}</span>
                            </div>

                            <div>
                                <span style={styles.sourceTag}>
                                    {lead.source || 'Не указан'}
                                </span>
                            </div>

                            <div style={{ color: '#475569', fontWeight: 500 }}>
                                {lead.contact}
                            </div>

                            <div style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingRight: '10px' }} title={lead.description || ''}>
                                {lead.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Нет заметок</span>}
                            </div>

                            <div style={getStatusStyle(lead.status)}>
                                • {translateStatus(lead.status)}
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                                <select
                                    style={styles.inlineSelect}
                                    value={lead.status}
                                    onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                                >
                                    <option value="new">Новый</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="trial_scheduled">Пробный назначен</option>
                                    <option value="trial_attended">Пробный посещен</option>
                                    <option value="won">Выигран (Won)</option>
                                    <option value="lost">Проигран (Lost)</option>
                                </select>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <button
                                    style={styles.actionsBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLeadId(lead.id);
                                    }}
                                >
                                    •••
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateLead}
            />
        </div>
    );
};