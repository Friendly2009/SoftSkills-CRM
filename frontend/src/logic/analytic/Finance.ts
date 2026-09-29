export const get_transactions_list = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/get_transactions_list`,
      {
        method: `GET`,
        credentials: `include`,
      },
    );

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  } catch (error: any) {
    console.error(`Ошибка в get_transactions_list:`, error);
    throw error;
  }
};

export const getRevenueSources = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/revenue-sources`,
      {
        method: `GET`,
        credentials: `include`,
      },
    );

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Не удалось загрузить данные дашборда`);
    }

    return result.data;
  } catch (error) {
    console.error(`Ошибка при вызове getFinancialDashboardData:`, error);
    throw error;
  }
};

export const getFinancialTimelineData = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/getFinancialTimeline`,
      {
        method: `GET`,
        credentials: `include`,
      },
    );

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Не удалось загрузить таймлайн`);
    }

    return result.data;
  } catch (error) {
    console.error(`Ошибка при вызове getFinancialTimelineData:`, error);
    throw error;
  }
};

export const addManualExpenseRequest = async (expenseData: {
  amount: number;
  category: string;
  comment: string;
}) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/finance/add-expense`,
      {
        method: "POST",
        headers: {
          "Content-Type": `application/json`,
        },
        credentials: `include`,
        body: JSON.stringify(expenseData),
      },
    );

    if (response.status === 403) {
      return { success: false, status: 403, message: `Доступ запрещен` };
    }

    return await response.json();
  } catch (error) {
    console.error(`Ошибка при вызове addManualExpenseRequest:`, error);
    return { success: false, message: `Ошибка сети при отправке расхода` };
  }
};

export const getExpensesData = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/finance/expenses-structure`,
      {
        method: `GET`,
        credentials: `include`,
      },
    );

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Ошибка загрузки структуры расходов`);
    }
    return result.data;
  } catch (error) {
    console.error(`Ошибка при вызове getExpensesData:`, error);
    throw error;
  }
};

export const getExpensesStructureData = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/finance/expenses-structure-by-group`,
      {
        method: `GET`,
        credentials: `include`,
      },
    );

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Ошибка загрузки группировки расходов`);
    }
    return result.data;
  } catch (error) {
    console.error(`Ошибка при вызове getExpensesStructureData:`, error);
    throw error;
  }
};

export const getDebtClient = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST}/finance/client-debtors`,
      {
        method: `GET`,
        credentials: `include`,
      },
    );

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Ошибка загрузки должников`);
    }
    return result.data;
  } catch (error) {
    console.error(`Ошибка при вызове getDebtClient:`, error);
    throw error;
  }
};

export const fetchFinanceSummary = async () => {
  try {
    const sessionId = localStorage.getItem("sessionId");

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (sessionId) {
      headers["X-Session-ID"] = sessionId;
    }

    const response = await fetch(
      `${import.meta.env.VITE_HOST}/finance/get-all-state`,
      {
        method: `GET`,
        headers: headers,
        credentials: `include`,
      },
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, status: response.status };
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || `something went wrong`);
    }

    return {
      success: true,
      revenue: result.revenue,
      debt: result.debt,
      expense: result.expense,
      profit: result.profit,
    };
  } catch (error) {
    console.error(`API Error in getAllState:`, error);
    return { success: false, error };
  }
};

export const getFinanceChartData = async (): Promise<any> => {
  try {
    const sessionId = localStorage.getItem("sessionId");

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (sessionId) {
      headers["X-Session-ID"] = sessionId;
    }

    const response = await fetch(
      `${import.meta.env.VITE_HOST}/get-chart-state`,
      {
        method: `GET`,
        headers: headers,
        credentials: `include`,
      },
    );

    if (response.status === 401 || response.status === 403) {
      return { status: response.status };
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || `Failed to fetch chart data`);
    }

    return result.data;
  } catch (error) {
    console.error(`API Error in getFinanceChartData:`, error);
    throw error;
  }
};
