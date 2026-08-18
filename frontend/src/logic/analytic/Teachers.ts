import { TeacherWorkloadData } from '@/interfaces/AnalyticsInterfaces';
export const fetchTeachersWorkload = async (): Promise<TeacherWorkloadData[]> => {
  try {
    const response = await fetch("http://localhost:3000/hr/get-teachers-workload", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch workload");
    }

    return result.data;
  } catch (error) {
    console.error("API Error in fetchTeachersWorkload:", error);
    return [];
  }
};