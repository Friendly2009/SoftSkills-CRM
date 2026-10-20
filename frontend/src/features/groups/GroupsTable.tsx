import style from "@/shared/styles/dashboard/group.module.css";
import { Alert } from "@/shared/ui/Alert";
import { CreateGroupDialog } from "./components/CreateGroupDialog";
import { EditGroupDialog } from "./components/EditGroupDialog";
import { formatTime, useGroups } from "./useGroups";
export function GroupTable() {
  const model = useGroups();
  const {
    error,
    setError,
    groups,
    isAddGroup,
    isDeleteMode,
    isUpdateMode,
    isOpenModalWindow,
    isLoading,
    isForbidden,
    isReadOnly,
    handleDelGroup,
    handleUpdateGroup,
    getGroup,
    handleAddGroup,
    handleRowClick,
  } = model;

  if (isLoading) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          color: "var(--color-muted)",
          fontSize: "14px",
        }}
      >
        Загрузка списка групп...
      </div>
    );
  }
  if (isForbidden) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "40px 24px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Доступ ограничен
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)" }}>
          У вашей роли нет доступа к просмотру групп.
        </p>
      </div>
    );
  }
  return (
    <>
      {error && (
        <Alert
          onRetry={() => {
            setError("");
            void getGroup();
          }}
        >
          {error}
        </Alert>
      )}
      {isOpenModalWindow && <EditGroupDialog {...model} />}
      {isAddGroup === true && <CreateGroupDialog {...model} />}
      {!isReadOnly && (
        <div className={style["content-header"]}>
          <div className={style["action-bar"]}>
            <div className={style["btn-group"]}>
              <button
                className={`${style.btn} ${style["btn-blue"]}`}
                onClick={handleAddGroup}
              >
                + Добавить
              </button>
              <button
                className={`${style.btn} ${isUpdateMode ? style["btn-gray"] : style["btn-light-blue"]}`}
                onClick={handleUpdateGroup}
              >
                {isUpdateMode ? "Отменить" : "Править"}
              </button>
              <button
                className={`${style.btn} ${isDeleteMode ? style["btn-gray"] : style["btn-red"]}`}
                onClick={handleDelGroup}
              >
                {isDeleteMode ? "Отменить" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={style["table-container"]}>
        <table className={style["crm-table"]}>
          <thead>
            <tr>
              <th>Группа</th>
              <th>Расписание</th>
              <th>Ученики</th>
              <th>Следующий урок</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} onClick={() => handleRowClick(group)}>
                <td>
                  <div className={style["group-info"]}>
                    <div>
                      <div className={style["group_name"]}>{group.name}</div>
                      <div
                        style={{
                          color: "var(--color-muted)",
                          fontSize: "11px",
                          marginTop: "2px",
                        }}
                      >
                        {group.teacher}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {group.schedules && group.schedules.length > 0 ? (
                      group.schedules.map((item, index) => (
                        <div
                          key={index}
                          style={{ fontSize: "13px", whiteSpace: "nowrap" }}
                        >
                          <strong
                            style={{ color: "#475569", marginRight: "4px" }}
                          >
                            {item.day_of_week}:
                          </strong>
                          <span style={{ color: "var(--color-muted)" }}>
                            {formatTime(item.start_time)} –{" "}
                            {formatTime(item.end_time)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                          fontStyle: "italic",
                        }}
                      >
                        Нет расписания
                      </span>
                    )}
                  </div>
                </td>

                <td style={{ fontWeight: 500 }}>
                  {group.studentsCount} / {group.max_students}
                </td>
                <td>
                  <span className={style["date"]}>
                    {group.nextMeeting
                      ? group.nextMeeting.toLocaleDateString("ru-RU")
                      : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
