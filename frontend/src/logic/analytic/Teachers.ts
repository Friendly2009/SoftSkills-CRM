import { TeacherWorkloadData } from '@/interfaces/AnalyticsInterfaces';

export const fetchTeachersWorkload = async (): Promise<TeacherWorkloadData[] | { status: 403 }> => {
  try {
    const response = await fetch("http://localhost:3000/hr/get-teachers-workload", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 403) {
      return { status: 403 };
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch workload");
    }

    return result.data;
  } catch (error) {
    console.error("API Error in fetchTeachersWorkload:", error);
    throw error;
  }
};
