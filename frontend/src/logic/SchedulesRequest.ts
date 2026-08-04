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

export const getSchedule = async (startDate: string, endDate: string) => {
  try {
    const url = `http://localhost:3000/schedule?startDate=${startDate}&endDate=${endDate}`;

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
  const response = await fetch(`http://localhost:3000/getlessons/${id}`, {
    method: "GET",
    credentials: "include",
  });
  const result = await response.json();
  return result;
};
