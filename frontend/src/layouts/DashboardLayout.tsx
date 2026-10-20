import { useAuth } from "@/app/AuthProvider";
import { Button } from "@/shared/ui/Button";
import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  LogOut,
  Menu,
  Upload,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
const sections = [
  ["analytics", "Аналитика", BarChart3],
  ["groups", "Группы", Users],
  ["clients", "Клиенты", UserRound],
  ["users", "Сотрудники", GraduationCap],
  ["schedule", "Расписание", CalendarDays],
  ["finance", "Финансы", Wallet],
  ["leads", "Лиды", UserPlus],
] as const;
export function DashboardLayout() {
  const { profile, logout } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="crm-shell">
      <header className="crm-header">
        <Button
          variant="secondary"
          aria-label="Показать или скрыть меню"
          aria-expanded={expanded}
          aria-controls="crm-nav"
          onClick={() => setExpanded(!expanded)}
        >
          <Menu size={20} />
        </Button>
        <Link className="crm-brand" to="/dashboard">
          SoftSkills CRM
        </Link>
        <div className="crm-header-actions">
          <Link
            to="/transfer_page"
            title="Импорт данных"
            aria-label="Импорт данных"
          >
            <Upload size={20} />
          </Link>
          <Link to="/profile" className="crm-profile">
            {profile?.fullname || "Мой профиль"}
          </Link>
          <Button
            variant="secondary"
            disabled={leaving}
            aria-label="Выйти"
            onClick={async () => {
              setLeaving(true);
              try {
                await logout();
                navigate("/authorization");
              } catch {
                /* API displays the error; keep the session visible. */
              } finally {
                setLeaving(false);
              }
            }}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>
      <div className={`crm-body ${expanded ? "" : "crm-body--collapsed"}`}>
        {expanded && (
          <nav id="crm-nav" className="crm-nav" aria-label="Разделы CRM">
            {sections.map(([path, title, Icon]) => (
              <NavLink key={path} to={`/dashboard/${path}`} title={title}>
                <Icon size={18} />
                <span>{title}</span>
              </NavLink>
            ))}
          </nav>
        )}
        <main className="crm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
