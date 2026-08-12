export const get_transactions_list = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/get_transactions_list",
      {
        method: "GET",
        credentials: "include",
      },
    );
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  } catch (error) {
    return [];
  }
};

export const getRevenueSources = async () => {
  try {
    const response = await fetch("http://localhost:3000/revenue-sources", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Не удалось загрузить данные дашборда");
    }

    return result.data;
  } catch (error) {
    console.error("Ошибка при вызове getFinancialDashboardData:", error);
    return null;
  }
};

export const getFinancialTimelineData = async () => {
  try {
    const response = await fetch("http://localhost:3000/getFinancialTimeline", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Не удалось загрузить таймлайн");
    }

    return result.data;
  } catch (error) {
    console.error("Ошибка при вызове getFinancialTimelineData:", error);
    return [];
  }
};

export const addManualExpenseRequest = async (expenseData: {
  amount: number;
  category: string;
  comment: string;
}) => {
  try {
    const response = await fetch("http://localhost:3000/finance/add-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", 
      body: JSON.stringify(expenseData),
    });

    return await response.json();
  } catch (error) {
    console.error("Ошибка при вызове addManualExpenseRequest:", error);
    return { success: false, message: "Ошибка сети при отправке расхода" };
  }
};

export const getExpensesStructureData = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/finance/expenses-structure",
      {
        method: "GET",
        credentials: "include",
      },
    );
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error("Ошибка при вызове getExpensesStructureData:", error);
    return [];
  }
};
