export interface GroupAnalytics {
    group_id: number;
    group_name: string;
    teacher_name: string | null;
    current_students: number;
    max_capacity: number;
    occupancy_rate: number;
    group_status: number;
}

export interface FinancialTimelineData {
    period: string;       // "Янв", "Фев", "Март" и т.д.
    revenue: number;      // Выручка
    profit: number;       // Чистая прибыль
    expenses: number;     // Расходы
    debts: number;        // Долги клиентов
}

export interface FinancialAnalyticsDashboardProps {
    subView: string;
}

export interface FinanceChartProps {
    companyId: number;
}
