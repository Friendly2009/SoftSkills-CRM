import { useState } from "react";
import { useCrm } from "../mocks/store/CrmProvider";
import { Button, Modal, Empty } from "../components/ui";
import { money, dateKey, shiftDate } from "../utils/format";
export function License() {
  const { db, mutate, isMock } = useCrm();
  const [tab, setTab] = useState("Лицензирование"),
    [open, setOpen] = useState(false),
    [months, setMonths] = useState("1");
  const license = db.settings.license || {
    plan: isMock ? "Демонстрационный" : "Не указан",
    until: isMock ? shiftDate(dateKey(new Date()), 30) : "Не указано",
  };
  return (
    <>
      <div className="crm-page-heading">
        <h1>Лицензирование</h1>
      </div>
      <div className="crm-tabs">
        {["Лицензирование", "Архив"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Лицензирование" ? (
        <section className="crm-panel p-6 max-w-4xl">
          <h2 className="text-lg mb-5">Текущий тариф</h2>
          <dl className="crm-properties">
            <div>
              <dt>Название</dt>
              <dd>{String(license.plan)}</dd>
            </div>
            <div>
              <dt>Активен до</dt>
              <dd>{String(license.until)}</dd>
            </div>
            <div>
              <dt>Сотрудников</dt>
              <dd>{db.records.users.length}</dd>
            </div>
            <div>
              <dt>Филиалов</dt>
              <dd>{Math.max(1, db.dictionaries["Филиалы"]?.length || 0)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <Button primary onClick={() => setOpen(true)}>
              Продлить лицензию
            </Button>
          </div>
          <p className="crm-hint mt-4">
            {isMock ? "Тестовые условия и цены. Реальная оплата не выполняется." : "Условия продления определяет сервер."}
          </p>
        </section>
      ) : (
        <section className="crm-panel p-5">
          {(db.dictionaries.licenseHistory || []).map((item) => (
            <div key={item.id} className="py-3 border-b border-slate-100">
              <strong className="font-normal">{item.name}</strong>
              <p className="crm-hint">{item.description}</p>
            </div>
          ))}
          {!db.dictionaries.licenseHistory?.length && (
            <Empty text="История продлений пуста" />
          )}
        </section>
      )}
      {open && (
        <Modal title="Продлить демолицензию" onClose={() => setOpen(false)}>
          <label className="block">
            Период
            <select
              className="block w-full mt-2"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            >
              {[1, 3, 6, 12].map((n) => (
                <option value={n} key={n}>
                  {n} мес.
                </option>
              ))}
            </select>
          </label>
          <p className="mt-5">
            {isMock ? `Тестовая стоимость: ${money(Number(months) * 1500)}` : "Стоимость определяется сервером."}
          </p>
          <div className="crm-form-footer">
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button
              primary
              onClick={async () => {
                if (
                  (await mutate({ type: 'license.extend', months: Number(months) }, isMock ? "Демолицензия продлена" : "Ответ сервера получен"))
                )
                  setOpen(false);
              }}
            >
              {isMock ? "Подтвердить в демо" : "Отправить запрос"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
