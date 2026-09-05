import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';
import { TeacherWorkloadData } from '@/interfaces/analyticsInterfaces';
import { fetchTeachersWorkload } from '@/logic/analytic/Teachers';

export const TeacherBurnoutTracker: React.FC = () => {
    const [data, setData] = useState<TeacherWorkloadData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);
    const BURNOUT_THRESHOLD = 24;

    useEffect(() => {
        let isMounted = true;
        
        fetchTeachersWorkload()
            .then((res: any) => {
                if (isMounted) {
                    if (res?.status === 403) {
                        setIsForbidden(true);
                    } else if (Array.isArray(res)) {
                        setData(res);
                    }
                    setIsLoading(false);
                }
            })
            .catch(err => {
                console.error("Ошибка загрузки трекера нагрузки:", err);
                if (isMounted) {
                    if (err?.status === 403 || err?.message?.includes('403')) {
                        setIsForbidden(true);
                    }
                    setIsLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, []);

    if (isLoading) {
        return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Загрузка трекера нагрузки...</div>;
    }

    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли недостаточно прав для просмотра нагрузки преподавателей.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
        }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                    Контроль выгорания преподавателей
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Недельное распределение учебных часов и лимит нормативной нагрузки
                </p>
            </div>

            <div style={{ width: '100%', height: data.length * 50 + 80 || 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />

                        <XAxis
                            type="number"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickFormatter={(val) => `${val}ч`}
                        />

                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#94a3b8"
                            fontSize={12}
                            width={120}
                            tickLine={false}
                        />

                        <Tooltip
                            cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                            formatter={(value: any) => [`${value} ч / неделю`]}
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />

                        <ReferenceLine
                            x={BURNOUT_THRESHOLD}
                            stroke="#f43f5e"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            label={{
                                value: 'Превышение нормы (24ч)',
                                fill: '#f43f5e',
                                fontSize: 11,
                                position: 'top'
                            }}
                        />

                        <Bar dataKey="hours" name="Часы нагрузки" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.hours > BURNOUT_THRESHOLD ? '#f43f5e' : '#3b82f6'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
