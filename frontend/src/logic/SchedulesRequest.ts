export const formatDateToISOString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};
export const formatDateToString = (
  dateInput: string | Date | null | undefined,
): string => {
  if (!dateInput) return "";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().split("T")[0];
};

export const getSchedule = async (startDate: any, endDate: any) => {
  try {
    const formatPart = (date: any) => {
      if (!date) return "";
      if (date instanceof Date) return date.toISOString().split("T")[0];
      return String(date).trim();
    };

    const sDate = formatPart(startDate);
    const eDate = formatPart(endDate);

    if (!sDate || !eDate || sDate === "undefined" || eDate === "undefined") {
      console.warn("getSchedule отложен: даты еще не готовы", {
        startDate,
        endDate,
      });
      return { success: true, data: { templates: [], realLessons: [] } };
    }

    const url = `https://api.soft-skills-crm.ru/schedule?startDate=${sDate}&endDate=${eDate}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Ошибка при вызове getSchedule в SchedulesRequest:", error);
    return { success: false, data: { templates: [], realLessons: [] } };
  }
};

export const getLessonModal = async (id: string) => {
  const response = await fetch(
    `https://api.soft-skills-crm.ru/getlessons/${id}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const result = await response.json();
  return result;
};
