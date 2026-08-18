import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const styles = {
    container: {
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '20px',
        backgroundColor: '#ffffff',
    },
    boardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)', // 5 колонок воронки (won и lost объединим или выведем отдельно)
        gap: '16px',
        alignItems: 'start',
    },
    column: {
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '12px',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    columnHeader: (status: string) => {
        const colors: Record<string, string> = {
            new: '#0369a1',
            in_progress: '#d97706',
            trial_scheduled: '#7e22ce',
            trial_attended: '#0891b2',
            won: '#15803d',
            lost: '#b91c1c'
        };
        return {
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            color: colors[status] || '#475569',
            letterSpacing: '0.5px',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
        };
    },
    card: (isDragging: boolean) => ({
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '12px',
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        cursor: 'grab',
        transition: 'box-shadow 0.15s ease',
    }),
    cardName: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#1e3d59',
        marginBottom: '4px',
    },
    cardContact: {
        fontSize: '12px',
        color: '#475569',
        fontWeight: 500,
        marginBottom: '8px',
    },
    cardSource: {
        display: 'inline-flex',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 600,
        backgroundColor: '#f1f5f9',
        color: '#475569',
    },
    /* Стили светлой модалки для причины отказа */
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
        width: '100%', maxWidth: '400px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '24px',
    },
    formInput: {
        width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontSize: '13px', color: '#334155', outline: 'none', margin: '12px 0 20px 0'
    },
    btnPrimary: {
        background: '#0369a1', color: '#ffffff', border: 'none',
        padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    }
};

export const LeadKanban: React.FC = () => {
    const COLUMNS: Array<{ id: string; title: string }> = [
        { id: 'new', title: 'Новый' },
        { id: 'in_progress', title: 'В работе' },
        { id: 'trial_scheduled', title: 'Пробный назначен' },
        { id: 'trial_attended', title: 'Пробный посещен' },
        { id: 'won', title: 'Выигран (Won)' },
        { id: 'lost', title: 'Проигран (Lost)' }
    ];

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [isLossModalOpen, setIsLossModalOpen] = useState<boolean>(false);
    const [pendingDragData, setPendingDragData] = useState<{ leadId: number; nextStatus: string } | null>(null);
    const [lossReasonId, setLossReasonId] = useState<string>('');

    const getLeads = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:3000/get-lead", {
                credentials: "include"
            });
            if (!response.ok) throw new Error('Ошибка загрузки лидов для Канбана');
            const data = await response.json();
            setLeads(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getLeads();
    }, []);

    const updateLeadStatusInDb = async (id: number, nextStatus: string, reasonId: number | null = null) => {
        try {
            const response = await fetch(`http://localhost:3000/update-lead/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: nextStatus, loss_reason_id: reasonId }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                alert(result.message);
                await getLeads(); 
            } else {
                alert(result.message || "Ошибка обновления");
                await getLeads(); 
            }
        } catch (error) {
            console.error(error);
            await getLeads();
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const leadId = parseInt(draggableId, 10);
        const nextStatus = destination.droppableId;

        setLeads(prevLeads =>
            prevLeads.map(lead => lead.id === leadId ? { ...lead, status: nextStatus } : lead)
        );

        if (nextStatus === 'lost') {
            setPendingDragData({ leadId, nextStatus });
            setIsLossModalOpen(true);
            return;
        }

        await updateLeadStatusInDb(leadId, nextStatus);
    };

    const handleLossSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingDragData || !lossReasonId) return;

        const { leadId, nextStatus } = pendingDragData;
        setIsLossModalOpen(false);

        await updateLeadStatusInDb(leadId, nextStatus, Number(lossReasonId));

        setPendingDragData(null);
        setLossReasonId('');
    };

    const handleLossCancel = async () => {
        setIsLossModalOpen(false);
        setPendingDragData(null);
        setLossReasonId('');
        await getLeads(); 
    };

    return (
        <div style={styles.container}>
            {loading && leads.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Загрузка воронки лидов...
                </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={styles.boardGrid}>
                    {COLUMNS.map((column) => {
                        const columnLeads = leads.filter(l => l.status === column.id);

                        return (
                            <div key={column.id} style={styles.column}>
                                <div style={styles.columnHeader(column.id)}>
                                    <span>{column.title}</span>
                                    <span style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', color: '#475569', fontSize: '11px' }}>
                                        {columnLeads.length}
                                    </span>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{ flexGrow: 1, minHeight: '450px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                                        >
                                            {columnLeads.map((lead, index) => (
                                                <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...styles.card(snapshot.isDragging),
                                                                ...provided.draggableProps.style 
                                                            }}
                                                        >
                                                            <div style={styles.cardName}>{lead.name}</div>
                                                            <div style={styles.cardContact}>{lead.contact}</div>
                                                            <div>
                                                                <span style={styles.cardSource}>{lead.source || 'Не указан'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {isLossModalOpen && (
                <div style={styles.modalOverlay} onClick={handleLossCancel}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#1e3d59', fontFamily: "'Inter', system-ui, sans-serif" }}>
                            Укажите причину отказа
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontFamily: "'Inter', system-ui, sans-serif" }}>
                            Лид перемещается в архив воронки со статусом «Проигран». Пожалуйста, зафиксируйте причину:
                        </p>

                        <form onSubmit={handleLossSubmit}>
                            <select
                                style={styles.formInput}
                                value={lossReasonId}
                                onChange={(e) => setLossReasonId(e.target.value)}
                                required
                            >
                                <option value="">Выберите причину...</option>
                                <option value="1">Too expensive (Дорого)</option>
                                <option value="2">Inconvenient schedule (Неудобно)</option>
                                <option value="3">Chose competitors (Конкуренты)</option>
                                <option value="4">Not interested (Передумал)</option>
                            </select>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={handleLossCancel}>
                                    Отмена
                                </button>
                                <button type="submit" style={styles.btnPrimary}>
                                    Подтвердить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
