import { ModalFrame } from "@/shared/ui/ModalFrame";
import { useId } from "react";
import { styles } from "../styles";
import { useLeads } from "../useLeads";
type Props = ReturnType<typeof useLeads>;
export function CreateLeadDialog({
  pending,
  setIsModalOpen,
  formData,
  handleInputChange,
  handleSubmit,
}: Props) {
  const fieldId = useId();
  return (
    <ModalFrame onClose={() => setIsModalOpen(false)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalHeaderTitle}>Добавить нового лида</h3>
          <button style={styles.btnClose} onClick={() => setIsModalOpen(false)}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-1"}>
                Имя лида *
              </label>
              <input
                id={fieldId + "-1"}
                type="text"
                name="name"
                style={styles.formInput}
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Иван Иванов"
              />
            </div>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-2"}>
                Контакты *
              </label>
              <input
                id={fieldId + "-2"}
                type="text"
                name="contact"
                style={styles.formInput}
                value={formData.contact}
                onChange={handleInputChange}
                required
                placeholder="Телефон или Telegram"
              />
            </div>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-3"}>
                Источник
              </label>
              <select
                id={fieldId + "-3"}
                name="source"
                style={styles.formInput}
                value={formData.source}
                onChange={handleInputChange}
              >
                <option value="">Выберите источник...</option>
                <option value="Website">Сайт</option>
                <option value="VK">ВКонтакте</option>
                <option value="Telegram">Telegram</option>
                <option value="Recommendation">Рекомендация</option>
              </select>
            </div>
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.formGroupLabel} htmlFor={fieldId + "-4"}>
                Заметки менеджера
              </label>
              <textarea
                id={fieldId + "-4"}
                name="description"
                style={{
                  ...styles.formInput,
                  minHeight: "80px",
                  resize: "vertical",
                }}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.btnSecondary}
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </button>
            <button type="submit" disabled={pending} style={styles.btnPrimary}>
              Создать
            </button>
          </div>
        </form>
      </div>
    </ModalFrame>
  );
}
