import { apiFetch } from "@/shared/api/client";
import { GroupAnalytics } from "@/shared/types/analyticsInterfaces";
import { Dispatch, SetStateAction } from "react";

export const getOccupancyGroups = async (
  setReportData: Dispatch<SetStateAction<GroupAnalytics[]>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
): Promise<void> => {
  try {
    const response = await apiFetch(`/getaccupancygroups`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    setReportData(data.data || []);
    setLoading(false);
    console.log(JSON.stringify(data));
  } catch (ex) {
    setLoading(false);
    throw ex;
  }
};
export const getBarColor = (rate: number): string => {
  if (rate < 30) return "#ef4444";
  if (rate < 60) return "#f59e0b";
  return "#10b981";
};
