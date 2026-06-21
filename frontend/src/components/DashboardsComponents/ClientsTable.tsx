import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/client.module.css';

interface ClientTableProps {
    setPlusAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
    setDelAction: React.Dispatch<React.SetStateAction<{ isActive: boolean; handler: () => void } | null>>;
}

interface ClientTemplate {
    id: number;
    name: string;
    active_group: string;
    balance: number;
    skills: number;
    status: boolean;
    contact: string;
    next_visit: string | null;
}

export const ClientTable: React.FC<ClientTableProps> = ({ setPlusAction, setDelAction }) => {

    const [client, setClient] = useState<ClientTemplate[]>([]);


    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };
    
    const handleRowClick = async (client: ClientTemplate) => {

    }

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
    }

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
    

    return (
        <>
            <div className={style['table-container']}>
                <table className={style['crm-table']}>
                    <thead>
                        <tr>
                            <th>Клиент</th>
                            <th>Группа</th>
                            <th>Баланс</th>
                            <th>Скилы</th>
                            <th>Статус</th>
                            <th>Контакт</th>
                            <th>Следующее посещение</th>
                            <th className={style['actions-cell']}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {client.map((client, index) => (
                            <tr key={index} onClick={() => handleRowClick(client)}>
                                <td>
                                    <div className={style['user-info']}>
                                        <div className={style['avatar-placeholder']}>
                                            {getInitials(client.name)}
                                        </div>
                                        <span className={style['user-fullname']}>{client.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${style.badge} ${style['badge-role']}`}>
                                        {client.active_group}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${style.badge} ${style['badge-rank']}`}>
                                        {client.balance}
                                    </span>
                                </td>
                                <td>{client.skills}</td>
                                <td>{client.contact}</td>
                                <td>
                                    {client.next_visit ? client.next_visit : <span className={style['text-muted']}>—</span>}
                                </td>
                                <td>
                                    {client.status ? client.status : <span className={style['text-muted']}>—</span>}
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
    );
}