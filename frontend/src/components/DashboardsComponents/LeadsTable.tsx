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
    btnEdit: (isActive: boolean) => ({
        backgroundColor: isActive ? '#1d3557' : '#e2f0fd',
        color: isActive ? '#ffffff' : '#1d3557',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
        transition: 'all 0.2s ease',
    }),
    btnDelete: (isActive: boolean) => ({
        backgroundColor: isActive ? '#c62828' : '#ffebee',
        color: isActive ? '#ffffff' : '#c62828',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
        transition: 'all 0.2s ease',
    }),
    tableWrapper: {
        border: '1px solid #eef2f5',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
    },
    headerRow: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr 0.5fr',
        backgroundColor: '#f8fafc',
        padding: '12px 16px',
        borderBottom: '1px solid #eef2f5',
        color: '#8a99a8',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    row: (isDelete: boolean, isEdit: boolean) => ({
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr 0.5fr',
        padding: '14px 16px',
        borderBottom: '1px solid #eef2f5',
        alignItems: 'center',
        fontSize: '13px',
        color: '#2c3e50',
        backgroundColor: '#ffffff',
        transition: 'background-color 0.2s',
        cursor: isDelete || isEdit ? 'pointer' : 'default',
        ':hover': {
            backgroundColor: isDelete ? '#fff5f5' : isEdit ? '#f0f7ff' : '#ffffff'
        }
    }),
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
    overlay: {
        position: 'fixed' as const,
        top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#ffffff',
        border: '1px solid #eef2f5',
        borderRadius: '12px',
        padding: '24px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        color: '#2c3e50',
    },
    title: {
        margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1d3557',
        borderBottom: '1px solid #eef2f5', paddingBottom: '12px'
    },
    formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column' as const, gap: '6px' },
    label: { fontSize: '14px', fontWeight: 500, color: '#64748b' },
    input: { backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', color: '#334155', fontSize: '14px', outline: 'none' },
    textarea: { backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', color: '#334155', fontSize: '14px', minHeight: '80px', resize: 'vertical' as const, outline: 'none' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #eef2f5', paddingTop: '16px' },
    btnCancel: { backgroundColor: '#f1f5f9', border: 'none', color: '#475569', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    btnSubmit: { backgroundColor: '#1d3557', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }
};

export const LeadsTable: React.FC = () => {
    const [leads, setLeads] = useState<ILead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isReSetMode, setIsReSetMode] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReSetModalWinOpen, setIsReSetModalWinOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        source: '',
        description: ''
    });

    const [resetFormData, setResetFormData] = useState({
        id: 0,
        name: '',
        contact: '',
        status: 'new',
        source: '',
        loss_reason_id: '' as string | number,
        description: ''
    });

    const getLeads = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:3000/get-lead", {
                credentials: "include"
            });
            if (!response.ok) throw new Error('Something went wrong');

            const data = await response.json();
            setLeads(data.data || []);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getLeads();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setResetFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3000/create-lead", {
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
            setIsModalOpen(false);
            setFormData({ name: '', contact: '', source: '', description: '' });
            getLeads();
        } catch (error) {
            console.error(error);
            alert("Произошла ошибка при сохранении лида.");
        }
    };

    const handleResetFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (resetFormData.status === 'lost' && !resetFormData.loss_reason_id) {
            alert("Пожалуйста, выберите причину отказа!");
            return;
        }

        try {
            const payload = {
                ...resetFormData,
                loss_reason_id: resetFormData.status === 'lost' ? Number(resetFormData.loss_reason_id) : null
            };

            const response = await fetch(`http://localhost:3000/update-lead/${resetFormData.id}`, {
                credentials: "include",
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

            setIsReSetModalWinOpen(false);
            setIsReSetMode(false);
            getLeads();
        } catch (error) {
            console.error(error);
            alert("Произошла ошибка при обновлении данных лида.");
        }
    };

    const handleRowClick = async (lead: ILead) => {
        if (isDeleteMode) {
            if (!window.confirm(`Вы действительно хотите удалить лида ${lead.name}?`)) {
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/delete-lead/${lead.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    setLeads(prev => prev.filter(l => l.id !== lead.id));
                } else {
                    alert(result.message || "Ошибка при удалении");
                }
            } catch (error) {
                console.error(error);
                alert("Не удалось выполнить удаление.");
            } finally {
                setIsDeleteMode(false);
            }
        }

        if (isReSetMode) {
            setIsDeleteMode(false);

            setResetFormData({
                id: lead.id,
                name: lead.name,
                contact: lead.contact,
                status: lead.status,
                source: lead.source || '',
                loss_reason_id: lead.loss_reason_id || '',
                description: lead.description || ''
            });

            setIsReSetModalWinOpen(true);
        }
    };

    const handlePlusClick = () => { setIsModalOpen(true); };
    const handleResetClick = () => { setIsReSetMode(prev => !prev); setIsDeleteMode(false); };
    const handleDelClick = () => { setIsDeleteMode(prev => !prev); setIsReSetMode(false); };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'LD';
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
            case 'won': return 'Активен (Won)';
            case 'lost': return 'Проигран';
            default: return status;
        }
    };
    return (
        <div style={styles.container}>
            <div style={styles.actionBar}>
                <button
                    style={styles.btnCreate}
                    onClick={handlePlusClick}
                >
                    + Добавить
                </button>
                <button
                    style={styles.btnEdit(isReSetMode)}
                    onClick={handleResetClick}
                >
                    {isReSetMode ? 'Выбор лида...' : 'Править'}
                </button>
                <button
                    style={styles.btnDelete(isDeleteMode)}
                    onClick={handleDelClick}
                >
                    {isDeleteMode ? 'Выберите кого удалить' : 'Удалить'}
                </button>
            </div>

            <div style={styles.tableWrapper}>
                <div style={styles.headerRow}>
                    <div>ЛИД / ПОТЕНЦИАЛЬНЫЙ КЛИЕНТ</div>
                    <div>ИСТОЧНИК</div>
                    <div>КОНТАКТЫ</div>
                    <div>ЗАМЕТКИ МЕНЕДЖЕРА</div>
                    <div>СТАТУС ВОРОНКИ</div>
                    <div style={{ textAlign: 'right' }}>ДЕЙСТВИЯ</div>
                </div>

                {loading && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Загрузка списка лидов...
                    </div>
                )}

                {!loading && leads.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Список лидов пуст.
                    </div>
                )}

                {!loading && leads.map((lead) => (
                    <div
                        key={lead.id}
                        style={styles.row(isDeleteMode, isReSetMode)}
                        onClick={() => handleRowClick(lead)}
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
                            {translateStatus(lead.status)}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button style={styles.actionsBtn}>•••</button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.title}>Добавить нового лида</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Имя лида *</label>
                                <input type="text" name="name" style={styles.input} value={formData.name} onChange={handleInputChange} required placeholder="Иван Иванов" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Контакты *</label>
                                <input type="text" name="contact" style={styles.input} value={formData.contact} onChange={handleInputChange} required placeholder="Телефон или Telegram" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Источник</label>
                                <select name="source" style={styles.input} value={formData.source} onChange={handleInputChange}>
                                    <option value="">Выберите источник...</option>
                                    <option value="Website">Сайт</option>
                                    <option value="VK">ВКонтакте</option>
                                    <option value="Telegram">Telegram</option>
                                    <option value="Recommendation">Рекомендация</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Заметки менеджера</label>
                                <textarea name="description" style={styles.textarea} value={formData.description} onChange={handleInputChange} placeholder="Дополнительная информация..." />
                            </div>
                            <div style={styles.actions}>
                                <button type="button" style={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Отмена</button>
                                <button type="submit" style={styles.btnSubmit}>Создать лид</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isReSetModalWinOpen && (
                <div style={styles.overlay} onClick={() => { setIsReSetModalWinOpen(false); setIsReSetMode(false); }}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={styles.title}>Редактирование лида</h3>
                        <form onSubmit={handleResetFormSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Имя лида</label>
                                <input type="text" name="name" style={styles.input} value={resetFormData.name} onChange={handleResetInputChange} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Контакты</label>
                                <input type="text" name="contact" style={styles.input} value={resetFormData.contact} onChange={handleResetInputChange} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Источник</label>
                                <input type="text" name="source" style={styles.input} value={resetFormData.source} onChange={handleResetInputChange} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Статус воронки</label>
                                <select name="status" style={styles.input} value={resetFormData.status} onChange={handleResetInputChange}>
                                    <option value="new">Новый</option>
                                    <option value="in_progress">В работе</option>
                                    <option value="trial_scheduled">Пробный назначен</option>
                                    <option value="trial_attended">Пробный посещен</option>
                                    <option value="won">Выигран</option>
                                    <option value="lost">Проигран</option>
                                </select>
                            </div>

                            {resetFormData.status === 'lost' && (
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Причина отказа *</label>
                                    <select name="loss_reason_id" style={styles.input} value={resetFormData.loss_reason_id} onChange={handleResetInputChange} required>
                                        <option value="">Выберите причину...</option>
                                        <option value="1">Too expensive (Дорого)</option>
                                        <option value="2">Inconvenient schedule (Неудобно)</option>
                                        <option value="3">Chose competitors (Конкуренты)</option>
                                        <option value="4">Not interested (Передумал)</option>
                                    </select>
                                </div>
                            )}

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Заметки менеджера</label>
                                <textarea name="description" style={styles.textarea} value={resetFormData.description} onChange={handleResetInputChange} />
                            </div>
                            <div style={styles.actions}>
                                <button type="button" style={styles.btnCancel} onClick={() => { setIsReSetModalWinOpen(false); setIsReSetMode(false); }}>Отмена</button>
                                <button type="submit" style={styles.btnSubmit}>Сохранить изменения</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};