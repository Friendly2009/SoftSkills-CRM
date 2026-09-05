import React from "react";
import style from '@/components/cssmoduls/dashboardcomponentscssmoduls/client.module.css';
import { ClientTemplate } from "@/interfaces/clientsInterfaces";

interface UpdateClientFormProps {
    setIsResetModalWinOpen: (isOpen: boolean) => void;
    handleResetFormSubmit: (e: React.FormEvent) => Promise<void> | void;
    resetFormData: ClientTemplate;
    handleResetInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    setResetFormData: React.Dispatch<React.SetStateAction<ClientTemplate>>;
    allGroups: { id: number; name: string }[];
}

export const UpdateClientForm: React.FC<UpdateClientFormProps> = ({
    setIsResetModalWinOpen,
    handleResetFormSubmit,
    resetFormData,
    handleResetInputChange,
    setResetFormData,
    allGroups
}) => {
    return (
        <div>
            <div className={style['modal-overlay']} onClick={() => setIsResetModalWinOpen(false)}>
                <div className={style['modal-content']} onClick={(e) => e.stopPropagation()}>
                    <div className={style['modal-header']}>
                        <h3>Редактировать Клиента</h3>
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
                                <input 
                                    name="balance" type="number" className={style['form-input']} 
                                    value={resetFormData.balance} onChange={handleResetInputChange}
                                />
                            </div>

                            {/*<div className={style['form-group']}>
                                <label>Скилы</label>
                                <input
                                    type="number" name="skills" className={style['form-input']}
                                    value={resetFormData.skills} onChange={handleResetInputChange}
                                />
                            </div>*/}

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
                                        value={resetFormData.group_ids?.map(String) || []}
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
        </div>
    );
};
