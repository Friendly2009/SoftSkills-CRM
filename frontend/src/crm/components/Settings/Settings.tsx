import { useState } from "react";
import { settingsSections } from "../../config/settings";
import { SettingsContent } from "./components/SettingsContent";
export function Settings() {
  const [section, setSection] = useState("Основные настройки"),
    [search, setSearch] = useState("");
  return (
    <>
      <div className="crm-page-heading">
        <h1>Настройки</h1>
      </div>
      <div className="crm-settings-grid">
        <aside className="crm-panel p-3">
          <input
            className="w-full mb-3"
            placeholder="Поиск настройки"
            aria-label="Поиск настройки"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {[...new Set(settingsSections.map((s) => s.group))].map((group) => (
            <div key={group}>
              <h3 className="text-xs text-slate-400 uppercase px-2 pt-4 pb-2">
                {group}
              </h3>
              {settingsSections
                .filter(
                  (s) =>
                    s.group === group &&
                    s.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((s) => (
                  <button
                    key={s.name}
                    className={`crm-setting-link ${section === s.name ? "active" : ""}`}
                    onClick={() => setSection(s.name)}
                  >
                    {s.name}
                  </button>
                ))}
            </div>
          ))}
        </aside>
        <SettingsContent key={section} name={section} />
      </div>
    </>
  );
}
