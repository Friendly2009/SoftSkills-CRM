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
    period: string;    
    revenue: number;    
    profit: number;    
    expenses: number;   
    debts: number;       
}

export interface FinancialAnalyticsDashboardProps {
    subView: string;
}

export interface TransactionsFrontend {
    id: number;
    lesson_id: number | null;
    client_id: number | null;
    client_name: string | null;
    user_id: number | null;
    user_name: string | null;
    amount: number;
    type: string;
    description: string;
    created_at: Date;
}

export interface ExpenseStructureItem {
    name: string;
    value: number;
}

export interface ExpenseTransactionItem {
    transaction_id: number;
    date: string;
    expense_amount: string | number;
    operation_description: string;
    lesson_id: number | null;
    teacher_id: number | null;
}
