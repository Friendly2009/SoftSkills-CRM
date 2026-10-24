export interface DashboardWidget {
  id: string;
  title: string;
  type: "bar" | "line" | "summary";
}
