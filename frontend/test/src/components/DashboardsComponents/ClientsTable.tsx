import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/client.module.css';
//----------------mock import----------------//
import { mockUsers } from '../../data/users';
import { User } from "../../data/types";
interface ClientsTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}

interface UserTemplate {
    id: number;
    full_name: string;
    role: string;
    rank: number;
    email: string;
    birthday: string | null;
    contact: string;
    gender: string | null;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ setPlusAction, setDelAction }) => {
    const [users, setUsers] = useState<UserTemplate[]>([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
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
        setUsers(mockUsers);
    }

    const handleAddUser = () => {
        setIsModalOpen(true);
    };

    const handleDelUser = () => {
        setIsDeleteMode(prev => !prev);
    };


    useEffect(() => {
        getUsers();

        setPlusAction(() => handleAddUser);

        return () => {
            setPlusAction(null);
        };
    }, []);

    useEffect(() => {
        setDelAction({
            isActive: isDeleteMode,
            handler: handleDelUser
        });

        return () => {
            setDelAction(null);
        };
    }, [isDeleteMode]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newUser: User = {
            id: users.length + 1,
            company_id: 101,
            full_name: 'Иван Новый',
            email: 'new.user@company.com',
            role: 'User',
            rank: 1,
            contact: '+7 (999) 000-00-00',
            birthday: '2000-01-01',
            gender: 'male',
            password: 'new_password'
        };
        setUsers([...users, newUser]);
        getUsers();
        setIsModalOpen(false);
    };
    //----------------------------del-user----------------------------//
    const handleRowClick = async (user: UserTemplate) => {
        if (!isDeleteMode) return;

        if (user.rank === 1000) {
            alert("Нельзя удалить сотрудника с рангом 1000 (Директор)!");
            return;
        }

        if (!window.confirm(`Вы действительно хотите удалить сотрудника ${user.full_name}?`)) {
            return;
        }

        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
        getUsers();

        setIsDeleteMode(false);
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