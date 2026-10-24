import { useState } from "react";
import { useCrm } from "../mocks/store/CrmProvider";
import type { RecordDraft } from "../interfaces/common";
import { Button, FormFields } from "../components/ui";
export function Profile() {
  const { db, mutate } = useCrm();
  const [draft, setDraft] = useState<RecordDraft>({ ...db.profile });
  return (
    <>
      <div className="crm-page-heading">
        <h1>Мой профиль</h1>
      </div>
      <section className="crm-panel p-6 max-w-3xl">
        <h2 className="mb-6 text-lg">Личные данные</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            (await mutate({ type: 'profile.save', profile: { name: String(draft.name), email: String(draft.email), phone: String(draft.phone) } }));
          }}
        >
          <FormFields
            fields={[
              { key: "name", label: "Имя", required: true },
              {
                key: "email",
                label: "Электронная почта",
                type: "email",
                required: true,
              },
              { key: "phone", label: "Телефон", type: "tel" },
            ]}
            draft={draft}
            setDraft={setDraft}
          />
          <div className="crm-form-footer">
            <Button primary type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
