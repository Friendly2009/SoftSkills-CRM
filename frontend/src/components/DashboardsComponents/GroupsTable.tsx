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
export const GroupTable: React.FC<GroupTableProps> = ({ setPlusAction }) => {
    const [groups, setGroups] = useState<GroupTemplate[]>([]);
    const [isAddGroup, setIsAddGroup] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        status: false,
        last_meeting: '',
        next_meeting: '',
        teacher_name: ''
    });
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = () => {

    }
    const addFiveMockGroups = () => {
        const mockGroups: GroupTemplate[] = Array.from({ length: 5 }, (_, index) => {
            const uniqueId = Date.now() + index;

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
    const handleAddGroup = () => {
        setIsAddGroup(true);
    };
    useEffect(() => {
        addFiveMockGroups();
        setPlusAction(() => handleAddGroup);

        return () => {
            setPlusAction(null);
        };
    }, []);
    useEffect(() => {
        addFiveMockGroups();
    }, []);
    return (
        <>
            {isAddGroup === true && (
                <div className={style['modal-overlay']} onClick={() => setIsAddGroup(false)}>
                    <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={style['modal-header']}>
                            <h3>Добавить группу</h3>
                            <button className={style['btn-close']} onClick={() => setIsAddGroup(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={style['form-grid']}>

                                {/* РЯД 1: Название на всю ширину */}
                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Название группы</label>
                                    <input
                                        type="text" name="name" required className={style['form-input']}
                                        value={formData.name} onChange={handleInputChange} placeholder="Typescript по пятницам (старшая)"
                                    />
                                </div>

                                {/* РЯД 2: Обе даты встают симметрично бок о бок */}
                                <div className={style['form-group']}>
                                    <label>Последняя работа</label>
                                    <input
                                        type="date" name="last_meeting" className={style['form-input']}
                                        value={formData.last_meeting} onChange={handleInputChange}
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Следующая работа</label>
                                    <input
                                        type="date" name="next_meeting" required className={style['form-input']}
                                        value={formData.next_meeting} onChange={handleInputChange}
                                    />
                                </div>

                                {/* РЯД 3: Статус и Преподаватель в один ряд */}
                                <div className={style['form-group']}>
                                    <label>Статус</label>
                                    <div className={style['radio-container']}>
                                        <label className={style['radio-label']}>
                                            <input
                                                name="status" type="radio" value="true"
                                                checked={formData.status === true} onChange={handleInputChange}
                                            />
                                            Активен
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input
                                                name="status" type="radio" value="false"
                                                checked={formData.status === false} onChange={handleInputChange}
                                            />
                                            Неактивен
                                        </label>
                                    </div>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Преподаватель</label>
                                    <input
                                        type="text" name="teacher_name" className={style['form-input']}
                                        value={formData.teacher_name} onChange={handleInputChange}
                                    />
                                </div>

                            </div>


                            <div className={style['form-actions']}>
                                <button type="button" className={style['btn-secondary']} onClick={() => setIsAddGroup(false)}>
                                    Отмена
                                </button>
                                <button type="submit" className={style['btn-primary']}>
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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