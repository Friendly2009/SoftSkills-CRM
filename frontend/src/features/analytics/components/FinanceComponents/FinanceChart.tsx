import { getFinanceChartData } from "@/features/analytics/api/Finance";
import { errorMessage } from "@/shared/api/client";
import { FinancialTimelineData } from "@/shared/types/analyticsInterfaces";
import { Alert } from "@/shared/ui/Alert";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const FinanceChart: React.FC = () => {
  const [loadError, setLoadError] = useState("");
  const [chartData, setChartData] = useState<FinancialTimelineData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        const data = await getFinanceChartData();
        if (isMounted) {
          if (data && (data as any).status === 403) {
            setIsForbidden(true);
          } else if (Array.isArray(data)) {
            setChartData(data);
          }
        }
      } catch (error: any) {
        setLoadError(errorMessage(error));
        console.error("Ошибка при загрузке графика:", error);
        if (
          isMounted &&
          (error?.status === 403 || error?.message?.includes("403"))
        ) {
          setIsForbidden(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchChartData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loadError) return <Alert>{loadError}</Alert>;
  if (isForbidden) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "40px 24px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Доступ ограничен
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-muted)" }}>
          У вашей роли недостаточно прав для просмотра графиков финансовых
          потоков.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
      }}
    >
      <h3
        style={{
          margin: "0 0 20px 0",
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        Сравнительный график финансовых потоков филиала
      </h3>

      <div
        style={{
          width: "100%",
          height: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLoading ? (
          <span style={{ color: "var(--color-muted)", fontSize: "14px" }}>
            Загрузка данных графика...
          </span>
        ) : chartData.length === 0 ? (
          <span style={{ color: "var(--color-muted)", fontSize: "14px" }}>
            Нет данных за выбранный период
          </span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value.toLocaleString("ru-RU")} ₽`}
              />
              <Tooltip
                formatter={(value: any) => [
                  `${Number(value).toLocaleString("ru-RU")} ₽`,
                ]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend verticalAlign="top" height={40} iconType="circle" />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Выручка"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />

              <Line
                type="monotone"
                dataKey="profit"
                name="Чистая прибыль"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />

              <Line
                type="monotone"
                dataKey="expenses"
                name="Расходы"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />

              <Line
                type="monotone"
                dataKey="debts"
                name="Долги клиентов"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
