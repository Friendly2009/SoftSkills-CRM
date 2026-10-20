import style from "@/shared/styles/dashboard/group.module.css";
import { ModalFrame } from "@/shared/ui/ModalFrame";
import { useId } from "react";
import { useGroups } from "../useGroups";
type Props = ReturnType<typeof useGroups>;
export function EditGroupDialog({
  pending,
  users,
  setIsOpenModalWindow,
  updateFormData,
  handleUpdateInputChange,
  handleScheduleUpdateChange,
  addUpdateScheduleField,
  removeUpdateScheduleField,
  handleUpdateSubmit,
}: Props) {
  const fieldId = useId();
  return (
    <ModalFrame onClose={() => setIsOpenModalWindow(false)}>
      <div
        className={style["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style["modal-header"]}>
          <h3>Редактировать группу</h3>
          <button
            className={style["btn-close"]}
            onClick={() => setIsOpenModalWindow(false)}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleUpdateSubmit}>
          <div className={style["form-grid"]}>
            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-1"}>Название группы</label>
              <input
                id={fieldId + "-1"}
                type="text"
                name="name"
                required
                className={style["form-input"]}
                value={updateFormData.name}
                onChange={handleUpdateInputChange}
                placeholder="Typescript по пятницам (старшая)"
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor={fieldId + "-2"}>Преподаватель</label>
              <select
                id={fieldId + "-2"}
                name="users_id"
                required
                className={style["form-input"]}
                value={updateFormData.users_id || ""}
                onChange={handleUpdateInputChange}
              >
                <option value="" disabled>
                  Выберите преподавателя
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-3"}>
                Максимальное количество учеников
              </label>
              <input
                id={fieldId + "-3"}
                type="number"
                name="max_students"
                required
                className={style["form-input"]}
                value={updateFormData.max_students}
                onChange={handleUpdateInputChange}
              />
            </div>
            <div
              className={`${style["form-group"]} ${style["full-width"]}`}
              style={{ marginTop: "15px" }}
            >
              <label
                style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                Расписание занятий
              </label>
              {updateFormData.schedules.map((schedule, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={schedule.day_of_week}
                    onChange={(e) =>
                      handleScheduleUpdateChange(
                        index,
                        "day_of_week",
                        e.target.value,
                      )
                    }
                    className={style["form-input"]}
                    style={{ flex: 2 }}
                  >
                    <option value="Понедельник">Понедельник</option>
                    <option value="Вторник">Вторник</option>
                    <option value="Среда">Среда</option>
                    <option value="Четверг">Четверг</option>
                    <option value="Пятница">Пятница</option>
                    <option value="Суббота">Суббота</option>
                    <option value="Воскресенье">Воскресенье</option>
                  </select>

                  <input
                    type="time"
                    value={
                      schedule.start_time &&
                      typeof schedule.start_time === "string"
                        ? schedule.start_time.slice(0, 5)
                        : ""
                    }
                    required
                    className={style["form-input"]}
                    style={{ flex: 1.5 }}
                    onChange={(e) =>
                      handleScheduleUpdateChange(
                        index,
                        "start_time",
                        e.target.value,
                      )
                    }
                  />

                  <span style={{ alignSelf: "center" }}>—</span>

                  <input
                    type="time"
                    value={
                      schedule.end_time && typeof schedule.end_time === "string"
                        ? schedule.end_time.slice(0, 5)
                        : ""
                    }
                    required
                    className={style["form-input"]}
                    style={{ flex: 1.5 }}
                    onChange={(e) =>
                      handleScheduleUpdateChange(
                        index,
                        "end_time",
                        e.target.value,
                      )
                    }
                  />

                  {updateFormData.schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUpdateScheduleField(index)}
                      style={{
                        padding: "5px 10px",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        color: "#ff4d4d",
                        fontSize: "18px",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addUpdateScheduleField}
                className={style["btn-secondary"]}
                style={{
                  padding: "5px 10px",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                + Добавить день
              </button>
            </div>
          </div>

          <div
            className={style["form-actions"]}
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              type="button"
              className={style["btn-secondary"]}
              onClick={() => setIsOpenModalWindow(false)}
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
