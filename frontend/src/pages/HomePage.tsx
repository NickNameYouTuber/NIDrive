import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация - фиксированная в верхней части экрана */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.svg" alt="NIDriveBot Logo" className="w-10 h-10 mr-2" />
              <h1 className="text-xl font-bold text-primary-600">NIDrive</h1>
            </div>
            <div className="hidden md:flex space-x-4 items-center">
              <a href="#features" className="text-gray-600 hover:text-primary-600 px-3 py-2">
                Возможности
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 px-3 py-2">
                Как это работает
              </a>
              <a href="#faq" className="text-gray-600 hover:text-primary-600 px-3 py-2">
                FAQ
              </a>
              <Link to="/drive" className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Войти в хранилище
              </Link>
            </div>
            <div className="md:hidden">
              <Link to="/drive" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Войти
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Отступ для основного контента, чтобы он не перекрывался с фиксированным хедером */}
      <div className="pt-16"></div>

      {/* Основной контент */}
      <main>
        {/* Hero секция */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
                <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Ваше персональное</span>{' '}
                      <span className="block text-primary-600 xl:inline">хранилище файлов</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Доступ к вашим файлам из любой точки мира через веб-интерфейс и прямо из Telegram.
                      Удобно, быстро и безопасно.
                    </p>
                    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <Link to="/drive" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                          Начать использовать
                        </Link>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <a href="https://t.me/NIDriveBot" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10">
                          Открыть в Telegram
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-primary-50 flex items-center justify-center p-8">
            <img src="/logo.svg" alt="NIDriveBot Logo" className="w-96 h-96" />
          </div>
        </div>

        {/* Особенности */}
        <div id="features" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Возможности</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Новый уровень доступа к файлам
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                NIDriveBot объединяет удобство веб-интерфейса и мощь Telegram для работы с вашими файлами.
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Мгновенный доступ</h3>
                  <p className="mt-2 text-base text-gray-500 text-center">
                    Загружайте и скачивайте файлы мгновенно через веб-интерфейс или прямо в Telegram.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Безопасное хранение</h3>
                  <p className="mt-2 text-base text-gray-500 text-center">
                    Ваши файлы надежно защищены и доступны только вам через авторизацию в Telegram.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Кросс-платформенность</h3>
                  <p className="mt-2 text-base text-gray-500 text-center">
                    Работайте с файлами на любом устройстве - компьютере, планшете или смартфоне.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Как это работает */}
        <div id="how-it-works" className="py-12 bg-primary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Инструкция</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Как это работает
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Три простых шага для начала использования NIDriveBot
              </p>
            </div>
            
            <div className="mt-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white mx-auto mb-4">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-3 text-gray-900">Войдите через Telegram</h3>
                  <p className="text-gray-600 text-center">
                    Авторизуйтесь через свой аккаунт Telegram для безопасного доступа к вашим файлам.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white mx-auto mb-4">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-3 text-gray-900">Загрузите файлы</h3>
                  <p className="text-gray-600 text-center">
                    Загружайте файлы через веб-интерфейс или отправляйте их прямо в Telegram бота.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white mx-auto mb-4">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-3 text-gray-900">Получите доступ откуда угодно</h3>
                  <p className="text-gray-600 text-center">
                    Ваши файлы всегда будут доступны вам через веб-интерфейс или через Telegram в любое время.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Часто задаваемые вопросы */}
        <div id="faq" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">FAQ</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Часто задаваемые вопросы
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Ответы на популярные вопросы о работе NIDriveBot
              </p>
            </div>
            
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="space-y-6">
                <div className="bg-primary-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Сколько места я получаю для хранения файлов?</h3>
                  <p className="mt-2 text-gray-600">
                    Каждый пользователь NIDriveBot получает 5 ГБ бесплатного пространства для хранения файлов.
                  </p>
                </div>
                
                <div className="bg-primary-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Какие типы файлов я могу хранить?</h3>
                  <p className="mt-2 text-gray-600">
                    Вы можете хранить практически любые типы файлов: документы, изображения, видео, аудио и архивы.
                  </p>
                </div>
                
                <div className="bg-primary-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Как я могу поделиться файлом с другими пользователями?</h3>
                  <p className="mt-2 text-gray-600">
                    Вы можете получить публичную ссылку на файл и поделиться ею с другими пользователями через веб-интерфейс или Telegram.
                  </p>
                </div>
                
                <div className="bg-primary-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Безопасно ли хранить мои файлы в NIDriveBot?</h3>
                  <p className="mt-2 text-gray-600">
                    Да, все файлы защищены и доступны только вам через авторизацию в Telegram. Мы используем современные методы шифрования для защиты ваших данных.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Подвал */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/logo.svg" alt="NIDriveBot Logo" className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">NIDrive</span>
            </div>
            <div className="text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} NIDrive. Все права защищены.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
