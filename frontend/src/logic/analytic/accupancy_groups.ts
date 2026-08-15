import { Dispatch, SetStateAction } from 'react';
import { GroupAnalytics } from '@/interfaces/analyticsInterfaces';

export const getAccupancyGroups = async (
    setReportData: Dispatch<SetStateAction<GroupAnalytics[]>>,
    setLoading: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        const response = await fetch('http://localhost:3000/getaccupancygroups', {
            method: 'GET',
            credentials: "include"
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        setReportData(data.data || []);
        setLoading(false);
        console.log(JSON.stringify(data));
    } catch (ex) {
        console.log(ex);
        setLoading(false);
    }
}
export const getBarColor = (rate: number): string => {
    if (rate < 30) return '#ef4444';
    if (rate < 60) return '#f59e0b';
    return '#10b981';
};