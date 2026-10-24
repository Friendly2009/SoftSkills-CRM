import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
export function NavigationItem({
  path,
  label,
  icon: Icon,
  collapsed,
}: {
  path: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}) {
  return (
    <NavLink
      title={collapsed ? label : undefined}
      to={`/dashboard/${path}`}
      className={({ isActive }) => (isActive ? "active" : "")}
    >
      <Icon size={17} strokeWidth={1.6} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
