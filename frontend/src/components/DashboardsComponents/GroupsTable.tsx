import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/group.module.css';

interface GroupTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}

export interface ScheduleItem {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

export interface GroupTemplate {
    id: number;
    name: string;
    users_id: number;
    status: number;
    schedules: ScheduleItem[];

    teacher?: string;
    studentsCount?: number;
    maxStudents?: number;
    nextMeeting?: string;
}

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
};


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
    const getGroup = async () => {
        try {
            const response = await fetch('http://localhost:3000/getgroups', {
                credentials: "include"
            });
            if (!response) {
                throw new Error('oooops, something went wrong');
            }
            const rows = await response.json();
            setGroups(rows.data || []);
        } catch (ex) {
            console.log(ex);
            alert('something went wrong...');
        }
    };
    const handleAddGroup = () => {
        setIsAddGroup(true);
    };
    useEffect(() => {
        getGroup();
        setPlusAction(() => handleAddGroup);

        return () => {
            setPlusAction(null);
        };
    }, []);
    useEffect(() => {
        getGroup();
    }, []);
    const getStatusLabel = (status: GroupTemplate['status']) => {
        if (status === 2) return 'Активна';
        if (status === 1) return 'Набор';
        return 'Архив';
    };
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
                            <th>Расписание</th>
                            <th>Ученики</th>
                            <th>Следующий урок</th>
                            <th>Статус</th>
                            <th className={style['actions-cell']}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group) => (
                            <tr key={group.id}>
                                <td>
                                    <div className={style['group-info']}>
                                        <div>
                                            <div className={style['group_name']}>{group.name}</div>
                                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                                                {group.teacher}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {group.schedules && group.schedules.length > 0 ? (
                                            group.schedules.map((item, index) => (
                                                <div key={index} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                    <strong style={{ color: '#475569', marginRight: '4px' }}>
                                                        {item.day_of_week}:
                                                    </strong>
                                                    <span style={{ color: '#64748b' }}>
                                                        {formatTime(item.start_time)} – {formatTime(item.end_time)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                                                Нет расписания
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td style={{ fontWeight: 500 }}>
                                    {group.studentsCount} / {group.maxStudents}
                                </td>
                                <td>
                                    <span className={style['date']}>{group.nextMeeting}</span>
                                </td>
                                <td>
                                    <span className={`
                  ${style['badge']} 
                  ${group.status === 2 ? style['is_active'] : style['is_not_active']}
                `}>
                                        {getStatusLabel(group.status)}
                                    </span>
                                </td>
                                <td className={style['actions-cell']}>
                                    <button className={style['btn-action']}>•••</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}