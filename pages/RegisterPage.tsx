import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const RegisterPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register: registerUser, login } = useAuth();
  const navigate = useNavigate();
  const password = useRef({});
  password.current = watch("password", "");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setServerError('');
    try {
      await registerUser(data.email, data.password);
      // After successful registration, log the user in
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
        <Card title="Create Account">
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
          {...register("password", { 
                required: "Password is required",
                minLength: { value: 8, message: "Password must have at least 8 characters" },
          })}
          error={errors.password?.message as string}

        />
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              {...register("confirmPassword", { 
                required: "Please confirm your password",
                validate: value => value === password.current || "The passwords do not match"
              })}
              error={errors.confirmPassword?.message as string}
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Register
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;