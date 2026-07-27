const formatDateToISOString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getSchedule = async () => {
  const response = await fetch("http://localhost:3000/schedule", {
    method: "GET",
    credentials: "include"
  });
  const result = await response.json();
  return result;
}

