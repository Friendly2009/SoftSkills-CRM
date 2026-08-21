import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/group.module.css';

interface UserTemplate {
    id: number;
    full_name: string;
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
    max_students: number;
    nextMeeting?: Date | null;
    start_date: Date | null;
    end_date?: Date | null;
    is_end_time: boolean;
}
interface FormState {
    id: number;
    name: string;
    users_id: number;
    status: number;
    start_date: string;
    end_date: string;
    schedules: ScheduleItem[];
    max_students: number;
    is_end_time: boolean;
}

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
};

export const GroupTable: React.FC = () => {
    const [groups, setGroups] = useState<GroupTemplate[]>([]);
    const [users, setUsers] = useState<UserTemplate[]>([]);
    const [isAddGroup, setIsAddGroup] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [hasEndDate, setHasEndDate] = useState(false);
    const [isOpenModalWindow, setIsOpenModalWindow] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormState>({
        id: 0,
        name: '',
        users_id: 0,
        status: 1,
        max_students: 10,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        schedules: [{ day_of_week: 'Понедельник', start_time: '', end_time: '' }],
        is_end_time: false
    });
    const [updateFormData, setUpdateFormData] = useState<FormState>({
        id: 0,
        name: '',
        users_id: 0,
        status: 1,
        max_students: 10,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        schedules: [{ day_of_week: 'Понедельник', start_time: '', end_time: '' }],
        is_end_time: false
    });

    const handleDelGroup = () => {
        setIsDeleteMode(prev => !prev);
    };
    const handleUpdateGroup = () => {
        setIsUpdateMode(prev => !prev);
    };
    const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUpdateFormData(prev => ({
            ...prev,
            [name]: name === 'status' || name === 'users_id'
                ? Number(value)
                : value
        }));
    };
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
    const handleSheduleUpdateChange = (index: number, field: keyof ScheduleItem, value: string) => {
        setUpdateFormData(prev => {
            const updatedSchedules = [...prev.schedules];
            updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
            return {
                ...prev,
                schedules: updatedSchedules
            };
        });
    };
    const addScheduleField = () => {
        setFormData(prev => ({
            ...prev,
            schedules: [...prev.schedules, { day_of_week: 'Понедельник', start_time: '', end_time: '' }]
        }));
    };
    const getStatusLabel = (status: number) => {
        if (status === 1) return 'Набор';
        if (status === 2) return 'Активна';
        return 'Архив';
    };
    const addUpdateSheduleField = () => {
        setUpdateFormData(prev => ({
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
    const removeUpdateSheduleField = (index: number) => {
        setUpdateFormData(prev => {
            if (prev.schedules.length === 1) return prev;
            return {
                ...prev,
                schedules: prev.schedules.filter((_, i) => i !== index)
            };
        });
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
                    schedules: formData.schedules,
                    max_students: formData.max_students
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при сохранении группы');
            }

            setIsAddGroup(false);
            setHasEndDate(false);
            setFormData({
                id: 0,
                name: '',
                users_id: 0,
                status: 1,
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                max_students: 10,
                schedules: [{ day_of_week: 'Понедельник', start_time: '', end_time: '' }],
                is_end_time: false
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

            if (response.status === 403) {
                setIsForbidden(true);
                return;
            }

            if (!response.ok) throw new Error('oooops, something went wrong');
            const rows = await response.json();
            const rawGroups = rows.data || [];

            const formattedGroups = rawGroups.map((group: any) => ({
                ...group,
                start_date: group.start_date ? new Date(group.start_date) : null,
                end_date: group.end_date ? new Date(group.end_date) : null,
                nextMeeting: group.nextMeeting ? new Date(group.nextMeeting) : null
            }));

            setGroups(formattedGroups);
        } catch (ex) {
            console.error(ex);
            alert('Не удалось загрузить группы');
        }
    };
    const getUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/getusers', {
                credentials: "include"
            });

            if (response.status === 403) {
                setIsReadOnly(true);
                return;
            }

            if (!response.ok) throw new Error('Ошибка при загрузке сотрудников');
            const rows = await response.json();
            setUsers(rows.data || []);
        } catch (ex) {
            console.error(ex);
        }
    };
    const handleAddGroup = () => {
        setIsAddGroup(true);
    };
    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        for (let i = 0; i < updateFormData.schedules.length; i++) {
            const item = updateFormData.schedules[i];

            if (item.start_time && item.end_time && item.start_time >= item.end_time) {
                alert(`Ошибка в расписании (${item.day_of_week}): время начала занятия должно быть раньше времени окончания!`);
                return;
            }
        }
        try {
            const { id, ...bodyData } = updateFormData;
            console.log('start updating group');

            const payload = {
                ...bodyData,
                end_date: (!hasEndDate || bodyData.end_date === "") ? null : bodyData.end_date
            };

            const response = await fetch(`http://localhost:3000/updategroup/${id}`, {
                method: 'PATCH',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Не удалось обновить группу');
            setIsUpdateMode(false);
            getGroup();
            setIsOpenModalWindow(false);
        } catch (error) {
            console.error(error);
            alert('Ошибка обновления группы');
        }
    };
    const handleRowClick = async (group: GroupTemplate) => {
        if (isReadOnly) return;
        if (isDeleteMode) {
            if (!window.confirm(`Вы действительно хотите удалить группу ${group.name}?`)) {
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/deletegroup/${group.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    setGroups(prev => prev.filter(g => g.id !== group.id));
                } else {
                    alert(result.message || "Ошибка при удалении");
                }
            } catch (error) {
                console.error("Ошибка при удалении группы:", error);
                alert("Не удалось выполнить удаление.");
            } finally {
                setIsDeleteMode(false);
            }
        }

        if (isUpdateMode) {
            setIsDeleteMode(false);

            setUpdateFormData({
                id: group.id,
                name: group.name,
                users_id: group.users_id,
                status: group.status,
                max_students: group.max_students,
                start_date: group.start_date ? group.start_date.toISOString().split('T')[0] : '',
                end_date: group.end_date ? group.end_date.toISOString().split('T')[0] : '',
                schedules: group.schedules,
                is_end_time: !!group.end_date
            });

            setHasEndDate(!!group.end_date);
            setIsOpenModalWindow(true);
        }
    };
    useEffect(() => {
        setIsLoading(true);
        Promise.all([getGroup(), getUsers()]).finally(() => {
            setIsLoading(false);
        });
    }, []);
    if (isLoading) {
        return (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                Загрузка списка групп...
            </div>
        );
    }
    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли нет доступа к просмотру групп.
                </p>
            </div>
        );
    }
    return (
        <>
            {isOpenModalWindow && (
                <div className={style['modal-overlay']} onClick={() => setIsOpenModalWindow(false)}>
                    <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={style['modal-header']}>
                            <h3>Редактировать группу</h3>
                            <button className={style['btn-close']} onClick={() => setIsOpenModalWindow(false)}>×</button>
                        </div>

                        <form onSubmit={handleUpdateSubmit}>
                            <div className={style['form-grid']}>
                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Название группы</label>
                                    <input
                                        type="text" name="name" required className={style['form-input']}
                                        value={updateFormData.name} onChange={handleUpdateInputChange} placeholder="Typescript по пятницам (старшая)"
                                    />
                                </div>
                                <div className={style['form-group']}>
                                    <label>Преподаватель</label>
                                    <select
                                        name="users_id" required className={style['form-input']}
                                        value={updateFormData.users_id || ''} onChange={handleUpdateInputChange}
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
                                            <input name="status" type="radio" value="1" checked={updateFormData.status === 1} onChange={handleUpdateInputChange} />
                                            Набор
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input name="status" type="radio" value="2" checked={updateFormData.status === 2} onChange={handleUpdateInputChange} />
                                            Активна
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input name="status" type="radio" value="0" checked={updateFormData.status === 0} onChange={handleUpdateInputChange} />
                                            Архив
                                        </label>
                                    </div>
                                </div>
                                <div className={style['form-group']}>
                                    <label>Дата начала работы группы</label>
                                    <input
                                        type="date" name="start_date" required className={style['form-input']}
                                        value={typeof updateFormData.start_date === 'string' ? updateFormData.start_date : (updateFormData.start_date as any).toISOString().split('T')[0]}
                                        onChange={handleUpdateInputChange}
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
                                                    setUpdateFormData(prev => ({ ...prev, end_date: '' }));
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
                                        value={typeof updateFormData.end_date === 'string' ? updateFormData.end_date : (updateFormData.end_date as any).toISOString().split('T')[0]}
                                        onChange={handleUpdateInputChange}
                                    />

                                </div>
                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Максимальное количество учеников</label>
                                    <input
                                        type="number" name="max_students" required className={style['form-input']}
                                        value={updateFormData.max_students} onChange={handleUpdateInputChange}
                                    />
                                </div>
                                <div className={`${style['form-group']} ${style['full-width']}`} style={{ marginTop: '15px' }}>
                                    <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Расписание занятий</label>
                                    {updateFormData.schedules.map((schedule, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                            <select
                                                value={schedule.day_of_week}
                                                onChange={(e) => handleSheduleUpdateChange(index, 'day_of_week', e.target.value)}
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
                                                type="time"
                                                value={schedule.start_time && typeof schedule.start_time === 'string' ? schedule.start_time.slice(0, 5) : ''}
                                                required
                                                className={style['form-input']}
                                                style={{ flex: 1.5 }}
                                                onChange={(e) => handleSheduleUpdateChange(index, 'start_time', e.target.value)}
                                            />

                                            <span style={{ alignSelf: 'center' }}>—</span>

                                            <input
                                                type="time"
                                                value={schedule.end_time && typeof schedule.end_time === 'string' ? schedule.end_time.slice(0, 5) : ''}
                                                required
                                                className={style['form-input']}
                                                style={{ flex: 1.5 }}
                                                onChange={(e) => handleSheduleUpdateChange(index, 'end_time', e.target.value)}
                                            />

                                            {updateFormData.schedules.length > 1 && (
                                                <button
                                                    type="button" onClick={() => removeUpdateSheduleField(index)}
                                                    style={{ padding: '5px 10px', cursor: 'pointer', background: 'none', border: 'none', color: '#ff4d4d', fontSize: '18px' }}
                                                >✕</button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button" onClick={addUpdateSheduleField} className={style['btn-secondary']}
                                        style={{ padding: '5px 10px', fontSize: '13px', marginTop: '5px' }}
                                    >+ Добавить день</button>
                                </div>
                            </div>

                            <div className={style['form-actions']} style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className={style['btn-secondary']} onClick={() => setIsOpenModalWindow(false)}>Отмена</button>
                                <button type="submit" className={style['btn-primary']}>Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
                                        value={typeof formData.start_date === 'string' ? formData.start_date : ''}
                                        onChange={handleInputChange}
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
                                        value={typeof formData.end_date === 'string' ? formData.end_date : ''}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Максимальное количество учеников</label>
                                    <input
                                        type="number" name="max_students" required className={style['form-input']}
                                        value={formData.max_students} onChange={handleInputChange}
                                    />
                                </div>

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
                                                type="time"
                                                value={schedule.start_time ? schedule.start_time.slice(0, 5) : ''}
                                                required
                                                className={style['form-input']}
                                                style={{
                                                    flex: 1.5,
                                                    border: (schedule.start_time && schedule.end_time && schedule.start_time >= schedule.end_time) ? '1px solid #ff4d4d' : undefined
                                                }}
                                                onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                                            />
                                            <span style={{ alignSelf: 'center' }}>—</span>
                                            <input
                                                type="time"
                                                value={schedule.end_time ? schedule.end_time.slice(0, 5) : ''}
                                                required
                                                className={style['form-input']}
                                                style={{
                                                    flex: 1.5,
                                                    border: (schedule.start_time && schedule.end_time && schedule.start_time >= schedule.end_time) ? '1px solid #ff4d4d' : undefined
                                                }}
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
            {!isReadOnly && (
                <div className={style['content-header']}>
                    <div className={style['action-bar']}>
                        <div className={style['btn-group']}>
                            <button className={`${style.btn} ${style['btn-blue']}`} onClick={handleAddGroup}>+ Добавить</button>
                            <button className={`${style.btn} ${isUpdateMode ? style['btn-gray'] : style['btn-light-blue']}`} onClick={handleUpdateGroup}>{isUpdateMode ? 'Отменить' : 'Править'}</button>
                            <button className={`${style.btn} ${isDeleteMode ? style['btn-gray'] : style['btn-red']}`} onClick={handleDelGroup}>
                                {isDeleteMode ? 'Отменить' : 'Удалить'}
                            </button>
                        </div>
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
                            <tr key={group.id} onClick={() => handleRowClick(group)}>
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
                                    {group.studentsCount} / {group.max_students}
                                </td>
                                <td>
                                    <span className={style['date']}>
                                        {group.nextMeeting ? group.nextMeeting.toLocaleDateString('ru-RU') : '—'}
                                    </span>
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