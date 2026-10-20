import { errorMessage } from "@/shared/api/client";
import type { ClientTemplate } from "@/shared/types/clientsInterfaces";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useState } from "react";
export const emptyClient = (): ClientTemplate => ({
  id: 0,
  name: "",
  contact: "",
  balance: 0,
  status: 1,
  skills: 0,
  group_ids: [],
  group_names: [],
  next_visit: null,
});
export function ClientForm({
  client,
  groups,
  onSave,
  onClose,
}: {
  client: ClientTemplate;
  groups: { id: number; name: string }[];
  onSave: (value: ClientTemplate) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(client);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={client.id ? "Редактировать клиента" : "Добавить клиента"}
      onClose={onClose}
      busy={busy}
    >
      <form
        className="ui-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            await onSave(value);
            onClose();
          } catch (ex) {
            setError(errorMessage(ex));
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && <Alert>{error}</Alert>}
        <fieldset disabled={busy} className="ui-form">
          <label>
            Имя
            <input
              required
              maxLength={255}
              value={value.name}
              onChange={(e) => setValue({ ...value, name: e.target.value })}
            />
          </label>
          <label>
            Контакт
            <input
              value={value.contact}
              maxLength={255}
              onChange={(e) => setValue({ ...value, contact: e.target.value })}
            />
          </label>
          <label>
            Баланс, ₽
            <input
              type="number"
              required
              step="0.01"
              value={value.balance}
              onChange={(e) =>
                setValue({ ...value, balance: Number(e.target.value) })
              }
            />
          </label>
          {client.id > 0 && (
            <p className="ui-hint">
              Изменение баланса здесь — корректировка. Для платежа используйте
              «Пополнить».
            </p>
          )}
          <label>
            Статус
            <select
              value={value.status}
              onChange={(e) =>
                setValue({ ...value, status: Number(e.target.value) })
              }
            >
              <option value={1}>Активен</option>
              <option value={0}>Заморожен</option>
            </select>
          </label>
          <fieldset className="ui-checkbox-list">
            <legend>Группы</legend>
            {groups.length === 0 && <p>Доступных групп нет</p>}
            {groups.map((group) => (
              <label key={group.id}>
                <input
                  type="checkbox"
                  checked={value.group_ids.includes(group.id)}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      group_ids: e.target.checked
                        ? [...value.group_ids, group.id]
                        : value.group_ids.filter((id) => id !== group.id),
                    })
                  }
                />
                {group.name}
              </label>
            ))}
          </fieldset>
        </fieldset>
        <footer className="ui-actions">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Сохранение…" : "Сохранить"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
