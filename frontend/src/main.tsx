import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { SnackbarProvider } from 'notistack';

// Определяем тип для window с дополнительным свойством INITIAL_ROUTE
declare global {
  interface Window {
    INITIAL_ROUTE?: string;
  }
}

// Получаем начальный маршрут из window.INITIAL_ROUTE
const initialRoute = window.INITIAL_ROUTE || '/';

// Компонент для инициализации начального маршрута
const InitialRouteHandler = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    // Если есть начальный маршрут и мы не на этом маршруте
    if (window.INITIAL_ROUTE && window.location.pathname !== window.INITIAL_ROUTE) {
      // Перенаправляем на начальный маршрут
      window.history.pushState({}, '', window.INITIAL_ROUTE);
    }
  }, []);

  return <>{children}</>;
};

// Mount app to DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SnackbarProvider 
          maxSnack={3} 
          autoHideDuration={3000}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <InitialRouteHandler>
            <App />
          </InitialRouteHandler>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
