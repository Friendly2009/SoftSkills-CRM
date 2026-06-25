import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/client.module.css';

interface ClientTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}

interface ClientTemplate {
    id: number;
    name: string;
    balance: number;
    skills: number;
    status: number;
    contact: string;
    company_id: number;
    group_ids: number[];
    group_names: string[];
}

export const ClientTable: React.FC<ClientTableProps> = ({ setPlusAction, setDelAction }) => {
    const [clients, setClient] = useState<ClientTemplate[]>([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleRowClick = async (client: ClientTemplate) => {
        // Логика клика на строку
    };

    const getClient = async () => {
        try {
            const response = await fetch("http://localhost:3000/getclient", {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error('oooops, something went wrong');
            }
            const data = await response.json();
            setClient(data.data || []);
        } catch (ex) {
            console.error(ex);
        }
    };

    const handleAddUser = () => {
        setIsModalOpen(true);
    };

    const handleDelUser = () => {
        setIsDeleteMode(prev => !prev);
    };

    useEffect(() => {
        getClient();
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

    const formatBalance = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
    };

    const renderStatus = (status: number) => {
        switch (status) {
            case 1:
                return <span className={`${style.badge} ${style['badge-active']}`}>Активен</span>;
            case 0:
                return <span className={`${style.badge} ${style['badge-inactive']}`}>Заморожен</span>;
            default:
                return <span className={style['text-muted']}>—</span>;
        }
    };

    return (
        <div className={style['table-container']}>
            <table className={style['crm-table']}>
                <thead>
                    <tr>
                        <th>Клиент</th>
                        <th>Группа</th>
                        <th>Баланс</th>
                        <th>Скилы</th>
                        <th>Контакт</th>
                        <th>Статус</th>
                        <th>Следующее посещение</th>
                        <th className={style['actions-cell']}>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map((client) => (
                        <tr key={client.id} onClick={() => handleRowClick(client)}>
                            <td>
                                <div className={style['user-info']}>
                                    <div className={style['avatar-placeholder']}>
                                        {getInitials(client.name)}
                                    </div>
                                    <span className={style['user-fullname']}>{client.name}</span>
                                </div>
                            </td>
                            <td>
                                <div className={style['groups-list']}>
                                    {client.group_names.length > 0 ? (
                                        client.group_names.map((name, i) => (
                                            <span key={i} className={`${style.badge} ${style['badge-group']}`}>
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className={style['text-muted']}>Нет группы</span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className={`${style['balance-text']} ${client.balance >= 0 ? style['positive'] : style['negative']}`}>
                                    {formatBalance(client.balance)}
                                </span>
                            </td>
                            <td>
                                <span className={style['skills-count']}>{client.skills}</span>
                            </td>
                            <td>
                                <span className={style['contact-text']}>{client.contact}</span>
                            </td>
                            <td>
                                {renderStatus(client.status)}
                            </td>                                
                            <td>        
                                coming soon...
                            </td>
                            <td className={style['actions-cell']}>
                                <button 
                                    className={style['btn-action']} 
                                    title="Действия"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    •••
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
