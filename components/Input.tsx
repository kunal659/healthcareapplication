
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, id, ...props }, ref) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${
          error 
          ? 'border-red-500 focus:ring-red-500' 
          : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
