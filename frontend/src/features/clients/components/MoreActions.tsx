import type { MoreActionProps } from "@/shared/types/clientsInterfaces";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
export function MoreAction({
  x,
  y,
  client,
  isOpen,
  onClose,
  onDelete,
  onTopUp,
  onEdit,
}: MoreActionProps) {
  const navigate = useNavigate();
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    menu.current?.querySelector("button")?.focus();
    const close = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
      previous?.focus();
    };
  }, [isOpen, onClose]);
  if (!isOpen || !client) return null;
  const action = (callback: () => void) => {
    onClose();
    callback();
  };
  return createPortal(
    <div
      ref={menu}
      className="ui-context-menu"
      aria-label="Действия с клиентом"
      style={{
        left: Math.max(8, Math.min(x, window.innerWidth - 208)),
        top: Math.max(8, Math.min(y, window.innerHeight - 208)),
      }}
    >
      <button
        onClick={() => action(() => navigate(`/dashboard/client/${client.id}`))}
      >
        Открыть
      </button>
      {onTopUp && (
        <button onClick={() => action(() => onTopUp(client))}>Пополнить</button>
      )}
      {onEdit && (
        <button onClick={() => action(() => onEdit(client))}>
          Редактировать
        </button>
      )}
      {onDelete && (
        <button
          className="text-danger"
          onClick={() => action(() => onDelete(client))}
        >
          Удалить
        </button>
      )}
    </div>,
    document.body,
  );
}
