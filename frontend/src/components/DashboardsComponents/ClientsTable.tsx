import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/client.module.css';
import { MoreAction } from '@/components/DashboardsComponents/clientsComponents/MoreActions.tsx';
import { deleteClient, getClient, addClient, updateClient } from '../../logic/ClientRequests.ts';
import { ClientTemplate, MoreActionProps } from "@/interfaces/ClientsInterfaces.ts";
import { TopUp } from "@/components/DashboardsComponents/clientsComponents/topUp.tsx";
import { UpdateClientForm } from '@/components/DashboardsComponents/clientsComponents/updateClientForm.tsx';

export const ClientTable: React.FC = () => {
    const [clients, setClient] = useState<ClientTemplate[]>([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [isResetModalWinOpen, setIsResetModalWinOpen] = useState(false);
    const [allGroups, setAllGroups] = useState<{ id: number; name: string }[]>([]);
    const [isMoreAction, setMoreAction] = useState(false);
    const [topUpClient, setTopUpClient] = useState<ClientTemplate | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
    const [menu, setMenu] = useState<MoreActionProps>({
        isOpen: false,
        x: 0,
        y: 0,
        client: null,
        onClose: () => { },
        onDelete: () => { }
    });

    const [resetFormData, setResetFormData] = useState<ClientTemplate>({
        id: 0,
        name: '',
        balance: 0,
        skills: 0,
        status: 0,
        contact: "",
        group_ids: [],
        group_names: [],
        next_visit: null
    });

    const [formData, setFormData] = useState<ClientTemplate>({
        id: 0,
        name: '',
        balance: 0,
        skills: 0,
        status: 0,
        contact: "",
        group_ids: [],
        group_names: [],
        next_visit: null
    });

    const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setResetFormData(prev => ({
            ...prev,
            [name]: name === 'status'
                ? (value === 'true' ? 1 : 0)
                : name === 'next_visit'
                    ? (value ? new Date(value) : null)
                    : value
        }));
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleRowClick = async (client: ClientTemplate) => {
        if (isReadOnly) return;
        if (isResetMode) {
            setResetFormData({
                id: client.id,
                name: client.name,
                balance: client.balance,
                skills: client.skills,
                status: client.status,
                contact: client.contact,
                group_ids: client.group_ids,
                group_names: client.group_names,
                next_visit: client.next_visit
            });
            setIsResetModalWinOpen(true);
        }
        if (isDeleteMode) {
            await deleteClient(client);
            setIsDeleteMode(false);
            setClient(await getClient());
            getCompanyGroups();
        }
    };

    const getCompanyGroups = async () => {
        try {
            const response = await fetch("http://localhost:3000/getgroups", { credentials: "include" });

            if (response.status === 403) {
                setIsReadOnly(true);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setAllGroups(data.data || []);
            }
        } catch (ex) {
            console.error("Ошибка загрузки групп:", ex);
        }
    };

    const handleAddClient = () => {
        setIsModalOpen(true);
    };

    const handleDelClient = () => {
        setIsDeleteMode(prev => !prev);
    };

    const handleResetClient = () => {
        setIsResetMode(prev => !prev);
    };

    useEffect(() => {
        setIsLoading(true);

        getClient()
            .then((data: any) => {
                if (data?.status === 403) {
                    setIsForbidden(true);
                } else if (data) {
                    setClient(data);
                }
            })
            .catch((err: any) => {
                if (err?.status === 403 || err?.message?.includes('403')) {
                    setIsForbidden(true);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });

        getCompanyGroups();
    }, []);

    useEffect(() => {
        const closeMenu = () => setMenu(prev => ({ ...prev, isOpen: false }));
        window.addEventListener("click", closeMenu);
        return () => window.removeEventListener("click", closeMenu);
    }, []);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'status'
                ? (value === 'true' ? 1 : 0)
                : name === 'next_visit'
                    ? (value ? new Date(value) : null)
                    : value
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(JSON.stringify(formData));
        await addClient(formData);
        getCompanyGroups();
        setClient(await getClient());
        setIsModalOpen(false);
    };

    const handleResetFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateClient(resetFormData);
        getCompanyGroups();
        setClient(await getClient());
        setIsResetModalWinOpen(false);
        setIsResetMode(false);
    };
    if (isLoading) {
        return (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                Загрузка списка клиентов...
            </div>
        );
    }
    if (isForbidden) {
        return (
            <div style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Доступ ограничен</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    У вашей роли недостаточно прав для просмотра базы клиентов.
                </p>
            </div>
        );
    }
    return (
        <>
            {isModalOpen && (<div>
                <div className={style['modal-overlay']} onClick={() => setIsModalOpen(false)}>
                    <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={style['modal-header']}>
                            <h3>Добавить клиента</h3>
                            <button className={style['btn-close']} onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className={style['form-grid']}>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Имя</label>
                                    <input
                                        type="text" name="name" required className={style['form-input']}
                                        value={formData.name} onChange={handleInputChange} placeholder="Иван Иванов Иванович"
                                    />
                                </div>
                                <div className={style['form-group']}>
                                    <label>Баланс</label>
                                    <input name="balance" type="number" className={style['form-input']} value={formData.balance} onChange={handleInputChange}></input>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Скилы</label>
                                    <input
                                        type="number" name="skills" className={style['form-input']}
                                        value={formData.skills} onChange={handleInputChange}
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Контакт</label>
                                    <input
                                        type="text" name="contact" required className={style['form-input']}
                                        value={formData.contact} onChange={handleInputChange} placeholder="+7 000 000 00 00"
                                    />
                                </div>

                                {/*<div className={style['form-group']}>
                                    <label>Статус</label>
                                    <div className={style['radio-container']}>
                                        <label className={style['radio-label']}>
                                            <input
                                                name="status" type="radio" value="true"
                                                checked={formData.status === 1} onChange={handleInputChange}
                                            />
                                            Активен
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input
                                                name="status" type="radio" value="false"
                                                checked={formData.status === 0} onChange={handleInputChange}
                                            />
                                            Неактивен
                                        </label>
                                    </div>
                                </div>*/}
                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Группы (зажмите Ctrl/Cmd для выбора нескольких)</label>
                                    <div className={style['select-wrapper']}>
                                        <select
                                            multiple
                                            name="group_ids"
                                            className={style['form-select']}
                                            value={formData.group_ids.map(String)}
                                            onChange={(e) => {
                                                const selectedOptions = Array.from(e.target.selectedOptions);
                                                const selectedIds = selectedOptions
                                                    .map(option => parseInt(option.value, 10))
                                                    .filter(id => !isNaN(id));

                                                setFormData(prev => ({
                                                    ...prev,
                                                    group_ids: selectedIds
                                                }));
                                            }}

                                            style={{ height: 'auto', minHeight: '100px' }}
                                        >
                                            <option value="">-- Без группы --</option>
                                            {allGroups.map(group => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
            </div>)}
            {isResetModalWinOpen && (
                <UpdateClientForm
                    setIsResetModalWinOpen={setIsResetModalWinOpen}
                    handleResetFormSubmit={handleResetFormSubmit}
                    resetFormData={resetFormData}
                    handleResetInputChange={handleResetInputChange}
                    setResetFormData={setResetFormData}
                    allGroups={allGroups}
                />
            )}
            {!isReadOnly && (
                <div className={style['content-header']}>
                    <div className={style['action-bar']}>
                        <div className={style['btn-group']}>
                            <button className={`${style.btn} ${style['btn-blue']}`} onClick={handleAddClient}>+ Добавить</button>
                            <button className={`${style.btn} ${isResetMode ? style['btn-gray'] : style['btn-light-blue']}`} onClick={handleResetClient}>{isResetMode ? 'Отменить' : 'Править'}</button>
                            <button
                                className={`${style.btn} ${isDeleteMode ? style['btn-gray'] : style['btn-red']}`}
                                onClick={handleDelClient}
                            >
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
                            <th>Клиент</th>
                            <th>Группа</th>
                            <th>Баланс</th>
                            <th>Доп. счет</th>
                            <th>Контакт</th>
                            {/*<th>Статус</th>*/}
                            <th>Следующее посещение</th>
                            {!isReadOnly && <th className={style['actions-cell']}>Действия</th>}
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
                                {/*<td>
                                    {renderStatus(client.status)}
                                </td>*/}
                                <td>
                                    {client.next_visit instanceof Date ? (
                                        <span className={style['visit-badge']}>
                                            <span className={style['visit-icon']}>📅</span>
                                            {client.next_visit.toLocaleDateString('ru-RU')}
                                        </span>
                                    ) : (
                                        <span className={`${style['visit-badge']} ${style['visit-empty']}`}>
                                            Нет занятий
                                        </span>
                                    )}
                                </td>

                                <td className={style['actions-cell']}>
                                    <button
                                        className={style['btn-action']}
                                        title="Действия"
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            setMenu({
                                                isOpen: true,
                                                x: e.clientX,
                                                y: e.clientY,
                                                client: client,

                                                onClose: () => {
                                                    setMoreAction(false);
                                                    setMenu(prev => ({ ...prev, isOpen: false }));
                                                },

                                                onDelete: async (clientToDelete) => {
                                                    await deleteClient(clientToDelete);

                                                    setMoreAction(false);
                                                    setMenu(prev => ({ ...prev, isOpen: false }));

                                                    const updatedData = await getClient();
                                                    if (updatedData) setClient(updatedData);
                                                    getCompanyGroups();
                                                }
                                            });

                                            setMoreAction(true);
                                        }}
                                    >
                                        •••
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
                {isMoreAction && (
                    <>
                        <MoreAction
                            x={menu.x}
                            y={menu.y}
                            isOpen={menu.isOpen}
                            client={menu.client}
                            onClose={() => setMenu(prev => ({ ...prev, isOpen: false }))}
                            onDelete={async (targetClient) => {
                                await deleteClient(targetClient);
                                setClient(await getClient());
                            }}
                            onTopUp={(targetClient) => {
                                setTopUpClient(targetClient);
                            }}
                            onEdit={(targetClient) => {
                                setResetFormData({
                                    id: targetClient.id,
                                    name: targetClient.name,
                                    balance: targetClient.balance,
                                    skills: targetClient.skills,
                                    status: targetClient.status,
                                    contact: targetClient.contact,
                                    group_ids: targetClient.group_ids || [],
                                    group_names: targetClient.group_names || [],
                                    next_visit: targetClient.next_visit || null
                                });
                                setIsResetModalWinOpen(true);
                            }}
                        />

                        {topUpClient && (
                            <TopUp
                                client={topUpClient}
                                onClose={() => setTopUpClient(null)}
                                onSuccess={async () => {
                                    const updatedData = await getClient();
                                    if (updatedData) setClient(updatedData);
                                    getCompanyGroups();
                                }}
                            />
                        )}

                    </>
                )}
            </div>
        </>
    );
};
