
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import * as authService from '../services/authService';

const ResetPasswordPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const password = useRef({});
  password.current = watch("password", "");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMessage('');
    setError('');
    if (!token) {
      setError("Invalid or missing reset token.");
      setIsLoading(false);
      return;
    }
    try {
      await authService.resetPassword(token, data.password);
      setMessage('Your password has been reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-md">
        <Card title="Reset Your Password">
          {message ? (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded text-center">
              <p>{message}</p>
              <Link to="/login" className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-500">
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <p className="mb-4 text-gray-600 dark:text-gray-400">Enter your new password below.</p>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <Input
                id="password"
                label="New Password"
                type="password"
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 8, message: "Password must have at least 8 characters" },
                  pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, message: "Must include uppercase, lowercase, number, and special character." }
                })}
                error={errors.password?.message as string}
              />
              <Input
                id="confirmPassword"
                label="Confirm New Password"
                type="password"
                {...register("confirmPassword", { 
                  required: "Please confirm your password",
                  validate: value => value === password.current || "The passwords do not match"
                })}
                error={errors.confirmPassword?.message as string}
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Reset Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
