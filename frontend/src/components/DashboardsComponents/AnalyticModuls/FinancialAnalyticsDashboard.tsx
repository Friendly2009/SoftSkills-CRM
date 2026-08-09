import React, { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Users, Building2 } from 'lucide-react';
import { FinancialAnalyticsDashboardProps } from '@/interfaces/analyticsInterfaces';
import { FinanceChart } from './FinanceComponents/FinanceChart'; 
import { Revenue } from './FinanceComponents/Revenue';
import { Profit } from './FinanceComponents/Profit';
import { Expenses } from './FinanceComponents/Expenses';
import { Debts } from './FinanceComponents/Debts';
import { Transactions } from './FinanceComponents/Transactions';
interface FinancialSummary {
    company_id: number;
    company_name: string;
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    total_client_debt: number;
}

const mockFinancialData: FinancialSummary[] = [
    { company_id: 1, company_name: 'CheapCRM HQ (Основной филиал)', total_revenue: 450000, total_expenses: 180000, net_profit: 270000, total_client_debt: 35000 },
    { company_id: 2, company_name: 'CheapCRM West (Западный филиал)', total_revenue: 290000, total_expenses: 145000, net_profit: 145000, total_client_debt: 62000 },
    { company_id: 3, company_name: 'CheapCRM Soft (Онлайн направление)', total_revenue: 610000, total_expenses: 210000, net_profit: 400000, total_client_debt: 12000 }
];

const BRAND_COLORS = {
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    revenue: '#3b82f6',
    expenses: '#f43f5e',
    profit: '#10b981',
    debt: '#8b5cf6',
};

export const FinancialAnalyticsDashboard: React.FC<FinancialAnalyticsDashboardProps> = ({ subView }) => {
    const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
    const currentCompanyData = mockFinancialData.find(c => c.company_id === selectedCompanyId) || mockFinancialData[0];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div style={{ padding: '4px 0', fontFamily: 'sans-serif', color: BRAND_COLORS.textMain }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'revenue' ? `2px solid ${BRAND_COLORS.revenue}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Общая выручка</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0' }}>{formatCurrency(currentCompanyData.total_revenue)}</h3>
                    </div>
                    <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <DollarSign size={20} color={BRAND_COLORS.revenue} />
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'profit' ? `2px solid ${BRAND_COLORS.profit}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Чистая прибыль</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0', color: BRAND_COLORS.profit }}>{formatCurrency(currentCompanyData.net_profit)}</h3>
                    </div>
                    <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>
                        <TrendingUp size={20} color={BRAND_COLORS.profit} />
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'expenses' ? `2px solid ${BRAND_COLORS.expenses}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Расходы</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0' }}>{formatCurrency(currentCompanyData.total_expenses)}</h3>
                    </div>
                    <div style={{ backgroundColor: '#fff1f2', padding: '10px', borderRadius: '8px' }}>
                        <CreditCard size={20} color={BRAND_COLORS.expenses} />
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'debts' ? `2px solid ${BRAND_COLORS.debt}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Долги клиентов</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0' }}>{formatCurrency(currentCompanyData.total_client_debt)}</h3>
                    </div>
                    <div style={{ backgroundColor: '#f5f3ff', padding: '10px', borderRadius: '8px' }}>
                        <Users size={20} color={BRAND_COLORS.debt} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '16px' }}>
                {subView === 'finance_chart' && <FinanceChart companyId={selectedCompanyId} />}
                {subView === 'revenue' && <Revenue />}
                {subView === 'profit' && <Profit />}
                {subView === 'expenses' && <Expenses />}
                {subView === 'debts' && <Debts />}
                {subView === 'transactions' && <Transactions />}
            </div>
        </div>
    );
};
