
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
};

export default Card;
