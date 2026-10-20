import style from "@/shared/styles/dashboard/user.module.css";
import { ModalFrame } from "@/shared/ui/ModalFrame";
import { useId } from "react";
import { useUsers } from "../useUsers";
type Props = ReturnType<typeof useUsers>;
export function EditUserDialog({
  pending,
  setIsReSetModalWinOpen,
  resetFormData,
  handleResetInputChange,
  handleResetFormSubmit,
}: Props) {
  const fieldId = useId();
  return (
    <ModalFrame onClose={() => setIsReSetModalWinOpen(false)}>
      <div
        className={style["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style["modal-header"]}>
          <h3>Добавить сотрудника</h3>
          <button
            className={style["btn-close"]}
            onClick={() => setIsReSetModalWinOpen(false)}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleResetFormSubmit}>
          <div className={style["form-grid"]}>
            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-1"}>ФИО Сотрудника</label>
              <input
                id={fieldId + "-1"}
                type="text"
                name="full_name"
                required
                className={style["form-input"]}
                value={resetFormData.full_name}
                onChange={handleResetInputChange}
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
                value={resetFormData.role}
                onChange={handleResetInputChange}
              ></input>
            </div>

            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-3"}>Ранг</label>
              <input
                id={fieldId + "-3"}
                type="number"
                name="rank"
                className={style["form-input"]}
                value={resetFormData.rank}
                onChange={handleResetInputChange}
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
                value={resetFormData.email}
                onChange={handleResetInputChange}
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
                value={resetFormData.contact}
                onChange={handleResetInputChange}
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
                value={resetFormData.password}
                onChange={handleResetInputChange}
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
                  resetFormData.birthday
                    ? resetFormData.birthday.toISOString().split("T")[0]
                    : ""
                }
                onChange={handleResetInputChange}
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-8"}>Пол</label>
              <select
                id={fieldId + "-8"}
                name="gender"
                className={style["form-input"]}
                value={resetFormData.gender}
                onChange={handleResetInputChange}
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
              onClick={() => setIsReSetModalWinOpen(false)}
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
