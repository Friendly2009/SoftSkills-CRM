export const get_transactions_list = async () => {
    try{
        const response = await fetch('http://localhost:3000/get_transactions_list',
            {
                method: 'GET',
                credentials: "include"
            }
        )
        const result = await response.json();
        if(!result.success){
            throw new Error(result.message);
        }
        return result.data;
    } catch (error) {
        return [];
    }
};

export const getRevenueSources = async () => {
    try {
        const response = await fetch('http://localhost:3000/revenue-sources', {
            method: 'GET',
            credentials: "include"
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