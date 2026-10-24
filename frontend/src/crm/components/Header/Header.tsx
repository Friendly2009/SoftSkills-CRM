import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Plus,
  Wrench,
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { useCrm } from "../../mocks/store/CrmProvider";
import type { Entity } from "../../interfaces/common";
import { Button, Modal, Empty } from "../ui";
import { RecordForm } from "../Clients/components/RecordForm";
export function Header({
  onToggle,
  onSupport,
}: {
  onToggle: () => void;
  onSupport: () => void;
}) {
  const nav = useNavigate();
  const { db, mutate, isMock, logout } = useCrm();
  const [menu, setMenu] = useState(""),
    [search, setSearch] = useState(""),
    [entity, setEntity] = useState<Entity | null>(null);
  const results = db.records.clients.filter((c) =>
    `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <header className="crm-header">
      <Button aria-label="Свернуть или развернуть меню" onClick={onToggle}>
        <Menu size={20} />
      </Button>
      <div className="crm-logo" aria-label="Место для логотипа">
        <span />
        Логотип
      </div>
      <Button aria-label="Быстрое добавление" onClick={() => setMenu("add")}>
        <Plus size={21} />
      </Button>
      <Button aria-label="Настройки" onClick={() => nav("/dashboard/settings")}>
        <Wrench size={18} />
      </Button>
      <label className="crm-search crm-global-search">
        <Search size={16} />
        <input
          aria-label="Поиск клиентов"
          placeholder="Поиск клиента"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) setMenu("search");
          }}
        />
        <button aria-label="Найти" onClick={() => setMenu("search")}>
          ↵
        </button>
      </label>
      <div className="flex-1" />
      <span className="crm-header-center">
        {String(db.settings["Основные настройки"]?.name || "Учебный центр")}
      </span>
      <Button
        aria-label="Уведомления"
        className="relative"
        onClick={() => setMenu("notifications")}
      >
        <Bell size={18} />
        {db.notifications.some((n) => !n.read) && <i className="crm-unread" />}
      </Button>
      <Button onClick={() => setMenu("profile")}>
        <span className="crm-avatar">{db.profile.name[0]}</span>
        <span className="crm-user-name">{db.profile.name}</span>
        <ChevronDown size={13} />
      </Button>
      {menu === "add" && (
        <Modal title="Быстрое добавление" onClose={() => setMenu("")}>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["clients", "Клиент"],
                ["leads", "Лид"],
                ["lessons", "Урок"],
                ["tasks", "Задача"],
                ["groups", "Группа"],
                ["teachers", "Педагог"],
              ] as [Entity, string][]
            ).map(([e, label]) => (
              <Button
                key={e}
                onClick={() => {
                  setMenu("");
                  setEntity(e);
                }}
              >
                <Plus size={15} />
                {label}
              </Button>
            ))}
          </div>
        </Modal>
      )}
      {menu === "search" && (
        <Modal title="Поиск клиентов" onClose={() => setMenu("")}>
          <input
            autoFocus
            className="w-full mb-4"
            aria-label="Поиск клиента в результатах"
            placeholder="Имя или телефон"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {results.map((c) => (
            <button
              className="crm-search-result"
              key={c.id}
              onClick={() => {
                nav(`/dashboard/clients/${c.id}`);
                setMenu("");
                setSearch("");
              }}
            >
              <span>{c.name}</span>
              <small>{String(c.phone)}</small>
            </button>
          ))}
          {!results.length && <Empty />}
        </Modal>
      )}
      {menu === "notifications" && (
        <Modal title="Уведомления" onClose={() => setMenu("")}>
          <div>
            {db.notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-slate-100 ${n.read ? "text-slate-400" : "text-slate-700"}`}
              >
                {n.text}
              </div>
            ))}
          </div>
          <div className="crm-form-footer">
            <Button
              onClick={async () =>
                (await mutate({ type: 'notifications.read' }, "Уведомления прочитаны"))
              }
            >
              Прочитать все
            </Button>
          </div>
        </Modal>
      )}
      {menu === "profile" && (
        <Modal title={db.profile.name} onClose={() => setMenu("")}>
          <div className="grid gap-2">
            <Button
              onClick={() => {
                nav("/dashboard/license");
                setMenu("");
              }}
            >
              Лицензирование
            </Button>
            <Button
              onClick={() => {
                nav("/dashboard/profile");
                setMenu("");
              }}
            >
              <User size={15} />
              Мой профиль
            </Button>
            <Button
              onClick={() => {
                nav("/dashboard/settings");
                setMenu("");
              }}
            >
              <Wrench size={15} />
              Настройки CRM
            </Button>
            <Button
              onClick={() => {
                setMenu("");
                onSupport();
              }}
            >
              Поддержка
            </Button>
            <Button
              onClick={async () => { await logout(); }}
            >
              <LogOut size={15} />
              {isMock ? "Выйти из демо" : "Выйти"}
            </Button>
          </div>
        </Modal>
      )}
      {entity && <RecordForm entity={entity} onClose={() => setEntity(null)} />}
    </header>
  );
}
