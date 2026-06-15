import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/clients.module.css';

interface ClientsTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
}
interface UserTemplate {
    id?: number;
    full_name: string;
    role: string;
    rank: number;
    email: string;
    birthday: string | null;
    contact: string;
    gender: string | null;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ setPlusAction }) => {
    const [users, setUsers] = useState<UserTemplate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        role: '',
        rank: 100,
        email: '',
        contact: '',
        birthday: '',
        gender: 'Муж',
        password: ''
    });

    const getUsers = async () => {
        try {
            const response = await fetch("http://localhost:3000/getusers", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error('oooops, something went wrong');
            }
            const data = await response.json();
            setUsers(data.data || []);
        } catch (ex) {
            console.error(ex);
        }
    }

    const handleAddUser = () => {
        setIsModalOpen(true);
    };

    useEffect(() => {
        getUsers();
        setPlusAction(() => handleAddUser);

        return () => {
            setPlusAction(null);
        };
    }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/adduser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            console.log("Пользователь успешно добавлен:", data);

            setIsModalOpen(false);

        } catch (error) {
            console.error("Не удалось отправить данные:", error);
            alert("Произошла ошибка при сохранении сотрудника.");
        }
    };


    return (
        <>
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
                                        value={formData.birthday} onChange={handleInputChange}
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Пол</label>
                                    <select name="gender" className={style['form-input']} value={formData.gender} onChange={handleInputChange}>
                                        <option value="Мужской">Муж</option>
                                        <option value="Женский">Жен</option>
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
                            <th className={style['actions-cell']}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={index}>
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
                                    {user.birthday ? user.birthday : <span className={style['text-muted']}>—</span>}
                                </td>
                                <td>
                                    {user.gender ? user.gender : <span className={style['text-muted']}>—</span>}
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