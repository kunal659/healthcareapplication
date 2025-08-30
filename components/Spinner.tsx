
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-16 h-16 border-8',
  };

  return (
    <div className={`animate-spin rounded-full border-t-transparent border-primary-500 ${sizeClasses[size]}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
