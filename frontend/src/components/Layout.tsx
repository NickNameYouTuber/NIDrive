import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HomeIcon, 
  FolderIcon, 
  ArrowUpTrayIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200">
      {/* Mobile menu button */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white dark:bg-dark-card shadow-md"
        >
          {sidebarOpen ? (
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Sidebar - Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-card shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700">
            <div className="flex items-center">
              <img src="/logo.svg" alt="NIDriveBot Logo" className="w-8 h-8 mr-2" />
              <h1 className="text-xl font-bold text-primary-600 dark:text-primary-500">NIDriveBot</h1>
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* User profile */}
          <div className="flex items-center p-4 border-b dark:border-gray-700">
            <div className="flex-shrink-0">
              <UserCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{user?.username || 'user'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLink
              to="/dashboard"
              className={({ isActive }: { isActive: boolean }) =>
                `${isActive 
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:text-primary-600 dark:hover:bg-dark-border dark:hover:text-primary-400'
                } flex items-center px-4 py-2 text-sm font-medium rounded-md`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HomeIcon className="mr-3 flex-shrink-0 h-6 w-6" />
              Дашборд
            </NavLink>
            <NavLink
              to="/dashboard/files"
              className={({ isActive }: { isActive: boolean }) =>
                `${isActive 
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:text-primary-600 dark:hover:bg-dark-border dark:hover:text-primary-400'
                } flex items-center px-4 py-2 text-sm font-medium rounded-md`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <FolderIcon className="mr-3 flex-shrink-0 h-6 w-6" />
              Файлы
            </NavLink>
            <NavLink
              to="/dashboard/upload"
              className={({ isActive }: { isActive: boolean }) =>
                `${isActive 
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:text-primary-600 dark:hover:bg-dark-border dark:hover:text-primary-400'
                } flex items-center px-4 py-2 text-sm font-medium rounded-md`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <ArrowUpTrayIcon className="mr-3 flex-shrink-0 h-6 w-6" />
              Загрузить
            </NavLink>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t dark:border-gray-700">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 transition-all duration-300">
        {/* Заголовок в мобильной версии для центрирования с бургер-меню */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-bg flex items-center justify-center md:hidden z-30">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">NIDriveBot</h1>
        </div>
        <main className="p-4 md:p-6 pt-16 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
