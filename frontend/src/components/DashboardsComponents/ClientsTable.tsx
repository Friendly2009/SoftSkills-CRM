import React, { useEffect, useState } from "react";
import style from '../cssmoduls/DashboardComponentsCssModuls/client.module.css';
import { MoreAction } from '../DashboardsComponents/clientsComponents/MoreActions.tsx'
interface ClientTemplate {
    id: number;
    name: string;
    balance: number;
    skills: number;
    status: number;
    contact: string;
    group_ids: number[];
    group_names: string[];
    next_visit: string;
}

export const ClientTable: React.FC = () => {
    const [clients, setClient] = useState<ClientTemplate[]>([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [isResetModalWinOpen, setIsResetModalWinOpen] = useState(false);
    const [allGroups, setAllGroups] = useState<{ id: number; name: string }[]>([]);
    const [isMoreAction, setMoreAction] = useState(false);
    const [menu, setMenu] = useState<{
        isOpen: boolean;
        x: number;
        y: number;
        clientId: number | null;
    }>({
        isOpen: false,
        x: 0,
        y: 0,
        clientId: null,
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
        next_visit: ""
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
        next_visit: ""
    });
    const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setResetFormData(prev => ({
            ...prev,
            [name]: name === 'status'
                ? (value === 'true' ? 1 : 0)
                : value
        }));
    };
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };
    const handleRowClick = async (client: ClientTemplate) => {
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
                next_visit: ''
            });
            setIsResetModalWinOpen(true);
        }
        if (isDeleteMode) {
            try {
                const response = await fetch(`http://localhost:3000/delclients/${client.id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
                console.log("User was deleted");

                setIsDeleteMode(false);
                getClient();
                getCompanyGroups();
            } catch (ex) {
                console.error(ex);
            }
        }
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
    const getCompanyGroups = async () => {
        try {
            const response = await fetch("http://localhost:3000/getgroups", { credentials: "include" });
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
        getClient();
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
                : value
        }));
    };
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(JSON.stringify(formData));
        try {
            const response = await fetch('http://localhost:3000/addclients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error("something went wrong");
            }

            const data = await response.json();
            console.log(data);
            getCompanyGroups();
            getClient();
            setIsModalOpen(false);
        } catch (ex) {
            alert("Произошла ошибка при отправке данных");
            console.error(ex);
        }
    }
    const handleResetFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:3000/updateclient/${resetFormData.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(resetFormData)
            });

            if (!response) {
                throw new Error("something went wrong");
            }
            const data = await response.json();
            console.log(data);
            getCompanyGroups();
            getClient();
            setIsResetModalWinOpen(false);
            setIsResetMode(false);
        } catch (ex) {
            console.log(ex);
            alert('something went wrong');
        }
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

                                <div className={style['form-group']}>
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
                                </div>
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
            {isResetModalWinOpen && (<div>
                <div className={style['modal-overlay']} onClick={() => setIsResetModalWinOpen(false)}>
                    <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={style['modal-header']}>
                            <h3>Добавить Клиента</h3>
                            <button className={style['btn-close']} onClick={() => setIsResetModalWinOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleResetFormSubmit}>
                            <div className={style['form-grid']}>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Имя</label>
                                    <input
                                        type="text" name="name" required className={style['form-input']}
                                        value={resetFormData.name} onChange={handleResetInputChange} placeholder="Иван Иванов Иванович"
                                    />
                                </div>
                                <div className={style['form-group']}>
                                    <label>Баланс</label>
                                    <input name="balance" type="number" className={style['form-input']} value={resetFormData.balance} onChange={handleResetInputChange}></input>
                                </div>

                                <div className={style['form-group']}>
                                    <label>Скилы</label>
                                    <input
                                        type="number" name="skills" className={style['form-input']}
                                        value={resetFormData.skills} onChange={handleResetInputChange}
                                    />
                                </div>

                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Контакт</label>
                                    <input
                                        type="text" name="contact" required className={style['form-input']}
                                        value={resetFormData.contact} onChange={handleResetInputChange} placeholder="+7 000 000 00 00"
                                    />
                                </div>

                                <div className={style['form-group']}>
                                    <label>Статус</label>
                                    <div className={style['radio-container']}>
                                        <label className={style['radio-label']}>
                                            <input
                                                name="status" type="radio" value="true"
                                                checked={resetFormData.status === 1} onChange={handleResetInputChange}
                                            />
                                            Активен
                                        </label>
                                        <label className={style['radio-label']}>
                                            <input
                                                name="status" type="radio" value="false"
                                                checked={resetFormData.status === 0} onChange={handleResetInputChange}
                                            />
                                            Неактивен
                                        </label>
                                    </div>
                                </div>
                                <div className={`${style['form-group']} ${style['full-width']}`}>
                                    <label>Группы (зажмите Ctrl/Cmd для выбора нескольких)</label>
                                    <div className={style['select-wrapper']}>
                                        <select
                                            multiple
                                            name="group_ids"
                                            className={style['form-select']}
                                            value={resetFormData.group_ids.map(String)}
                                            onChange={(e) => {
                                                const selectedOptions = Array.from(e.target.selectedOptions);
                                                const selectedIds = selectedOptions
                                                    .map(option => parseInt(option.value, 10))
                                                    .filter(id => !isNaN(id));

                                                setResetFormData(prev => ({
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
                                <button type="button" className={style['btn-secondary']} onClick={() => setIsResetModalWinOpen(false)}>
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
                                    {client.next_visit && client.next_visit.trim() !== "" ? (
                                        <span className={style['visit-badge']}>
                                            <span className={style['visit-icon']}>📅</span>
                                            {client.next_visit}
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
                                                clientId: client.id
                                            });
                                            setMoreAction(prev => !prev)
                                        }}
                                    >
                                        •••
                                    </button>
                                </td>
                                {isMoreAction && (
                                    <MoreAction
                                        isOpen={menu.isOpen}
                                        x={menu.x}
                                        y={menu.y}
                                        onOpen={() => console.log("Открываем клиента с ID:", menu.clientId)}
                                        onTopUp={() => console.log("Пополняем баланс клиенту с ID:", menu.clientId)}
                                        onEdit={() => console.log("Редактируем клиента с ID:", menu.clientId)}
                                        onDelete={() => console.log("Удаляем клиента с ID:", menu.clientId)}
                                    />
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};
