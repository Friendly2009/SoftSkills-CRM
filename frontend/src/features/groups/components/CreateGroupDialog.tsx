import style from "@/shared/styles/dashboard/group.module.css";
import { ModalFrame } from "@/shared/ui/ModalFrame";
import { useId } from "react";
import { useGroups } from "../useGroups";
type Props = ReturnType<typeof useGroups>;
export function CreateGroupDialog({
  pending,
  users,
  setIsAddGroup,
  formData,
  handleInputChange,
  handleScheduleChange,
  addScheduleField,
  removeScheduleField,
  handleSubmit,
}: Props) {
  const fieldId = useId();
  return (
    <ModalFrame onClose={() => setIsAddGroup(false)}>
      <div
        className={style["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style["modal-header"]}>
          <h3>Добавить группу</h3>
          <button
            className={style["btn-close"]}
            onClick={() => setIsAddGroup(false)}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={style["form-grid"]}>
            <div className={`${style["form-group"]} ${style["full-width"]}`}>
              <label htmlFor={fieldId + "-1"}>Название группы</label>
              <input
                id={fieldId + "-1"}
                type="text"
                name="name"
                required
                className={style["form-input"]}
                value={formData.name}
                onChange={handleInputChange}
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
                value={formData.users_id || ""}
                onChange={handleInputChange}
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
                value={formData.max_students}
                onChange={handleInputChange}
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
              {formData.schedules.map((schedule, index) => (
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
                      handleScheduleChange(index, "day_of_week", e.target.value)
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
                      schedule.start_time ? schedule.start_time.slice(0, 5) : ""
                    }
                    required
                    className={style["form-input"]}
                    style={{
                      flex: 1.5,
                      border:
                        schedule.start_time &&
                        schedule.end_time &&
                        schedule.start_time >= schedule.end_time
                          ? "1px solid #ff4d4d"
                          : undefined,
                    }}
                    onChange={(e) =>
                      handleScheduleChange(index, "start_time", e.target.value)
                    }
                  />
                  <span style={{ alignSelf: "center" }}>—</span>
                  <input
                    type="time"
                    value={
                      schedule.end_time ? schedule.end_time.slice(0, 5) : ""
                    }
                    required
                    className={style["form-input"]}
                    style={{
                      flex: 1.5,
                      border:
                        schedule.start_time &&
                        schedule.end_time &&
                        schedule.start_time >= schedule.end_time
                          ? "1px solid #ff4d4d"
                          : undefined,
                    }}
                    onChange={(e) =>
                      handleScheduleChange(index, "end_time", e.target.value)
                    }
                  />

                  {formData.schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleField(index)}
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
                onClick={addScheduleField}
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

          <div className={style["form-actions"]}>
            <button
              type="button"
              className={style["btn-secondary"]}
              onClick={() => setIsAddGroup(false)}
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
