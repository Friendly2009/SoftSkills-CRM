import React from 'react';
import styles from '@/components/cssmoduls/Pricing.module.css';

interface PriceCardProps {
  level: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  badgeText?: string;
  onSelect: () => void;
}

export const PriceCard: React.FC<PriceCardProps> = ({ 
  level, 
  price, 
  period, 
  description,
  features, 
  buttonText, 
  isPopular = false, 
  badgeText, 
  onSelect 
}) => {
  
  const renderSubtext = (): string => {
    if (period === '/ год') {
      const numericPrice = parseInt(price.replace(/\s/g, ''), 10);
      const monthlyPrice = Math.round(numericPrice / 12);
      return `Всего ${monthlyPrice.toLocaleString('ru-RU')} ₽ в месяц`;
    }
    return description;
  };

  return (
    <div className={`${styles['price-card']} ${isPopular ? styles['price-card-popular'] : ''}`}>
      {isPopular && badgeText && (
        <div className={styles['badge-popular']}>{badgeText}</div>
      )}
      
      <div className={styles['price-level']}>{level}</div>
      
      <div className={styles['price-value']}>
        {price}
        {period && <span> {period}</span>}
      </div>
      
      <p className={styles['price-period']}>{renderSubtext()}</p>
      
      <ul className={styles['price-features']}>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      
      <button 
        className={isPopular ? styles['price-btn-primary'] : styles['price-btn']} 
        onClick={onSelect}
      >
        {buttonText}
      </button>
    </div>
  );
};
