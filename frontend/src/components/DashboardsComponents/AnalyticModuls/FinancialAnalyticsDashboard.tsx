import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { FinancialAnalyticsDashboardProps } from '@/interfaces/AnalyticsInterfaces';
import { FinanceChart } from './FinanceComponents/FinanceChart';
import { Revenue } from './FinanceComponents/Revenue';
import { Profit } from './FinanceComponents/Profit';
import { Expenses } from './FinanceComponents/Expenses';
import { Debts } from './FinanceComponents/Debts';
import { Transactions } from './FinanceComponents/Transactions';
import { fetchFinanceSummary } from '@/logic/analytic/Finance';

interface AllDataInterface {
    success: boolean;
    revenue: number;
    debt: number;
    expense: number;
    profit: number;
}

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
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
    };
    const [allData, setAllData] = useState<AllDataInterface>({
        success: false,
        revenue: 0,
        debt: 0,
        expense: 0,
        profit: 0
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const data = await fetchFinanceSummary();
                if (isMounted) {
                    if (data && (data as any).status === 403) {
                        setIsForbidden(true);
                    } else if (data && data.success) {
                        setAllData({
                            success: true,
                            revenue: data.revenue,
                            debt: data.debt,
                            expense: data.expense,
                            profit: data.profit
                        });
                    }
                }
            } catch (error: any) {
                console.error(error);
                if (isMounted && (error?.status === 403 || error?.message?.includes('403'))) {
                    setIsForbidden(true);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли недостаточно прав для просмотра сводных финансовых показателей.
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: '4px 0', fontFamily: 'sans-serif', color: BRAND_COLORS.textMain }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'revenue' ? `2px solid ${BRAND_COLORS.revenue}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Общая выручка</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0' }}>
                            {isLoading ? 'Загрузка...' : formatCurrency(allData.revenue)}
                        </h3>
                    </div>
                    <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <DollarSign size={20} color={BRAND_COLORS.revenue} />
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'profit' ? `2px solid ${BRAND_COLORS.profit}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Чистая прибыль</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0', color: BRAND_COLORS.profit }}>
                            {isLoading ? 'Загрузка...' : formatCurrency(allData.profit)}
                        </h3>
                    </div>
                    <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>
                        <TrendingUp size={20} color={BRAND_COLORS.profit} />
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'expenses' ? `2px solid ${BRAND_COLORS.expenses}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Расходы</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0' }}>
                            {isLoading ? 'Загрузка...' : formatCurrency(allData.expense)}
                        </h3>
                    </div>
                    <div style={{ backgroundColor: '#fff1f2', padding: '10px', borderRadius: '8px' }}>
                        <CreditCard size={20} color={BRAND_COLORS.expenses} />
                    </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: subView === 'debts' ? `2px solid ${BRAND_COLORS.debt}` : `1px solid ${BRAND_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: BRAND_COLORS.textMuted, fontWeight: 500 }}>Долги клиентов</span>
                        <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '4px 0 0 0' }}>
                            {isLoading ? 'Загрузка...' : formatCurrency(allData.debt)}
                        </h3>
                    </div>
                    <div style={{ backgroundColor: '#f5f3ff', padding: '10px', borderRadius: '8px' }}>
                        <Users size={20} color={BRAND_COLORS.debt} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '16px' }}>
                {subView === 'finance_chart' && <FinanceChart />}
                {subView === 'revenue' && <Revenue />}
                {subView === 'profit' && <Profit />}
                {subView === 'expenses' && <Expenses />}
                {subView === 'debts' && <Debts />}
                {subView === 'transactions' && <Transactions />}
            </div>
        </div>
    );
};
