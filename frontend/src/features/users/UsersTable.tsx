import style from "@/shared/styles/dashboard/user.module.css";
import { Alert } from "@/shared/ui/Alert";
import { CreateUserDialog } from "./components/CreateUserDialog";
import { EditUserDialog } from "./components/EditUserDialog";
import { useUsers } from "./useUsers";
export function UsersTable() {
  const model = useUsers();
  const {
    loading,
    error,
    setError,
    users,
    isDeleteMode,
    isModalOpen,
    isReSetModalWinOpen,
    isReSetMode,
    isForbiden,
    getUsers,
    getInitials,
    handleRowClick,
    handlePlusClick,
    handleResetClick,
    handleDelClick,
  } = model;

  if (loading)
    return (
      <p role="status" className="ui-empty">
        Загрузка сотрудников…
      </p>
    );
  if (isForbiden) {
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
          У вашей роли нет доступа к просмотру сотрудников компании.
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
            void getUsers();
          }}
        >
          {error}
        </Alert>
      )}
      {isReSetModalWinOpen && <EditUserDialog {...model} />}
      {isModalOpen && <CreateUserDialog {...model} />}
      <div className={style["content-header"]}>
        <div className={style["action-bar"]}>
          <div className={style["btn-group"]}>
            <button
              className={`${style.btn} ${style["btn-blue"]}`}
              onClick={handlePlusClick}
            >
              + Добавить
            </button>
            <button
              className={`${style.btn} ${isReSetMode ? style["btn-gray"] : style["btn-light-blue"]}`}
              onClick={handleResetClick}
            >
              {isReSetMode ? "Отменить" : "Править"}
            </button>
            <button
              className={`${style.btn} ${isDeleteMode ? style["btn-gray"] : style["btn-red"]}`}
              onClick={handleDelClick}
            >
              {isDeleteMode ? "Отменить" : "Удалить"}
            </button>
          </div>
        </div>
      </div>

      <div className={style["table-container"]}>
        <table className={style["crm-table"]}>
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Роль</th>
              <th>Ранг</th>
              <th>Эл. почта</th>
              <th>Телефон</th>
              <th>Др</th>
              <th>Пол</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index} onClick={() => handleRowClick(user)}>
                <td>
                  <div className={style["user-info"]}>
                    <div className={style["avatar-placeholder"]}>
                      {getInitials(user.full_name)}
                    </div>
                    <span className={style["user-fullname"]}>
                      {user.full_name}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`${style.badge} ${style["badge-role"]}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`${style.badge} ${style["badge-rank"]}`}>
                    {user.rank}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>{user.contact}</td>
                <td>
                  {user.birthday ? (
                    user.birthday.toLocaleDateString("ru-RU")
                  ) : (
                    <span className={style["text-muted"]}>—</span>
                  )}
                </td>

                <td>
                  {user.gender ? (
                    user.gender
                  ) : (
                    <span className={style["text-muted"]}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
