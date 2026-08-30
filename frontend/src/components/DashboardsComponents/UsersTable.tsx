import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/user.module.css';

interface UserTemplate {
    id: number;
    full_name: string;
    role: string;
    rank: number;
    email: string;
    birthday: Date | null;
    contact: string;
    gender: string | null;
}

export const UsersTable: React.FC = () => {
    const [users, setUsers] = useState<UserTemplate[]>([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReSetModalWinOpen, setIsReSetModalWinOpen] = useState(false);
    const [isReSetMode, setIsReSetMode] = useState(false);
    const [isForbiden, setIsForbiden] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        role: '',
        rank: 100,
        email: '',
        contact: '',
        birthday: null as Date | null,
        gender: 'Муж',
        password: ''
    });

    const [resetFormData, SetResetFormData] = useState({
        id: 0,
        full_name: '',
        role: '',
        rank: 100,
        email: '',
        contact: '',
        birthday: null as Date | null,
        gender: 'Муж',
        password: ''
    });

    const getUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/getusers`, {
                credentials: "include"
            });

            if (response.status === 403) {
                setIsForbiden(true);
                return; 
            }

            if (!response.ok) {
                throw new Error('oooops, something went wrong');
            }

            const data = await response.json();
            const rawUsers = data.data || [];

            const formattedUsers = rawUsers.map((user: any) => ({
                ...user,
                birthday: user.birthday ? new Date(user.birthday) : null
            }));

            setUsers(formattedUsers);
        } catch (ex) {
            console.error(ex);
        }
    };


    useEffect(() => {
        getUsers();
    }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status'
                ? (value === 'true' ? 1 : 0)
                : name === 'birthday'
                    ? (value ? new Date(value) : null)
                    : value
        }));
    };

    const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        SetResetFormData(prev => ({
            ...prev,
            [name]: name === 'status'
                ? (value === 'true' ? 1 : 0)
                : name === 'birthday'
                    ? (value ? new Date(value) : null)
                    : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                birthday: formData.birthday ? formData.birthday.toISOString().split('T')[0] : null
            };

            const response = await fetch(`${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/adduser`, {
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (response.status === 403) {
                alert('Ваших прав недостаточно для совершения этого действия');
                throw new Error('forbiden doing');
            }
            if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
            setIsModalOpen(false);
            getUsers();
        } catch (error) {
            console.error("Не удалось отправить данные:", error);
            alert("Произошла ошибка при сохранении сотрудника.");
        }
    };

    const handleResetFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...resetFormData,
                birthday: resetFormData.birthday ? resetFormData.birthday.toISOString().split('T')[0] : null
            };

            const response = await fetch(`${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/resetuser`, {
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (response.status === 403) {
                alert('Ваших прав недостаточно для совершения этого действия');
                throw new Error('forbiden doing');
            }
            if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
            setIsReSetModalWinOpen(false);
            setIsReSetMode(false);
            getUsers();
        } catch (error) {
            console.error("Не удалось отправить данные:", error);
            alert("Произошла ошибка при сохранении сотрудника.");
        }
    };

    const handleRowClick = async (user: UserTemplate) => {
        if (isDeleteMode) {
            if (user.rank === 1000) {
                alert("Нельзя удалить сотрудника с рангом 1000 (Директор)!");
                return;
            }

            if (!window.confirm(`Вы действительно хотите удалить сотрудника ${user.full_name}?`)) {
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_HOST}:${import.meta.env.VITE_PORT}/deluser/${user.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    setUsers(prev => prev.filter(u => u.id !== user.id));
                } else {
                    alert(result.message || "Ошибка при удалении");
                }
            } catch (error) {
                console.error("Ошибка при удалении пользователя:", error);
                alert("Не удалось выполнить удаление.");
            } finally {
                setIsDeleteMode(false);
            }
        }
        if (isReSetMode) {
            setIsDeleteMode(false);

            SetResetFormData({
                id: user.id,
                full_name: user.full_name,
                role: user.role,
                rank: user.rank,
                email: user.email,
                contact: user.contact,
                birthday: user.birthday ? new Date(user.birthday) : null,
                gender: user.gender || 'Муж',
                password: ''
            });

            setIsReSetModalWinOpen(true);
        }
    };

    const handlePlusClick = () => {
        setIsModalOpen(true);
    };

    const handleResetClick = () => {
        setIsReSetMode(prev => !prev);
    };

    const handleDelClick = () => {
        setIsDeleteMode(prev => !prev);
    };
    if (isForbiden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли нет доступа к просмотру сотрудников компании.
                </p>
            </div>
        );
    }
    return (
        <>
            {isReSetModalWinOpen && (
                <div className={style['modal-overlay']} onClick={() => setIsReSetModalWinOpen(false)}>
                    <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={style['modal-header']}>
                            <h3>Добавить сотрудника</h3>
                            <button className={style['btn-close']} onClick={() => setIsReSetModalWinOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleResetFormSubmit}>
                            <div className={style['form-grid']}>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>ФИО Сотрудника</label>
                                    <input
                                        type="text" name="full_name" required className={style['form-input']}
                                        value={resetFormData.full_name} onChange={handleResetInputChange} placeholder="Иван Иванов Иванович"
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Роль</label>
                                    <input name="role" type="text" className={style['form-input']} value={resetFormData.role} onChange={handleResetInputChange}></input>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Ранг</label>
                                    <input
                                        type="number" name="rank" className={style['form-input']}
                                        value={resetFormData.rank} onChange={handleResetInputChange}
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Эл. почта</label>
                                    <input
                                        type="email" name="email" required className={style['form-input']}
                                        value={resetFormData.email} onChange={handleResetInputChange} placeholder="mail@example.com"
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Телефон</label>
                                    <input
                                        type="text" name="contact" className={style['form-input']}
                                        value={resetFormData.contact} onChange={handleResetInputChange} placeholder="+79991112233"
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Пароль для входа</label>
                                    <input
                                        type="password" name="password" className={style['form-input']}
                                        value={resetFormData.password} onChange={handleResetInputChange} placeholder="•••••••••"
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>ДР</label>
                                    <input
                                        type="date" name="birthday" className={style['form-input']}
                                        value={resetFormData.birthday ? resetFormData.birthday.toISOString().split('T')[0] : ""} onChange={handleResetInputChange}
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Пол</label>
                                    <select name="gender" className={style['form-input']} value={resetFormData.gender} onChange={handleResetInputChange}>
                                        <option value="Муж">Муж</option>
                                        <option value="Жен">Жен</option>
                                    </select>
                                </div>

                            </div>

                            <div className={style['form-actions']}>
                                <button type="button" className={style['btn-secondary']} onClick={() => setIsReSetModalWinOpen(false)}>
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
            {isModalOpen && (
                <div className={style['modal-overlay']} onClick={() => setIsModalOpen(false)}>
                    <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={style['modal-header']}>
                            <h3>Добавить сотрудника</h3>
                            <button className={style['btn-close']} onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={style['form-grid']}>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>ФИО Сотрудника</label>
                                    <input
                                        type="text" name="full_name" required className={style['form-input']}
                                        value={formData.full_name} onChange={handleInputChange} placeholder="Иван Иванов Иванович"
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Роль</label>
                                    <input name="role" type="text" className={style['form-input']} value={formData.role} onChange={handleInputChange}></input>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Ранг</label>
                                    <input
                                        type="number" name="rank" className={style['form-input']}
                                        value={formData.rank} onChange={handleInputChange}
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Эл. почта</label>
                                    <input
                                        type="email" name="email" required className={style['form-input']}
                                        value={formData.email} onChange={handleInputChange} placeholder="mail@example.com"
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Телефон</label>
                                    <input
                                        type="text" name="contact" className={style['form-input']}
                                        value={formData.contact} onChange={handleInputChange} placeholder="+79991112233"
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Пароль для входа</label>
                                    <input
                                        type="password" name="password" className={style['form-input']}
                                        value={formData.password} onChange={handleInputChange} placeholder="•••••••••"
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>ДР</label>
                                    <input
                                        type="date" name="birthday" className={style['form-input']}
                                        value={formData.birthday ? formData.birthday.toISOString().split('T')[0] : ""} onChange={handleInputChange}
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Пол</label>
                                    <select name="gender" className={style['form-input']} value={formData.gender} onChange={handleInputChange}>
                                        <option value="Муж">Муж</option>
                                        <option value="Жен">Жен</option>
                                    </select>
                                </div>

                            </div>

                            <div className={style['form-actions']}>
                                <button type="button" className={style['btn-secondary']} onClick={() => setIsModalOpen(false)}>
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
            <div className={style['content-header']}>
                <div className={style['action-bar']}>
                    <div className={style['btn-group']}>
                        <button className={`${style.btn} ${style['btn-blue']}`} onClick={handlePlusClick}>+ Добавить</button>
                        <button className={`${style.btn} ${isReSetMode ? style['btn-gray'] : style['btn-light-blue']}`} onClick={handleResetClick}>{isReSetMode ? 'Отменить' : 'Править'}</button>
                        <button
                            className={`${style.btn} ${isDeleteMode ? style['btn-gray'] : style['btn-red']}`}
                            onClick={handleDelClick}
                        >
                            {isDeleteMode ? 'Отменить' : 'Удалить'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={style['table-container']}>
                <table className={style['crm-table']}>
                    <thead>
                        <tr>
                            <th>Сотрудник</th>
                            <th>Роль</th>
                            <th>Ранг</th>
                            <th>Эл. почта</th>
                            <th>Телефон</th>
                            <th>Др</th>
                            <th>Пол</th>
                            {/*<th className={style['actions-cell']}>Действия</th>*/}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={index} onClick={() => handleRowClick(user)}>
                                <td>
                                    <div className={style['user-info']}>
                                        <div className={style['avatar-placeholder']}>
                                            {getInitials(user.full_name)}
                                        </div>
                                        <span className={style['user-fullname']}>{user.full_name}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${style.badge} ${style['badge-role']}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${style.badge} ${style['badge-rank']}`}>
                                        {user.rank}
                                    </span>
                                </td>
                                <td>{user.email}</td>
                                <td>{user.contact}</td>
                                <td>
                                    {user.birthday ? user.birthday.toLocaleDateString('ru-RU') : <span className={style['text-muted']}>—</span>}
                                </td>

                                <td>
                                    {user.gender ? user.gender : <span className={style['text-muted']}>—</span>}
                                </td>
                                {/*<td className={style['actions-cell']}>
                                    <button className={style['btn-action']} title="Действия">•••</button>
                                </td>*/}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}