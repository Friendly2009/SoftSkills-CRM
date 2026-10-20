import { getRevenueSources } from "@/features/analytics/api/Finance";
import { errorMessage } from "@/shared/api/client";
import { Alert } from "@/shared/ui/Alert";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
interface RevenueSourceItem {
  name: string;
  value: number;
}

export const Revenue: React.FC = () => {
  const [loadError, setLoadError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<RevenueSourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);

  useEffect(() => {
    getRevenueSources()
      .then((res) => {
        if (res?.status === 403) {
          setIsForbidden(true);
        } else if (Array.isArray(res)) {
          setAnalyticsData(res);
        }
      })
      .catch((err) => {
        setLoadError(errorMessage(err));
        if (err?.status === 403 || err?.message?.includes("403")) {
          setIsForbidden(true);
        } else {
          console.error(err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loadError) return <Alert>{loadError}</Alert>;
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          textAlign: "center",
          color: "var(--color-muted)",
        }}
      >
        <p style={{ fontSize: "13px", margin: 0 }}>
          Загрузка источников доходов...
        </p>
      </div>
    );
  }

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
          У вашей роли недостаточно прав для просмотра источников выручки.
        </p>
      </div>
    );
  }

  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          textAlign: "center",
          color: "var(--color-muted)",
        }}
      >
        <h3
          style={{
            margin: "0 0 4px 0",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Источники выручки
        </h3>
        <p style={{ fontSize: "13px", margin: "20px 0 0 0" }}>
          Данные о поступлениях за этот период отсутствуют
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
      }}
    >
      <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 600 }}>
        Источники выручки
      </h3>
      <p
        style={{
          margin: "0 0 20px 0",
          fontSize: "13px",
          color: "var(--color-muted)",
        }}
      >
        Распределение входящего потока денег по направлениям обучения
      </p>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={analyticsData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}к`}
            />
            <Tooltip
              cursor={{ fill: "var(--color-bg)", opacity: 0.5 }}
              formatter={(v) => [`${Number(v).toLocaleString()} ₽`, "Выручка"]}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
