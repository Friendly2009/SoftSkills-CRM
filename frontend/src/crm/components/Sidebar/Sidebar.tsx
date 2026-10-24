import { NavigationItem } from "./components/NavigationItem";
import { navigation } from "../../config/navigation";
import { CircleHelp } from "lucide-react";
export function Sidebar({
  collapsed,
  onSupport,
}: {
  collapsed: boolean;
  onSupport: () => void;
}) {
  return (
    <aside className={`crm-sidebar ${collapsed ? "collapsed" : ""}`}>
      <nav aria-label="Разделы CRM">
        {navigation.map((item) => (
          <NavigationItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>
      <button
        className="crm-sidebar-support"
        onClick={onSupport}
        title="Поддержка"
      >
        <CircleHelp size={18} />
        {!collapsed && "Поддержка"}
      </button>
      <div className="crm-demo-label">
        {collapsed ? "DEMO" : "Демонстрационные данные"}
      </div>
    </aside>
  );
}
