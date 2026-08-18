import { ILead } from '@/interfaces/LeadInterfaces';
import React, { useState, useEffect } from 'react';
import { LeadKanban } from './LeadComponents/Kanban';
const styles = {
    tableContainer: {
        width: '100%',
        overflowX: 'auto' as const,
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    crmTable: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        textAlign: 'left' as const,
        fontSize: '13px',
        color: '#334155',
    },
    th: {
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontWeight: 600,
        padding: '12px 16px',
        borderBottom: '2px solid #e2e8f0',
        textTransform: 'uppercase' as const,
        fontSize: '11px',
        letterSpacing: '0.5px',
    },
    td: (isDeleteMode: boolean, isReSetMode: boolean) => ({
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        verticalAlign: 'middle',
        cursor: isDeleteMode || isReSetMode ? 'pointer' : 'default',
    }),
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatarPlaceholder: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        color: '#475569',
    },
    userFullname: {
        fontWeight: 600,
        color: '#1e3d59',
    },
    // Стильные бэйджи статусов на основе ваших .badge классов
    badge: (status: string) => {
        const config: Record<string, { bg: string; color: string }> = {
            new: { bg: '#e0f2fe', color: '#0369a1' },          // Голубой
            in_progress: { bg: '#fef3c7', color: '#d97706' },  // Янтарный
            trial_scheduled: { bg: '#f3e8ff', color: '#7e22ce' }, // Фиолетовый
            trial_attended: { bg: '#ecfeff', color: '#0891b2' },  // Бирюзовый
            won: { bg: '#dcfce7', color: '#15803d' },          // Зеленый
            lost: { bg: '#fee2e2', color: '#b91c1c' },         // Красный
        };
        const current = config[status] || { bg: '#f1f5f9', color: '#475569' };
        return {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: current.bg,
            color: current.color,
        };
    },
    sourceBadge: {
        display: 'inline-flex',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: '#f1f5f9',
        color: '#475569',
    },
    textMuted: {
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    actionsCell: {
        textAlign: 'right' as const,
    },
    // Конфигурация кнопок панели инструментов
    btnBlue: (isActive: boolean) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '34px',
        padding: '0 14px',
        fontSize: '13px',
        fontWeight: 500,
        border: '1px solid transparent',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#12293f' : '#1e3d59', // Имитируем var(--alfa-primary)
        color: '#ffffff',
        marginBottom: '10px', marginRight: '5px', marginLeft: '5px',
    }),
    btnLightBlue: (isActive: boolean) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '34px',
        padding: '0 14px',
        fontSize: '13px',
        fontWeight: 500,
        border: '1px solid transparent',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#bae6fd' : '#e0f2fe',
        color: '#0369a1',
        marginBottom: '10px', marginRight: '5px', marginLeft: '5px',
    }),
    btnRed: (isActive: boolean) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '34px',
        padding: '0 14px',
        fontSize: '13px',
        fontWeight: 500,
        border: '1px solid transparent',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#fecaca' : '#fee2e2',
        color: '#b91c1c',
        marginBottom: '10px', marginRight: '5px', marginLeft: '5px',
    }),
    btnAction: {
        background: 'none',
        border: '1px solid transparent',
        borderRadius: '6px',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '6px 10px',
    },
    /*----------------------- Модальные окна (Светлые) ------------------------------*/
    modalOverlay: {
        position: 'fixed' as const,
        top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
    },
    modalContent: {
        background: '#ffffff',
        width: '100%', maxWidth: '480px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '24px',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    modalHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px',
    },
    modalHeaderTitle: {
        margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e3d59',
    },
    btnClose: {
        background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8',
        cursor: 'pointer', padding: '4px', lineHeight: 1,
    },
    formGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
        marginBottom: '24px',
    },
    formGroup: {
        display: 'flex', flexDirection: 'column' as const, gap: '6px',
    },
    fullWidth: {
        gridColumn: 'span 2',
    },
    formGroupLabel: {
        fontSize: '11px', fontWeight: 600, color: '#64748b',
        textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    },
    formInput: {
        width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontSize: '13px', color: '#334155',
        backgroundColor: '#ffffff', boxSizing: 'border-box' as const, outline: 'none',
    },
    formActions: {
        display: 'flex', justifyContent: 'flex-end', gap: '12px',
        borderTop: '1px solid #f1f5f9', paddingTop: '16px',
    },
    btnSecondary: {
        background: '#f1f5f9', color: '#475569', border: 'none',
        padding: '8px 16px', borderRadius: '6px', fontSize: '13px',
        fontWeight: 600, cursor: 'pointer',
    },
    btnPrimary: {
        background: '#0369a1', color: '#ffffff', border: 'none',
        padding: '8px 16px', borderRadius: '6px', fontSize: '13px',
        fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    }
};

