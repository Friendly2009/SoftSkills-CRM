import { ICreateLeadDto } from "@/interfaces/LeadInterfaces";
import { useState } from "react";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ICreateLeadDto) => Promise<void>;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ICreateLeadDto>({
    name: '',
    contact: '',
    source: '',
    description: ''
  });
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', contact: '', source: '', description: '' });
      onClose();
    } catch (error) {
      console.error("Ошибка при отправке лида на бэкенд:", error);
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
      backgroundColor: 'rgba(15, 23, 42, 0.3)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#ffffff', 
      border: '1px solid #eef2f5',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', 
      color: '#2c3e50', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    title: {
      margin: '0 0 20px 0',
      fontSize: '20px',
      fontWeight: 600,
      color: '#1d3557',
      borderBottom: '1px solid #eef2f5',
      paddingBottom: '12px'
    },
    formGroup: {
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#64748b' 
    },
    input: {
      backgroundColor: '#f8fafc', 
      border: '1px solid #cbd5e1', 
      borderRadius: '6px',
      padding: '10px 12px',
      color: '#334155',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    textarea: {
      backgroundColor: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      padding: '10px 12px',
      color: '#334155',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical' as const,
      outline: 'none'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px',
      borderTop: '1px solid #eef2f5',
      paddingTop: '16px'
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      border: 'none',
      color: '#475569',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    btnSubmit: {
      backgroundColor: '#1d3557', 
      border: 'none',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500
    }
  };


  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Добавление нового лида</h3>
        <form onSubmit={handleFormSubmit}>

          <div style={styles.formGroup}>
            <label style={styles.label}>ФИО</label>
            <input
              type="text"
              name="name"
              style={styles.input}
              value={formData.name}
              onChange={handleChange}
              placeholder="Иван Иванов Иванович"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Контакты</label>
            <input
              type="text"
              name="contact"
              style={styles.input}
              value={formData.contact}
              onChange={handleChange}
              placeholder="Контакт"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Лид ресурсы</label>
            <select
              name="source"
              style={styles.input}
              value={formData.source}
              onChange={handleChange}
            >
              <option value="">Выбрать ресурс...</option>
              <option value="Website">Сайты</option>
              <option value="VK">ВКонтакте</option>
              <option value="Telegram">Телеграм</option>
              <option value="Recommendation">Рекомендации</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Управление записями</label>
            <textarea
              name="description"
              style={styles.textarea}
              value={formData.description}
              onChange={handleChange}
              placeholder="Добавьте детали..."
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.btnCancel}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Лид создан'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};