import apiClient from './authService';

// Расширяем типы для import.meta.env (Vite)
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
      VITE_TEST_MODE?: string;
      [key: string]: string | undefined;
    };
  }
}

const API_ENDPOINT = '/api/v1/files';
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

// Sample data for test mode
const testFiles = [
  {
    id: 1,
    filename: 'document.pdf',
    owner_id: '12345678',
    folder_id: 1,
    size_mb: 2.5,
    mime_type: 'application/pdf',
    is_public: false,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z',
    is_deleted: false,
    public_url: null
  },
  {
    id: 2,
    filename: 'image.jpg',
    owner_id: '12345678',
    folder_id: 2,
    size_mb: 3.2,
    mime_type: 'image/jpeg',
    is_public: true,
    created_at: '2025-01-16T14:45:00Z',
    updated_at: '2025-01-16T14:45:00Z',
    is_deleted: false,
    public_url: 'http://localhost:7070/public/12345678_image.jpg'
  },
  {
    id: 3,
    filename: 'notes.txt',
    owner_id: '12345678',
    folder_id: null,
    size_mb: 0.1,
    mime_type: 'text/plain',
    is_public: false,
    created_at: '2025-01-17T09:15:00Z',
    updated_at: '2025-01-17T09:15:00Z',
    is_deleted: false,
    public_url: null
  }
];

export const fileService = {
  async getFiles(folderId: number | null) {
    if (isTestMode) {
      // Mock data in test mode
      // Для корневой папки (folderId === null) возвращаем файлы где folder_id === null
      if (folderId === null) {
        // Для корневой папки ищем файлы с folder_id === null
        return testFiles.filter(f => f.folder_id === null);
      } else {
        // Для обычных папок фильтруем по ID папки
        return testFiles.filter(f => f.folder_id === folderId);
      }
    }

    try {
      const response = await apiClient.get(
        `${API_ENDPOINT}${folderId ? `?folder_id=${folderId}` : ''}`
      );
      // API может вернуть либо массив напрямую, либо объект с полем files
      // Проверяем формат ответа и обрабатываем соответственно
      const files = Array.isArray(response.data) ? response.data : response.data.files || [];
      
      // Фильтруем файлы по folder_id для корневой папки и обычных папок
      if (folderId === null) {
        return files.filter((f: any) => f.folder_id === null);
      } else {
        return files.filter((f: any) => f.folder_id === folderId);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },
  
  async getRecentFiles(limit = 10) {
    if (isTestMode) {
      // Mock data in test mode - sort by created_at date descending
      return [...testFiles]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    }

    try {
      // Используем стандартный API эндпоинт и сортируем файлы на стороне клиента
      // т.к. эндпоинта /recent на сервере нет
      const response = await apiClient.get(API_ENDPOINT);
      
      // Проверяем формат ответа и обрабатываем его
      const files = Array.isArray(response.data) ? response.data : response.data.files || [];
      
      return files
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent files:', error);
      // Если API недоступен, возвращаем пустой массив вместо ошибки
      return [];
    }
  },
  
  async getFile(fileId: number) {
    if (isTestMode) {
      console.log('Test mode: Returning test file');
      const file = testFiles.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');
      return file;
    }
    
    const response = await apiClient.get(`${API_ENDPOINT}/${fileId}`);
    return response.data;
  },
  
  uploadFile: async (file: File, folderId: number | null, isPublic: boolean) => {
    if (isTestMode) {
      console.log('Test mode: Simulating file upload');
      
      // Create a fake response with the uploaded file data
      const newId = Math.max(...testFiles.map(f => f.id)) + 1;
      const newFile = {
        id: newId,
        filename: file.name,
        owner_id: '12345678',
        folder_id: folderId,
        size_mb: file.size / (1024 * 1024),
        mime_type: file.type,
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        public_url: isPublic ? `http://localhost:7070/public/12345678_${file.name}` : null
      };
      
      return newFile;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId ? folderId.toString() : '');
    formData.append('is_public', isPublic ? 'true' : 'false');
    
    const response = await apiClient.post(API_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  deleteFile: async (fileId: number) => {
    if (isTestMode) {
      console.log('Test mode: Simulating file deletion');
      return true;
    }
    
    await apiClient.delete(`${API_ENDPOINT}/${fileId}`);
    return true;
  },
  
  toggleFileVisibility: async (fileId: number, isPublic: boolean) => {
    if (isTestMode) {
      console.log('Test mode: Simulating visibility toggle');
      const file = testFiles.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');
      
      file.is_public = isPublic;
      file.public_url = isPublic ? `http://localhost:7070/public/12345678_${file.filename}` : null;
      return file;
    }
    
    const response = await apiClient.patch(`${API_ENDPOINT}/${fileId}/visibility`, { is_public: isPublic });
    return response.data;
  },
  
  getDownloadLink: (fileId: number | string) => {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:7070'}${API_ENDPOINT}/${fileId}/download`;
  },
  
  // Новый метод для скачивания файлов через Fetch API без открытия нового окна
  downloadFile: async (fileId: number | string, filename: string) => {
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:7070'}${API_ENDPOINT}/${fileId}/download`;
      
      // Используем текущий экземпляр apiClient, который уже содержит заголовок авторизации
      const response = await apiClient.get(url, { responseType: 'blob' });
      
      // Создаем объект URL для скачивания
      const blob = new Blob([response.data]);
      const objectUrl = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const anchor = document.createElement('a');
      document.body.appendChild(anchor);
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      
      // Очищаем ресурсы
      URL.revokeObjectURL(objectUrl);
      document.body.removeChild(anchor);
      
      return true;
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      throw error;
    }
  },
  
  // Получение публичного URL для файла
  getPublicUrl: async (fileId: number | string) => {
    if (isTestMode) {
      console.log('Test mode: Returning mock public URL');
      return {
        file_url: `http://localhost:7070/api/v1/files/${fileId}/download`,
        filename: 'test-file.txt',
        is_public: true
      };
    }
    
    const response = await apiClient.get(`${API_ENDPOINT}/${fileId}/public-url`);
    return response.data;
  }
};
