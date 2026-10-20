import { LeadKanban } from "@/features/leads/components/Kanban";
import { Alert } from "@/shared/ui/Alert";
import { CreateLeadDialog } from "./components/CreateLeadDialog";
import { EditLeadDialog } from "./components/EditLeadDialog";
import { styles } from "./styles";
import { useLeads } from "./useLeads";
export function LeadsTable() {
  const model = useLeads();
  const {
    error,
    setError,
    leads,
    loading,
    isDeleteMode,
    isReSetMode,
    isModalOpen,
    isReSetModalWinOpen,
    viewMode,
    setViewMode,
    isForbiden,
    getLeads,
    handleRowClick,
    handlePlusClick,
    handleResetClick,
    handleDelClick,
    getInitials,
    translateStatus,
  } = model;

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
          У вашей роли нет доступа к просмотру лидов компании.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "5px" }}>
          <button style={styles.btnBlue(false)} onClick={handlePlusClick}>
            + Добавить
          </button>
          <button
            style={styles.btnLightBlue(isReSetMode)}
            onClick={handleResetClick}
          >
            {isReSetMode ? "Выбор лида..." : "Править"}
          </button>
          <button style={styles.btnRed(isDeleteMode)} onClick={handleDelClick}>
            {isDeleteMode ? "Выберите лида" : "Удалить"}
          </button>
        </div>

        <div style={{ flexGrow: 1 }}></div>

        <div style={styles.segmentedContainer}>
          <button
            style={styles.segmentedButton(viewMode === "table")}
            onClick={() => setViewMode("table")}
          >
            Список
          </button>
          <button
            style={styles.segmentedButton(viewMode === "kanban")}
            onClick={() => setViewMode("kanban")}
          >
            Канбан
          </button>
        </div>
      </div>

      {viewMode === "table" && (
        <>
          {error && (
            <Alert
              onRetry={() => {
                setError("");
                void getLeads();
              }}
            >
              {error}
            </Alert>
          )}
          <div style={styles.tableContainer}>
            <table style={styles.crmTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Лид / Потенциальный клиент</th>
                  <th style={styles.th}>Источник</th>
                  <th style={styles.th}>Контакты</th>
                  <th style={styles.th}>Заметки менеджера</th>
                  <th style={styles.th}>Статус воронки</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "var(--color-muted)",
                      }}
                    >
                      Загрузка списка лидов...
                    </td>
                  </tr>
                )}
                {!loading && leads.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "var(--color-muted)",
                      }}
                    >
                      Список лидов пуст.
                    </td>
                  </tr>
                )}
                {!loading &&
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleRowClick(lead)}
                      style={{
                        backgroundColor: "#ffffff",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={styles.td(isDeleteMode, isReSetMode)}>
                        <div style={styles.userInfo}>
                          <div style={styles.avatarPlaceholder}>
                            {getInitials(lead.name)}
                          </div>
                          <span style={styles.userFullname}>{lead.name}</span>
                        </div>
                      </td>
                      <td style={styles.td(isDeleteMode, isReSetMode)}>
                        <span style={styles.sourceBadge}>
                          {lead.source || "Не указан"}
                        </span>
                      </td>
                      <td style={styles.td(isDeleteMode, isReSetMode)}>
                        {lead.contact}
                      </td>
                      <td style={styles.td(isDeleteMode, isReSetMode)}>
                        {lead.description ? (
                          <span style={{ color: "#334155" }}>
                            {lead.description}
                          </span>
                        ) : (
                          <span style={styles.textMuted}>Нет заметок</span>
                        )}
                      </td>
                      <td style={styles.td(isDeleteMode, isReSetMode)}>
                        <span style={styles.badge(lead.status)}>
                          {translateStatus(lead.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {isModalOpen && <CreateLeadDialog {...model} />}
          {isReSetModalWinOpen && <EditLeadDialog {...model} />}
        </>
      )}
      {viewMode === "kanban" && <LeadKanban></LeadKanban>}
    </div>
  );
}
