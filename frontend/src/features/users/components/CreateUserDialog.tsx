import style from "@/shared/styles/dashboard/user.module.css";
import { ModalFrame } from "@/shared/ui/ModalFrame";
import { useId } from "react";
import { useUsers } from "../useUsers";
type Props = ReturnType<typeof useUsers>;
export function CreateUserDialog({
  pending,
  setIsModalOpen,
  formData,
  handleInputChange,
  handleSubmit,
}: Props) {
  const fieldId = useId();
  return (
    <ModalFrame onClose={() => setIsModalOpen(false)}>
      <div
        className={style["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style["modal-header"]}>
          <h3>Добавить сотрудника</h3>
          <button
            className={style["btn-close"]}
            onClick={() => setIsModalOpen(false)}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={style["form-grid"]}>
            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-1"}>ФИО Сотрудника</label>
              <input
                id={fieldId + "-1"}
                type="text"
                name="full_name"
                required
                className={style["form-input"]}
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Иван Иванов Иванович"
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-2"}>Роль</label>
              <input
                id={fieldId + "-2"}
                name="role"
                type="text"
                className={style["form-input"]}
                value={formData.role}
                onChange={handleInputChange}
              ></input>
            </div>

            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-3"}>Ранг</label>
              <input
                id={fieldId + "-3"}
                type="number"
                name="rank"
                className={style["form-input"]}
                value={formData.rank}
                onChange={handleInputChange}
              />
            </div>

            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-4"}>Эл. почта</label>
              <input
                id={fieldId + "-4"}
                type="email"
                name="email"
                required
                className={style["form-input"]}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="mail@example.com"
              />
            </div>

            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-5"}>Телефон</label>
              <input
                id={fieldId + "-5"}
                type="text"
                name="contact"
                className={style["form-input"]}
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="+79991112233"
              />
            </div>

            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-6"}>Пароль для входа</label>
              <input
                id={fieldId + "-6"}
                type="password"
                name="password"
                className={style["form-input"]}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="•••••••••"
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-7"}>ДР</label>
              <input
                id={fieldId + "-7"}
                type="date"
                name="birthday"
                className={style["form-input"]}
                value={
                  formData.birthday
                    ? formData.birthday.toISOString().split("T")[0]
                    : ""
                }
                onChange={handleInputChange}
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-8"}>Пол</label>
              <select
                id={fieldId + "-8"}
                name="gender"
                className={style["form-input"]}
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="Муж">Муж</option>
                <option value="Жен">Жен</option>
              </select>
            </div>
          </div>

          <div className={style["form-actions"]}>
            <button
              type="button"
              className={style["btn-secondary"]}
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={pending}
              className={style["btn-primary"]}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </ModalFrame>
  );
}
