import { useCrm } from "../../mocks/store/CrmProvider";
import { money } from "../../utils/format";
import { EntityWorkspace } from "../Clients/EntityWorkspace";
export function Finance() {
  const { db } = useCrm();
  const sum = (status: string) =>
    db.records.transactions
      .filter((t) => t.status === status)
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  return (
    <>
      <div className="crm-page-heading">
        <h1>Финансы</h1>
      </div>
      <div className="crm-stats mb-5">
        {[
          ["Приход", sum("Приход")],
          ["Расход", sum("Расход")],
          ["Остаток", sum("Приход") - sum("Расход")],
          [
            "Задолженность клиентов",
            -db.records.clients.reduce(
              (s, c) => s + Math.min(0, Number(c.balance || 0)),
              0,
            ),
          ],
        ].map(([label, value]) => (
          <div className="crm-panel p-5" key={label}>
            <span className="text-slate-500">{label}</span>
            <strong className="block mt-2 text-2xl font-normal">
              {money(Number(value))}
            </strong>
          </div>
        ))}
      </div>
      <EntityWorkspace entity="transactions" compact />
    </>
  );
}
