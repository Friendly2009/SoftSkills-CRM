import React from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/clients.module.css';

export const ClientsTable: React.FC = () => {
    interface UserTemplate {
        full_name: string;
        role: string;
        rank: number;
        email: string;
        birthday: string | null;
        contact: string;
        gender: string | null;
    }

    const dummyUsers: UserTemplate[] = [
        {
            full_name: "Иван Иванов Иванович",
            role: "Директор",
            rank: 1000,
            email: "mail@example.com",
            birthday: null,
            contact: "+79190197884",
            gender: null
        },
        {
            full_name: "Сидоров Петр Алексеевич",
            role: "Менеджер",
            rank: 500,
            email: "sidorov@example.com",
            birthday: "15.05.1994",
            contact: "+79201234567",
            gender: "Мужской"
        },
        {
            full_name: "Ковалева Анна Сергеевна",
            role: "Педагог",
            rank: 800,
            email: "anna.teach@example.com",
            birthday: null,
            contact: "+79307654321",
            gender: "Женский"
        }
    ];

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
                        {dummyUsers.map((user, index) => (
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