import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon, 
  FolderIcon, 
  ArrowUpTrayIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar with Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-card z-20 flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center">
          <img src="/logo.svg" alt="NIDriveBot Logo" className="w-8 h-8 mr-2" />
          <h1 className="text-xl font-bold text-primary-600 dark:text-dark-primary">NIDriveBot</h1>
        </div>
        
        <button 
          onClick={toggleMenu}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={closeMenu}
        ></div>
      )}

      {/* Mobile menu panel */}
      <div className={`md:hidden fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-dark-card z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="h-16 border-b border-gray-200 dark:border-dark-border flex justify-end items-center px-4">
          <button 
            onClick={closeMenu}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* User profile */}
        <div className="flex items-center p-4 border-b dark:border-dark-border">
          <div className="flex-shrink-0">
            <UserCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              @{user?.username || 'user'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-auto">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `${isActive ? 'bg-primary-50 text-primary-600 dark:bg-dark-border dark:text-dark-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-dark-border dark:hover:text-dark-primary'} flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`
            }
            onClick={closeMenu}
          >
            <HomeIcon className="mr-3 flex-shrink-0 h-6 w-6" />
            Обзор
          </NavLink>
          <NavLink
            to="/dashboard/files"
            className={({ isActive }) =>
              `${isActive ? 'bg-primary-50 text-primary-600 dark:bg-dark-border dark:text-dark-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-dark-border dark:hover:text-dark-primary'} flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`
            }
            onClick={closeMenu}
          >
            <FolderIcon className="mr-3 flex-shrink-0 h-6 w-6" />
            Файлы
          </NavLink>
          <NavLink
            to="/dashboard/upload"
            className={({ isActive }) =>
              `${isActive ? 'bg-primary-50 text-primary-600 dark:bg-dark-border dark:text-dark-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-dark-border dark:hover:text-dark-primary'} flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200`
            }
            onClick={closeMenu}
          >
            <ArrowUpTrayIcon className="mr-3 flex-shrink-0 h-6 w-6" />
            Загрузить
          </NavLink>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t dark:border-dark-border">
          <button
            onClick={() => {
              logout();
              closeMenu();
            }}
            className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6" />
            Выйти
          </button>
        </div>
      </div>

      {/* Add padding for content below fixed header on mobile */}
      <div className="h-16 md:h-0 block md:hidden"></div>
    </>
  );
};

export default MobileMenu;
