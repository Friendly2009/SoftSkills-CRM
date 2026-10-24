import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { settingsSections } from "../../../config/settings";
import { useCrm } from "../../../mocks/store/CrmProvider";
import type { RecordDraft, DictionaryItem } from "../../../interfaces/common";
import { Button, FormFields, Modal, Empty } from "../../ui";
export function SettingsContent({ name }: { name: string }) {
  const { db, mutate, isMock } = useCrm();
  const section = settingsSections.find((s) => s.name === name)!;
  const [draft, setDraft] = useState<RecordDraft>(db.settings[name] || {}),
    [edit, setEdit] = useState<DictionaryItem | null>(null),
    [remove, setRemove] = useState("");
  const items = db.dictionaries[name] || [];
  return (
    <section className="crm-panel p-5">
      <h2 className="text-lg mb-5">{name}</h2>
      {section.dictionary ? (
        <>
          <Button
            primary
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                color: "#35b3c3",
                description: "",
              })
            }
          >
            <Plus size={14} />
            Добавить
          </Button>
          <div className="mt-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-slate-100 py-3"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <div className="flex-1">
                  <p>{item.name}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <Button
                  aria-label={`Изменить ${item.name}`}
                  onClick={() => setEdit({ ...item })}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  aria-label={`Удалить ${item.name}`}
                  onClick={() => setRemove(item.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            {!items.length && (
              <Empty text="Нет записей. Добавьте первый элемент справочника." />
            )}
          </div>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            (await mutate({ type: 'settings.save', name, values: draft }));
          }}
        >
          <FormFields
            fields={section.fields || []}
            draft={draft}
            setDraft={setDraft}
          />
          <p className="crm-hint mt-5">
            {isMock ? "Настройки сохраняются локально в демоверсии." : "Настройки сохраняются на сервере."}
          </p>
          <div className="crm-form-footer">
            <Button primary type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      )}
      {edit && (
        <Modal title="Элемент справочника" onClose={() => setEdit(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                (await mutate({ type: 'dictionary.save', name, item: edit }))
              )
                setEdit(null);
            }}
          >
            <div className="crm-form">
              <label>
                <span>Название *</span>
                <input
                  required
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <label>
                <span>Цвет</span>
                <input
                  type="color"
                  value={edit.color}
                  onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                />
              </label>
              <label>
                <span>Описание</span>
                <textarea
                  value={edit.description}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="crm-form-footer">
              <Button primary type="submit">
                Сохранить
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Удалить элемент?" onClose={() => setRemove("")}>
          <p>Элемент будет удалён из справочника.</p>
          <div className="crm-form-footer">
            <Button onClick={() => setRemove("")}>Отмена</Button>
            <Button
              danger
              onClick={async () => {
                if (await mutate({ type: 'dictionary.remove', name, id: remove })) setRemove("");
              }}
            >
              Удалить
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
