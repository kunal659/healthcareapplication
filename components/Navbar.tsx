
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const navLinkClasses = ({ isActive }: { isActive: boolean }) => 
    `text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'font-bold text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-700' : ''}`;


  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <NavLink to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            Healthcare Assistant
          </NavLink>
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <NavLink to="/dashboard" className={navLinkClasses}>
                  Dashboard
                </NavLink>
                <NavLink to="/databases" className={navLinkClasses}>
                  Databases
                </NavLink>
                 <NavLink to="/sql-chat" className={navLinkClasses}>
                  SQL Chat
                </NavLink>
                <NavLink to="/governance" className={navLinkClasses}>
                  Governance
                </NavLink>
                <NavLink to="/profile" className={navLinkClasses}>
                  Profile
                </NavLink>
                <NavLink to="/settings" className={navLinkClasses}>
                  Settings
                </NavLink>
                <Button onClick={handleLogout} variant="secondary" size="sm">Logout</Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClasses}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClasses}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;