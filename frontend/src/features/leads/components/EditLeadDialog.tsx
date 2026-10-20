import { ModalFrame } from "@/shared/ui/ModalFrame";
import { useId } from "react";
import { styles } from "../styles";
import { useLeads } from "../useLeads";
type Props = ReturnType<typeof useLeads>;
export function EditLeadDialog({
  pending,
  setIsReSetMode,
  setIsReSetModalWinOpen,
  resetFormData,
  handleResetInputChange,
  handleResetFormSubmit,
}: Props) {
  const fieldId = useId();
  return (
    <ModalFrame
      onClose={() => {
        setIsReSetModalWinOpen(false);
        setIsReSetMode(false);
      }}
    >
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalHeaderTitle}>Редактирование лида</h3>
          <button
            style={styles.btnClose}
            onClick={() => {
              setIsReSetModalWinOpen(false);
              setIsReSetMode(false);
            }}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleResetFormSubmit}>
          <div style={styles.formGrid}>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-1"}>
                Имя лида
              </label>
              <input
                id={fieldId + "-1"}
                type="text"
                name="name"
                style={styles.formInput}
                value={resetFormData.name}
                onChange={handleResetInputChange}
                required
              />
            </div>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-2"}>
                Контакты
              </label>
              <input
                id={fieldId + "-2"}
                type="text"
                name="contact"
                style={styles.formInput}
                value={resetFormData.contact}
                onChange={handleResetInputChange}
                required
              />
            </div>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-3"}>
                Источник
              </label>
              <input
                id={fieldId + "-3"}
                type="text"
                name="source"
                style={styles.formInput}
                value={resetFormData.source}
                onChange={handleResetInputChange}
              />
            </div>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-4"}>
                Статус воронки
              </label>
              <select
                id={fieldId + "-4"}
                name="status"
                style={styles.formInput}
                value={resetFormData.status}
                onChange={handleResetInputChange}
              >
                <option value="new">Новый</option>
                <option value="in_progress">В работе</option>
                <option value="trial_scheduled">Пробный назначен</option>
                <option value="trial_attended">Пробный посещен</option>
                <option value="won">Выигран</option>
                <option value="lost">Проигран</option>
              </select>
            </div>

            {resetFormData.status === "lost" && (
              <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                <label style={styles.formGroupLabel} htmlFor={fieldId + "-5"}>
                  Причина отказа *
                </label>
                <select
                  id={fieldId + "-5"}
                  name="loss_reason_id"
                  style={styles.formInput}
                  value={resetFormData.loss_reason_id}
                  onChange={handleResetInputChange}
                  required
                >
                  <option value="">Выберите причину...</option>
                  <option value="1">Дорого</option>
                  <option value="2">Неудобное расписание</option>
                  <option value="3">Выбрал конкурентов</option>
                  <option value="4">Передумал</option>
                </select>
              </div>
            )}

            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-6"}>
                Заметки менеджера
              </label>
              <textarea
                id={fieldId + "-6"}
                name="description"
                style={{
                  ...styles.formInput,
                  minHeight: "80px",
                  resize: "vertical",
                }}
                value={resetFormData.description}
                onChange={handleResetInputChange}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.btnSecondary}
              onClick={() => {
                setIsReSetModalWinOpen(false);
                setIsReSetMode(false);
              }}
            >
              Отмена
            </button>
            <button type="submit" disabled={pending} style={styles.btnPrimary}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </ModalFrame>
  );
}
