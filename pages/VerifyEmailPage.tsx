
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import * as authService from '../services/authService';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'info'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token && token !== 'new-user') {
      setStatus('loading');
      authService.verifyEmail(token)
        .then(() => {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now log in.');
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.message || 'Failed to verify email. The link may be expired or invalid.');
        });
    } else {
      setStatus('info');
      setMessage('A verification link has been sent to your email address. Please check your inbox and click the link to activate your account.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Spinner />
            <p>Verifying your email...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <p className="text-green-600">{message}</p>
            <Link to="/login" className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-500">
              Go to Login
            </Link>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <p className="text-red-600">{message}</p>
             <Link to="/login" className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-500">
              Back to Login
            </Link>
          </div>
        );
      case 'info':
        return (
           <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
           </div>
        );
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-lg">
        <Card title="Email Verification">
          {renderContent()}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
