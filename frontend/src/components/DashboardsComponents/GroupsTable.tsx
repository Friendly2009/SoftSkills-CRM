import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/group.module.css';

interface GroupTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}

interface GroupTemplate {
    id: number;
    users_id: number;
    name: string;
    status: boolean;
    last_meeting: string;
    text_meeting: string;
    teacher_name: string;
}
export const GroupTable: React.FC<GroupTableProps> = ({ }) => {
    const [groups, setGroups] = useState<GroupTemplate[]>([]);

    const addFiveMockGroups = () => {
        const mockGroups: GroupTemplate[] = Array.from({ length: 5 }, (_, index) => {
            const uniqueId = Date.now() + index; // Уникальный ID для каждого элемента

            return {
                id: uniqueId,
                users_id: Math.floor(Math.random() * 1000) + 1,
                name: `Тестовая группа №${index + 1}`,
                status: true,
                last_meeting: new Date().toISOString(),
                text_meeting: `Краткое содержание встречи для группы №${index + 1}`,
                teacher_name: ["Алексей Иванов", "Мария Петрова", "Дмитрий Соколов"][index % 3]
            };
        });

        setGroups((prevGroups) => [...prevGroups, ...mockGroups]);
    };

    useEffect(() => {
        addFiveMockGroups();
    }, []);
    return (
        <>
            <div className={style['table-container']}>
                <table className={style['crm-table']}>
                    <thead>
                        <tr>
                            <th>Группа</th>
                            <th>Статус</th>
                            <th>Последнее посещение</th>
                            <th>Следующее посещение</th>
                            <th>Преподаватель</th>
                            <th className={style['actions-cell']}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group, index) => (
                            <tr key={index} onClick={() => { }}>
                                <td>
                                    <div className={style['group-info']}>
                                        <span className={style['group_name']}>{group.name}</span>
                                    </div>
                                </td>
                                <td>
                                    {group.status === false && <span className={`${style.badge} ${style['is_not_active']}`}>Пассивен</span>}
                                    {group.status === true && <span className={`${style.badge} ${style['is_active']}`}>Активен</span>}
                                </td>
                                <td>
                                    <span className={style['date']}>
                                        {group.last_meeting}
                                    </span>
                                </td>
                                <td>
                                    <span className={style['date']}>
                                        {group.text_meeting}
                                    </span>
                                </td>
                                <td>
                                    <span className={style['date']}>
                                        {group.teacher_name}
                                    </span>
                                </td>
                                <td className={style['actions-cell']}>
                                    <button className={style['btn-action']} title="Действия">•••</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}