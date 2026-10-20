import { useAuth } from "@/app/AuthProvider";
import { errorMessage, request } from "@/shared/api/client";
import type { ClientTemplate } from "@/shared/types/clientsInterfaces";
import { Alert, EmptyState } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addClient, deleteClient, getClient, updateClient } from "./api";
import { ClientForm, emptyClient } from "./components/ClientForm";
import { MoreAction } from "./components/MoreActions";
import { TopUp } from "./components/TopUp";
export function ClientTable() {
  const { profile } = useAuth();
  const canEdit = Number(profile?.rank) >= 500;
  const canDelete = Number(profile?.rank) >= 1000;
  const [clients, setClients] = useState<ClientTemplate[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClientTemplate | null>(null);
  const [topUp, setTopUp] = useState<ClientTemplate | null>(null);
  const [deleting, setDeleting] = useState<ClientTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<{
    client: ClientTemplate;
    x: number;
    y: number;
  } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setClients(await getClient());
    } catch (ex) {
      setError(errorMessage(ex));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (canEdit)
      request<{ data: { id: number; name: string }[] }>("/getgroups")
        .then((result) => setGroups(result.data || []))
        .catch((ex) => setError(errorMessage(ex)));
  }, [canEdit]);
  const filtered = clients.filter((c) =>
    `${c.name} ${c.contact}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="ui-page">
      <header className="ui-page-heading">
        <h1>Клиенты</h1>
        {canEdit && (
          <Button onClick={() => setEditing(emptyClient())}>
            Добавить клиента
          </Button>
        )}
      </header>
      <label className="ui-search">
        Поиск клиента
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Имя или контакт"
        />
      </label>
      {error && <Alert onRetry={() => void refresh()}>{error}</Alert>}
      {loading ? (
        <EmptyState>Загрузка клиентов…</EmptyState>
      ) : (
        !error && (
          <>
            <div className="ui-table-scroll">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Группы</th>
                    <th>Баланс</th>
                    <th>Контакт</th>
                    <th>Следующее посещение</th>
                    {canEdit && <th>Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <Link to={`/dashboard/client/${client.id}`}>
                          {client.name}
                        </Link>
                      </td>
                      <td>{client.group_names.join(", ") || "Нет группы"}</td>
                      <td
                        className={
                          client.balance < 0 ? "text-danger" : "text-success"
                        }
                      >
                        {client.balance.toLocaleString("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                        })}
                      </td>
                      <td>{client.contact || "—"}</td>
                      <td>
                        {client.next_visit?.toLocaleDateString("ru-RU") ||
                          "Нет занятий"}
                      </td>
                      {canEdit && (
                        <td>
                          <Button
                            variant="secondary"
                            aria-label={`Действия: ${client.name}`}
                            onClick={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setMenu({ client, x: r.left, y: r.bottom });
                            }}
                          >
                            •••
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <EmptyState>
                {query ? "Ничего не найдено" : "Клиентов пока нет"}
              </EmptyState>
            )}
          </>
        )
      )}
      {menu && (
        <MoreAction
          {...menu}
          isOpen
          onClose={closeMenu}
          onEdit={setEditing}
          onTopUp={setTopUp}
          onDelete={canDelete ? setDeleting : undefined}
        />
      )}
      {editing && (
        <ClientForm
          client={editing}
          groups={groups}
          onClose={() => setEditing(null)}
          onSave={async (value) => {
            if (value.id) await updateClient(value, editing.balance);
            else await addClient(value);
            await refresh();
          }}
        />
      )}
      {topUp && (
        <TopUp
          client={topUp}
          onClose={() => setTopUp(null)}
          onSuccess={() => void refresh()}
        />
      )}
      {deleting && (
        <Modal
          title="Удалить клиента?"
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <p>
            Клиент «{deleting.name}» будет удалён. Это действие нельзя отменить.
          </p>
          <footer className="ui-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteClient(deleting);
                  setDeleting(null);
                  await refresh();
                } catch (ex) {
                  setError(errorMessage(ex));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Удалить
            </Button>
          </footer>
        </Modal>
      )}
    </section>
  );
}
