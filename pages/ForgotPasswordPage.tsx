
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import * as authService from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      await authService.forgotPassword(data.email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-md">
        <Card title="Forgot Password">
          {message ? (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
               <p className="mt-4 text-center">
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Back to Login
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <p className="mb-4 text-gray-600 dark:text-gray-400">Enter your email address and we'll send you a link to reset your password.</p>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <Input
                id="email"
                label="Email"
                type="email"
                {...register("email", { 
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } 
                })}
                error={errors.email?.message as string}
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send Reset Link
              </Button>
              <p className="mt-6 text-center">
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Remember your password? Sign in
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
