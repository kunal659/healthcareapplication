import React from 'react';
import Spinner from './Spinner';

// Fix: Added 'size' to ButtonProps to allow for different button sizes.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, className, isLoading = false, variant = 'primary', size = 'md', ...props }) => {
  // Fix: Removed hardcoded padding 'py-2 px-4' from baseClasses to support dynamic sizing.
  const baseClasses = "flex items-center justify-center font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  // Fix: Added sizeClasses to apply padding and font-size based on the 'size' prop.
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  );
};

export default Button;
