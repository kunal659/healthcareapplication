
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/profile');
    } catch (error: any) {
      setServerError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-md">
        <Card title="Login">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {serverError}
              </div>
            )}
            <Input
              id="email"
              label="Email"
              type="email"
              {...register("email", { 
                required: "Email is required", 
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address"
                }
              })}
              error={errors.email?.message as string}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              {...register("password", { required: "Password is required" })}
              error={errors.password?.message as string}
            />
             <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
              </div>
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Not a member?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
