import React, { createContext, useState, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Создаем контекст с начальными значениями
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// Хук для использования темы
export const useTheme = () => useContext(ThemeContext);

// Провайдер темы
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Получаем сохраненную тему из localStorage или используем системные предпочтения
  const getInitialTheme = (): Theme => {
    // Проверяем, сохранена ли тема в localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Если есть сохраненная тема, используем ее
    if (savedTheme) {
      return savedTheme;
    }
    
    // Иначе используем системные предпочтения
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Функция переключения темы
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme); // Сохраняем новую тему в localStorage
      return newTheme;
    });
  };

  // Применяем класс темы к body при изменении темы
  useEffect(() => {
    const body = document.body;
    body.classList.remove('light', 'dark');
    body.classList.add(theme);

    // Также добавим/уберем класс 'dark' для поддержки TailwindCSS dark mode
    if (theme === 'dark') {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
