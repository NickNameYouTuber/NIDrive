import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-16 bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Страница не найдена</h2>
        <p className="mt-2 text-base text-gray-500">К сожалению, мы не смогли найти запрашиваемую страницу.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
