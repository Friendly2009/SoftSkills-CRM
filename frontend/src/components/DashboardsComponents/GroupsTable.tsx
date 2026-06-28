import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/group.module.css';
interface UserTemplate {
    id: number;
    full_name: string;
}
interface GroupTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}
interface ScheduleItem {
    day_of_week: string;
    start_time: string;
    end_time: string;
}
interface GroupTemplate {
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
interface FormState {
    name: string;
    users_id: number;
    status: number;
    start_date: string;
    end_date: string;
    schedules: ScheduleItem[];
}
const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
};
export const GroupTable: React.FC<GroupTableProps> = ({ setPlusAction }) => {
    const [groups, setGroups] = useState<GroupTemplate[]>([]);
    const [users, setUsers] = useState<UserTemplate[]>([]);
    const [isAddGroup, setIsAddGroup] = useState(false);
    const [hasEndDate, setHasEndDate] = useState(false);
    const [formData, setFormData] = useState<FormState>({
        name: '',
        users_id: 0,
        status: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        schedules: [{ day_of_week: 'Понедельник', start_time: '', end_time: '' }]
    });
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status' || name === 'users_id'
                ? Number(value)
                : value
        }));
    };
    const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
        const updatedSchedules = [...formData.schedules];
        updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
        setFormData(prev => ({ ...prev, schedules: updatedSchedules }));
    };
    const addScheduleField = () => {
        setFormData(prev => ({
            ...prev,
            schedules: [...prev.schedules, { day_of_week: 'Понедельник', start_time: '', end_time: '' }]
        }));
    };
    const removeScheduleField = (index: number) => {
        if (formData.schedules.length === 1) return;
        setFormData(prev => ({
            ...prev,
            schedules: prev.schedules.filter((_, i) => i !== index)
        }));
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/creategroup', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    users_id: formData.users_id,
                    status: formData.status,
                    start_date: formData.start_date,
                    end_date: hasEndDate ? formData.end_date : null,
                    schedules: formData.schedules
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при сохранении группы');
            }

            const result = await response.json();
            alert(result.message || 'Группа успешно создана');

            setIsAddGroup(false);
            setHasEndDate(false);
            setFormData({
                name: '',
                users_id: 0,
                status: 1,
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                schedules: [{ day_of_week: 'Понедельник', start_time: '', end_time: '' }]
            });

            getGroup();
        } catch (ex) {
            console.error(ex);
            alert('Не удалось сохранить группу');
        }
    };
    const getGroup = async () => {
        try {
            const response = await fetch('http://localhost:3000/getgroups', {
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error('oooops, something went wrong');
            }
            const rows = await response.json();
            setGroups(rows.data || []);
        } catch (ex) {
            console.log(ex);
            alert('something went wrong...');
        }
    };
    const getUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/getusers', {
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error('Ошибка при загрузке сотрудников');
            }
            const rows = await response.json();

            setUsers(rows.data || []);
        } catch (ex) {
            console.error(ex);
        }
    };
    const handleAddGroup = () => {
        setIsAddGroup(true);
    };
    useEffect(() => {
        getGroup();
        getUsers();
        setPlusAction(() => handleAddGroup);

        return () => {
            setPlusAction(null);
        };
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

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Название группы</label>
                                    <input
                                        type="text" name="name" required className={style['form-input']}
                                        value={formData.name} onChange={handleInputChange} placeholder="Typescript по пятницам (старшая)"
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Преподаватель</label>
                                    <select
                                        name="users_id" required className={style['form-input']}
                                        value={formData.users_id || ''} onChange={handleInputChange}
                                    >
                                        <option value="" disabled>Выберите преподавателя</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Статус</label>
                                    <div className={style['radio-container']}>
                                        <label className={style['radio-label']}>
                                            <input name="status" type="radio" value="1" checked={formData.status === 1} onChange={handleInputChange} />
                                            Набор
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input name="status" type="radio" value="2" checked={formData.status === 2} onChange={handleInputChange} />
                                            Активна
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input name="status" type="radio" value="0" checked={formData.status === 0} onChange={handleInputChange} />
                                            Архив
                                        </label>
                                    </div>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Дата начала работы группы</label>
                                    <input
                                        type="date" name="start_date" required className={style['form-input']}
                                        value={formData.start_date} onChange={handleInputChange}
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '5px' }}>
                                        <input
                                            type="checkbox"
                                            checked={hasEndDate}
                                            onChange={(e) => {
                                                setHasEndDate(e.target.checked);
                                                if (!e.target.checked) {
                                                    setFormData(prev => ({ ...prev, end_date: '' }));
                                                }
                                            }}
                                        />
                                        До определенного дня
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className={style['form-input']}
                                        disabled={!hasEndDate}
                                        required={hasEndDate}
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* Блок расписания занятий */}
                                <div className={`${style['form-group']} ${style['full-width']}`} style={{ marginTop: '15px' }}>
                                    <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Расписание занятий</label>
                                    {formData.schedules.map((schedule, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                            <select
                                                value={schedule.day_of_week}
                                                onChange={(e) => handleScheduleChange(index, 'day_of_week', e.target.value)}
                                                className={style['form-input']} style={{ flex: 2 }}
                                            >
                                                <option value="Понедельник">Понедельник</option>
                                                <option value="Вторник">Вторник</option>
                                                <option value="Среда">Среда</option>
                                                <option value="Четверг">Четверг</option>
                                                <option value="Пятница">Пятница</option>
                                                <option value="Суббота">Суббота</option>
                                                <option value="Воскресенье">Воскресенье</option>
                                            </select>

                                            <input
                                                type="time" value={schedule.start_time} required className={style['form-input']} style={{ flex: 1.5 }}
                                                onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                                            />
                                            <span style={{ alignSelf: 'center' }}>—</span>
                                            <input
                                                type="time" value={schedule.end_time} required className={style['form-input']} style={{ flex: 1.5 }}
                                                onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                                            />

                                            {formData.schedules.length > 1 && (
                                                <button
                                                    type="button" onClick={() => removeScheduleField(index)}
                                                    style={{ padding: '5px 10px', cursor: 'pointer', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '18px' }}
                                                >✕</button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button" onClick={addScheduleField} className={style['btn-secondary']}
                                        style={{ padding: '5px 10px', fontSize: '13px', marginTop: '5px' }}
                                    >+ Добавить день</button>
                                </div>

                            </div>

                            <div className={style['form-actions']}>
                                <button type="button" className={style['btn-secondary']} onClick={() => setIsAddGroup(false)}>Отмена</button>
                                <button type="submit" className={style['btn-primary']}>Сохранить</button>
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