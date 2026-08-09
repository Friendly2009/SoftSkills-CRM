import React, { useState } from 'react';
import { ClientTemplate } from '@/interfaces/clientsInterfaces.ts';
import { updateClient } from '@/logic/ClientRequests';
interface TopUpProps {
    client: ClientTemplate;
    onClose: () => void;
    onSuccess: () => void;
}

export const TopUp: React.FC<TopUpProps> = ({ client, onClose, onSuccess }) => {
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const presets: number[] = [500, 1000, 2000, 5000];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount, 10);

        if (!numAmount || numAmount <= 0) {
            setMessage({ type: 'error', text: 'Введите корректную сумму пополнения' });
            return;
        }

        setLoading(true);
        setMessage(null);
        const currentBalance = Number(client.balance) || 0;
        const topUpAmount = Number(numAmount) || 0;

        const newBalance = currentBalance + topUpAmount;

        try {
            await updateClient({
                ...client,
                balance: newBalance
            });

            setMessage({ type: 'success', text: `Счет успешно пополнен на ${numAmount} ₽` });
            setAmount('');

            onSuccess();

            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка при пополнении. Попробуйте позже.' });
        } finally {
            setLoading(false);
        }
    };
    const styles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
        },
        container: {
            position: 'relative' as const,
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        closeButton: {
            position: 'absolute' as const,
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#9ca3af',
        },
        title: { margin: '0 0 6px 0', fontSize: '20px', color: '#1a1a1a' },
        clientInfo: { margin: '0 0 20px 0', fontSize: '14px', color: '#666666' },
        form: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
        group: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
        label: { fontSize: '13px', fontWeight: 500, color: '#4a4a4a' },
        input: {
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #cccccc',
            borderRadius: '8px',
            outline: 'none',
            backgroundColor: loading ? '#f5f5f5' : '#ffffff',
            cursor: loading ? 'not-allowed' : 'text',
            color: '#000000',
        },
        presetsList: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
        presetButton: {
            padding: '8px 4px',
            fontSize: '13px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            color: '#1a1a1a',
        },
        submitButton: {
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: loading || !amount ? '#93c5fd' : '#2563eb',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !amount ? 'not-allowed' : 'pointer',
        },
        messageBox: (type: 'success' | 'error') => ({
            padding: '10px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            textAlign: 'center' as const,
            backgroundColor: type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`,
        }),
    };
    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.container} onClick={(e) => e.stopPropagation()}>
                {onClose && (
                    <button style={styles.closeButton} onClick={onClose}>
                        &times;
                    </button>
                )}

                <h2 style={styles.title}>Пополнение счета</h2>
                <p style={styles.clientInfo}>
                    Клиент: <strong>{client.name || 'ID ' + client.id}</strong>
                </p>

                <form onSubmit={handleFormSubmit} style={styles.form}>
                    <div style={styles.group}>
                        <label htmlFor="amount" style={styles.label}>Сумма пополнения (₽)</label>
                        <input
                            type="text"
                            id="amount"
                            value={amount}
                            onChange={handleInputChange}
                            placeholder="Введите сумму"
                            disabled={loading}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.presetsList}>
                        {presets.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setAmount(preset.toString())}
                                disabled={loading}
                                style={styles.presetButton}
                            >
                                +{preset} ₽
                            </button>
                        ))}
                    </div>

                    {message && (
                        <div style={styles.messageBox(message.type)}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !amount}
                        style={styles.submitButton}
                    >
                        {loading ? 'Обработка...' : 'Пополнить баланс'}
                    </button>
                </form>
            </div>
        </div>
    );
};