export const LeadsTable: React.FC = () => {
    const [leads, setLeads] = useState<ILead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isReSetMode, setIsReSetMode] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReSetModalWinOpen, setIsReSetModalWinOpen] = useState(false);

    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

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
        <div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
                <button style={styles.btnBlue(false)} onClick={handlePlusClick}>
                    + Добавить
                </button>
                <button style={styles.btnLightBlue(isReSetMode)} onClick={handleResetClick}>
                    {isReSetMode ? 'Выбор лида...' : 'Править'}
                </button>
                <button style={styles.btnRed(isDeleteMode)} onClick={handleDelClick}>
                    {isDeleteMode ? 'Выберите лида' : 'Удалить'}
                </button>

                <div style={{ marginRight: 'auto' }}></div>

                <button
                    style={styles.btnLightBlue(viewMode === 'table')}
                    onClick={() => setViewMode('table')}
                >
                    Список
                </button>
                <button
                    style={styles.btnLightBlue(viewMode === 'kanban')}
                    onClick={() => setViewMode('kanban')}
                >
                    Канбан
                </button>
            </div>


            {viewMode === 'table' && (
                <>
                    <div style={styles.tableContainer}>
                        <table style={styles.crmTable}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Лид / Потенциальный клиент</th>
                                    <th style={styles.th}>Источник</th>
                                    <th style={styles.th}>Контакты</th>
                                    <th style={styles.th}>Заметки менеджера</th>
                                    <th style={styles.th}>Статус воронки</th>
                                    <th style={{ ...styles.th, textAlign: 'right' }}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                            Загрузка списка лидов...
                                        </td>
                                    </tr>
                                )}
                                {!loading && leads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                            Список лидов пуст.
                                        </td>
                                    </tr>
                                )}
                                {!loading && leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => handleRowClick(lead)}
                                        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}
                                    >
                                        <td style={styles.td(isDeleteMode, isReSetMode)}>
                                            <div style={styles.userInfo}>
                                                <div style={styles.avatarPlaceholder}>
                                                    {getInitials(lead.name)}
                                                </div>
                                                <span style={styles.userFullname}>{lead.name}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td(isDeleteMode, isReSetMode)}>
                                            <span style={styles.sourceBadge}>{lead.source || 'Не указан'}</span>
                                        </td>
                                        <td style={styles.td(isDeleteMode, isReSetMode)}>{lead.contact}</td>
                                        <td style={styles.td(isDeleteMode, isReSetMode)}>
                                            {lead.description ? (
                                                <span style={{ color: '#334155' }}>{lead.description}</span>
                                            ) : (
                                                <span style={styles.textMuted}>Нет заметок</span>
                                            )}
                                        </td>
                                        <td style={styles.td(isDeleteMode, isReSetMode)}>
                                            <span style={styles.badge(lead.status)}>
                                                {translateStatus(lead.status)}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td(isDeleteMode, isReSetMode), ...styles.actionsCell }}>
                                            <button style={styles.btnAction}>•••</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {isModalOpen && (
                        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <div style={styles.modalHeader}>
                                    <h3 style={styles.modalHeaderTitle}>Добавить нового лида</h3>
                                    <button style={styles.btnClose} onClick={() => setIsModalOpen(false)}>×</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div style={styles.formGrid}>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Имя лида *</label>
                                            <input type="text" name="name" style={styles.formInput} value={formData.name} onChange={handleInputChange} required placeholder="Иван Иванов" />
                                        </div>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Контакты *</label>
                                            <input type="text" name="contact" style={styles.formInput} value={formData.contact} onChange={handleInputChange} required placeholder="Телефон или Telegram" />
                                        </div>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Источник</label>
                                            <select name="source" style={styles.formInput} value={formData.source} onChange={handleInputChange}>
                                                <option value="">Выберите источник...</option>
                                                <option value="Website">Сайт</option>
                                                <option value="VK">ВКонтакте</option>
                                                <option value="Telegram">Telegram</option>
                                                <option value="Recommendation">Рекомендация</option>
                                            </select>
                                        </div>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Заметки менеджера</label>
                                            <textarea name="description" style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }} value={formData.description} onChange={handleInputChange} placeholder="Дополнительная информация..." />
                                        </div>
                                    </div>
                                    <div style={styles.formActions}>
                                        <button type="button" style={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Отмена</button>
                                        <button type="submit" style={styles.btnPrimary}>Создать</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    {isReSetModalWinOpen && (
                        <div style={styles.modalOverlay} onClick={() => { setIsReSetModalWinOpen(false); setIsReSetMode(false); }}>
                            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <div style={styles.modalHeader}>
                                    <h3 style={styles.modalHeaderTitle}>Редактирование лида</h3>
                                    <button style={styles.btnClose} onClick={() => { setIsReSetModalWinOpen(false); setIsReSetMode(false); }}>×</button>
                                </div>
                                <form onSubmit={handleResetFormSubmit}>
                                    <div style={styles.formGrid}>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Имя лида</label>
                                            <input type="text" name="name" style={styles.formInput} value={resetFormData.name} onChange={handleResetInputChange} required />
                                        </div>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Контакты</label>
                                            <input type="text" name="contact" style={styles.formInput} value={resetFormData.contact} onChange={handleResetInputChange} required />
                                        </div>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Источник</label>
                                            <input type="text" name="source" style={styles.formInput} value={resetFormData.source} onChange={handleResetInputChange} />
                                        </div>
                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Статус воронки</label>
                                            <select name="status" style={styles.formInput} value={resetFormData.status} onChange={handleResetInputChange}>
                                                <option value="new">Новый</option>
                                                <option value="in_progress">В работе</option>
                                                <option value="trial_scheduled">Пробный назначен</option>
                                                <option value="trial_attended">Пробный посещен</option>
                                                <option value="won">Выигран</option>
                                                <option value="lost">Проигран</option>
                                            </select>
                                        </div>

                                        {resetFormData.status === 'lost' && (
                                            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                                <label style={styles.formGroupLabel}>Причина отказа *</label>
                                                <select name="loss_reason_id" style={styles.formInput} value={resetFormData.loss_reason_id} onChange={handleResetInputChange} required>
                                                    <option value="">Выберите причину...</option>
                                                    <option value="1">Дорого</option>
                                                    <option value="2">Неудобное расписание</option>
                                                    <option value="3">Выбрал конкурентов</option>
                                                    <option value="4">Передумал</option>
                                                </select>
                                            </div>
                                        )}

                                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                                            <label style={styles.formGroupLabel}>Заметки менеджера</label>
                                            <textarea name="description" style={{ ...styles.formInput, minHeight: '80px', resize: 'vertical' }} value={resetFormData.description} onChange={handleResetInputChange} />
                                        </div>
                                    </div>
                                    <div style={styles.formActions}>
                                        <button type="button" style={styles.btnSecondary} onClick={() => { setIsReSetModalWinOpen(false); setIsReSetMode(false); }}>Отмена</button>
                                        <button type="submit" style={styles.btnPrimary}>Сохранить</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
            {viewMode === 'kanban' && (
                <LeadKanban></LeadKanban>
            )}
        </div>
    )
};