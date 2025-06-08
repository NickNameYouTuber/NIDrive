FROM node:18-alpine

WORKDIR /app

# Копируем файлы package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости с флагом --legacy-peer-deps для избежания конфликтов
RUN npm install --legacy-peer-deps

# Устанавливаем Vite и serve глобально
RUN npm install -g vite serve

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 7071

# Запускаем serve для обслуживания статических файлов
CMD ["serve", "-s", "dist", "-l", "7071"]
