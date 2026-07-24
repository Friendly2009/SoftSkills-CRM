import React from "react";
import { MoreActionProps } from "@/interfaces/clientsInterfaces.ts";
export const MoreAction: React.FC<MoreActionProps> = ({ x, y, client, isOpen, onDelete, onClose }) => {
    if (!isOpen) return null;

    const isNearRightEdge = x > window.innerWidth - 180;
    const isNearBottomEdge = y > window.innerHeight - 200;

    return (
        <div
            style={{
                ...styles.overlay,
                left: `${x}px`,
                top: `${y}px`,
                '--shift-x': isNearRightEdge ? '-100%' : '0%',
                '--shift-y': isNearBottomEdge ? '-100%' : '0%',
            } as React.CSSProperties}
        >
            <button onClick={() => { }} style={{ ...styles.btn, ...styles.btnPrimary }}>
                Открыть
            </button>
            <button onClick={() => { }} style={{ ...styles.btn, ...styles.btnSuccess }}>
                Пополнить
            </button>
            <button onClick={() => { }} style={{ ...styles.btn, ...styles.btnSecondary }}>
                Редактировать
            </button>
            <div style={styles.divider} />
            <button
                onClick={(e) => {
                    e.stopPropagation(); 
                    onDelete(client);   
                    onClose();      
                }}
                style={{ ...styles.btn, ...styles.btnDanger }}
            >
                Удалить
            </button>
        </div>
    );
};


const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: "fixed",
        zIndex: 9999,
        backgroundColor: "#ffffff",
        padding: "6px",
        borderRadius: "10px",
        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1), 0px 0px 1px rgba(0, 0, 0, 0.2)",
        border: "1px solid #e5e5e5",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: "160px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        transform: "translate(var(--shift-x, 0%), var(--shift-y, 0%))",
    },
    btn: {
        padding: "8px 12px",
        fontSize: "13px",
        fontWeight: 500,
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        backgroundColor: "transparent",
        transition: "background-color 0.15s ease",
    },
    btnPrimary: { color: "#0066cc" },
    btnSuccess: { color: "#28a745" },
    btnSecondary: { color: "#495057" },
    btnDanger: { color: "#dc3545" },
    divider: {
        height: "1px",
        backgroundColor: "#eee",
        margin: "4px 6px",
    }
};
