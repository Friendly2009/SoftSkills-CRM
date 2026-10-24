import { useState } from "react";
import type {
  Entity,
  CrmRecord,
  RecordDraft,
} from "../../../interfaces/common";
import { modules } from "../../../config/modules";
import { useCrm } from "../../../mocks/store/CrmProvider";

import { Button, Modal, FormFields } from "../../ui";
export function RecordForm({
  entity,
  record,
  onClose,
  defaults = {},
}: {
  entity: Entity;
  record?: CrmRecord;
  onClose: () => void;
  defaults?: RecordDraft;
}) {
  const { mutate, isMock } = useCrm();
  const config = modules[entity];
  const [draft, setDraft] = useState<RecordDraft>(
    record ? { ...record } : { status: config.statuses[0], ...defaults },
  );
  const statuses =
    entity === "lessons"
      ? config.statuses.filter((s) => s !== "Проведён")
      : config.statuses;
  return (
    <Modal
      title={`${record ? "Изменить" : "Добавить"}: ${config.singular}`}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            (await mutate({ type: 'record.save', entity, draft, id: record?.id }))
          )
            onClose();
        }}
      >
        <FormFields
          fields={[
            ...config.fields
              .filter((f) => f.type !== "password")
              .map((f) =>
                ["source", "subject", "room"].includes(f.key)
                  ? {
                      ...f,
                      dictionary: (
                        {
                          source: "Источники клиентов",
                          subject: "Предметы",
                          room: "Аудитории",
                        } as Record<string, string>
                      )[f.key],
                    }
                  : f,
              ),
            {
              key: "status",
              label: "Статус",
              type: "select",
              options: statuses,
            },
          ]}
          draft={draft}
          setDraft={setDraft}
        />
        {entity === "users" && isMock && (
          <p className="crm-hint">
            Демонстрационная учётная запись. При подключении API приглашение
            будет отправляться по почте.
          </p>
        )}
        <footer className="crm-form-footer">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" primary>
            Сохранить
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
