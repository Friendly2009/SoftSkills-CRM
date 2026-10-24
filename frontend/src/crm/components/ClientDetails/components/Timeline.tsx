import type { Activity } from "../../../interfaces/common";
export function Timeline({
  history,
  createdAt,
  author,
}: {
  history: Activity[];
  createdAt: string;
  author: string;
}) {
  return (
    <>
      {history.map((a) => (
        <div className="crm-timeline" key={a.id}>
          <span className="crm-dot" />
          <div>
            <div className="text-xs text-slate-400 mb-1">
              {new Date(a.date).toLocaleString("ru-RU")} · {author}
            </div>
            <p>{a.text}</p>
          </div>
        </div>
      ))}
      <div className="crm-timeline">
        <span className="crm-dot" />
        <div>
          <span className="text-xs text-slate-400">
            {new Date(createdAt).toLocaleDateString("ru-RU")}
          </span>
          <p>Запись создана</p>
        </div>
      </div>
    </>
  );
}
