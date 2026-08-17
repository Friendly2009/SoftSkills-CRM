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
      backgroundColor: 'rgba(0, 0, 0, 0.65)', 
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    title: {
      margin: '0 0 20px 0',
      fontSize: '20px',
      fontWeight: 600,
      color: '#f0f6fc',
      borderBottom: '1px solid #30363d',
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
      color: '#8b949e'
    },
    input: {
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: '6px',
      padding: '10px 12px',
      color: '#f0f6fc',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    textarea: {
      backgroundColor: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: '6px',
      padding: '10px 12px',
      color: '#f0f6fc',
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
      borderTop: '1px solid #30363d',
      paddingTop: '16px'
    },
    btnCancel: {
      backgroundColor: 'transparent',
      border: '1px solid #30363d',
      color: '#c9d1d9',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    btnSubmit: {
      backgroundColor: '#238636', 
      border: '1px solid rgba(240,246,252,0.1)',
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
        <h3 style={styles.title}>Add New Lead</h3>
        <form onSubmit={handleFormSubmit}>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name *</label>
            <input 
              type="text" 
              name="name" 
              style={styles.input}
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. John Doe"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contact Info *</label>
            <input 
              type="text" 
              name="contact" 
              style={styles.input}
              value={formData.contact} 
              onChange={handleChange} 
              placeholder="Phone or Telegram username"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Lead Source</label>
            <select 
              name="source" 
              style={styles.input} 
              value={formData.source} 
              onChange={handleChange}
            >
              <option value="">Select source...</option>
              <option value="Website">Website</option>
              <option value="VK">VKontakte</option>
              <option value="Telegram">Telegram</option>
              <option value="Recommendation">Recommendation</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Manager Notes</label>
            <textarea 
              name="description" 
              style={styles.textarea}
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Add details about preferences..."
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
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};