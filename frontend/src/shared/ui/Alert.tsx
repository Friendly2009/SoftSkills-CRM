import type { ReactNode } from "react";
export function Alert({
  children,
  onRetry,
}: {
  children: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="ui-alert" role="alert">
      {children}
      {onRetry && (
        <button type="button" className="ui-button" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  children = "Записей пока нет",
}: {
  children?: ReactNode;
}) {
  return (
    <p className="ui-empty" role="status">
      {children}
    </p>
  );
}
