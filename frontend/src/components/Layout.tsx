import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  HomeIcon, 
  FolderIcon, 
  ArrowUpTrayIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
// Логотип загружается напрямую из публичной директории

const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b">
            <img src="/logo.svg" alt="NIDriveBot Logo" className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-bold text-primary-600">NIDriveBot</h1>
          </div>

          {/* User profile */}
          <div className="flex items-center p-4 border-b">
            <div className="flex-shrink-0">
              <UserCircleIcon className="w-10 h-10 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">
                @{user?.username || 'user'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'} flex items-center px-4 py-2 text-sm font-medium rounded-md`
              }
            >
              <HomeIcon className="mr-3 flex-shrink-0 h-6 w-6" />
              Дашборд
            </NavLink>
            <NavLink
              to="/drive/files"
              className={({ isActive }) =>
                `${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'} flex items-center px-4 py-2 text-sm font-medium rounded-md`
              }
            >
              <FolderIcon className="mr-3 flex-shrink-0 h-6 w-6" />
              Файлы
            </NavLink>
            <NavLink
              to="/drive/upload"
              className={({ isActive }) =>
                `${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'} flex items-center px-4 py-2 text-sm font-medium rounded-md`
              }
            >
              <ArrowUpTrayIcon className="mr-3 flex-shrink-0 h-6 w-6" />
              Загрузить
            </NavLink>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
