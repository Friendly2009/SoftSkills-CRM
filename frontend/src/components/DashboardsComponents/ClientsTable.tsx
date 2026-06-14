import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/clients.module.css';

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

export const ClientsTable: React.FC = () => {

    const [users, setUsers] = useState<UserTemplate[]>([]);

    const getUsers = async () => {
        try {
            const response = await fetch("http://localhost:3000/getusers",{
                credentials: "include"
            });
            
            if (!response.ok) {
                throw new Error('oooops, something went wrong');
            }
            const data = await response.json();
            setUsers(data.data || []);
        } catch (ex) {
            alert(ex);
        }
    }
    useEffect(() => {
        getUsers();
    }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };
    return (
        <>
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
                                    <button className={style['btn-action']} title="Действия">
                                        •••
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}