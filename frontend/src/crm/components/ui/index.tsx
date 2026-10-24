import {
  useEffect,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { X } from "lucide-react";
import type { Field, RecordDraft } from "../../interfaces/common";
import { useCrm } from "../../mocks/store/CrmProvider";
export function Button({
  children,
  primary = false,
  danger = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`crm-button ${primary ? "primary" : ""} ${danger ? "danger" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const { pending } = useCrm();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = () => { if (!pending) onClose(); };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const root = panel.current;
    root?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
      }
      if (e.key === "Tab") {
        const items = root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
        );
        if (!items?.length) {
          e.preventDefault();
          return;
        }
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === root)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="crm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`crm-modal ${wide ? "wide" : ""}`}
      >
        <header>
          <h2>{title}</h2>
          <Button aria-label="Закрыть" onClick={onClose}>
            <X size={17} />
          </Button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
export function FormFields({
  fields,
  draft,
  setDraft,
}: {
  fields: Field[];
  draft: RecordDraft;
  setDraft: (d: RecordDraft) => void;
}) {
  const { db } = useCrm();
  return (
    <div className="crm-form">
      {fields.map((f) => (
        <label key={f.key}>
          <span>
            {f.label}
            {f.required && <b className="text-red-500"> *</b>}
          </span>
          {f.relation || f.options || f.dictionary ? (
            <select
              required={f.required}
              value={String(draft[f.key] ?? "")}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            >
              <option value="">Не выбрано</option>
              {f.relation
                ? db.records[f.relation]
                    .filter(
                      (r) => r.status !== "Архив" || r.id === draft[f.key],
                    )
                    .map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name}
                      </option>
                    ))
                : (f.dictionary
                    ? (db.dictionaries[f.dictionary] || []).map((i) => i.name)
                    : f.options
                  )?.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              value={String(draft[f.key] ?? "")}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            />
          ) : (
            <input
              type={f.type || "text"}
              required={f.required}
              min={f.min}
              step={f.step}
              checked={
                f.type === "checkbox" ? Boolean(draft[f.key]) : undefined
              }
              value={String(draft[f.key] ?? "")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [f.key]:
                    f.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : f.type === "checkbox"
                        ? e.target.checked
                        : e.target.value,
                })
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className={`crm-badge ${/Архив|Отказ|Отмен|Заблок/.test(String(children)) ? "muted" : /Проб|Нов|набор|Заплан/.test(String(children)) ? "amber" : ""}`}
    >
      {children}
    </span>
  );
}
export function Empty({
  text = "По выбранным условиям ничего не найдено",
}: {
  text?: string;
}) {
  return <div className="p-12 text-center text-slate-400">{text}</div>;
}
