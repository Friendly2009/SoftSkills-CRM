import { AttendanceTrendData } from "@/interfaces/AnalyticsInterfaces";

export const fetchAttendanceTrends = async (range: string): Promise<AttendanceTrendData[] | { status: 403 }> => {
  try {
    const response = await fetch(`http://localhost:3000/hr/get-attendance-trends?range=${range}`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch attendance trends");
    }

    return result.data;
  } catch (error) {
    console.error("API Error in fetchAttendanceTrends:", error);
    throw error;
  }
};
