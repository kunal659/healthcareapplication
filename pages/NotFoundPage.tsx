
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <p className="text-2xl mt-4 font-light text-gray-700 dark:text-gray-300">Page Not Found</p>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="mt-6 inline-block bg-primary-600 text-white font-bold py-2 px-4 rounded hover:bg-primary-700 transition-colors">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
