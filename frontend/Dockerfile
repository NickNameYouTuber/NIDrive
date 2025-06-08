FROM node:18-alpine

WORKDIR /app

# Копируем файлы package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости с флагом --legacy-peer-deps для избежания конфликтов
RUN npm install --legacy-peer-deps

# Устанавливаем Vite глобально
RUN npm install -g vite

# Копируем остальные файлы проекта
COPY . .

# Открываем порт
EXPOSE 7071

# Запускаем приложение
CMD ["npm", "run", "build"]
