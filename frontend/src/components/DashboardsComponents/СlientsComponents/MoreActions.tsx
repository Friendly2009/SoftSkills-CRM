import React from "react";
import { MoreActionProps } from "@/interfaces/clientsInterfaces";
import { useNavigate } from "react-router-dom";

const menuStyles = {
    overlay: {
        position: 'absolute' as const,
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        minWidth: '160px',
        zIndex: 9999,
    },
    btn: {
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        textAlign: 'left' as const,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        backgroundColor: 'transparent',
    },
    btnPrimary: { color: '#1a1a1a' },
    btnSuccess: { color: '#10b981' },
    btnSecondary: { color: '#4b5563' },
    btnDanger: { color: '#ef4444' },
    divider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '4px 0',
    }
};

export const MoreAction: React.FC<MoreActionProps> = ({ x, y, client, isOpen, onDelete, onClose, onTopUp, onEdit, onOpenProfile }) => {
    if (!isOpen) return null;
    const navigate = useNavigate();
    const isNearRightEdge = x > window.innerWidth - 180;
    const isNearBottomEdge = y > window.innerHeight - 200;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                ...menuStyles.overlay,
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(${isNearRightEdge ? '-100%' : '0%'}, ${isNearBottomEdge ? '-100%' : '0%'})`,
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (client) navigate(`/dashboard/client/${client.id}`);
                    onClose();
                }}
                style={{ ...menuStyles.btn, ...menuStyles.btnPrimary }}
            >
                Открыть
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (onTopUp && client) {
                        onTopUp(client);
                    }
                    onClose();
                }}
                style={{ ...menuStyles.btn, ...menuStyles.btnSecondary }}
            >
                Пополнить счет
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit && client) {
                        onEdit(client);
                    }
                    onClose();
                }}
                style={{ ...menuStyles.btn, ...menuStyles.btnSecondary }}
            >
                Редактировать
            </button>

            <div style={menuStyles.divider} />
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(client!);
                    onClose();
                }}
                style={{ ...menuStyles.btn, ...menuStyles.btnDanger }}
            >
                Удалить
            </button>
        </div>
    );
};
