import axios from 'axios';
import { FileMetadata, StorageInfo, FileAccessResponse } from '../types/file';
import { API_BASE_URL } from './constants';

const fileApi = {
  /**
   * Получить список файлов пользователя
   * @param token JWT токен пользователя
   * @param folder Опциональный параметр для фильтрации по папке
   */
  getFiles: async (token: string, folder?: string): Promise<FileMetadata[]> => {
    const params = folder ? { folder } : {};
    
    const response = await axios.get(`${API_BASE_URL}/files`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },
  
  /**
   * Получить информацию об использовании хранилища
   * @param token JWT токен пользователя
   */
  getStorageInfo: async (token: string): Promise<StorageInfo> => {
    const response = await axios.get(`${API_BASE_URL}/storage/info`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },
  
  /**
   * Загрузить файл
   * @param token JWT токен пользователя
   * @param file Файл для загрузки
   * @param folder Опциональная папка для сохранения
   * @param isPublic Флаг публичности файла
   */
  uploadFile: async (
    token: string,
    file: File,
    folder: string | null = null,
    isPublic: boolean = false
  ): Promise<FileMetadata> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (folder) {
      formData.append('folder', folder);
    }
    
    formData.append('is_public', isPublic.toString());
    
    const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  /**
   * Удалить файл
   * @param token JWT токен пользователя
   * @param fileId Идентификатор файла
   */
  deleteFile: async (token: string, fileId: string): Promise<{ success: boolean, message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },
  
  /**
   * Изменить статус публичности файла
   * @param token JWT токен пользователя
   * @param fileId Идентификатор файла
   * @param isPublic Новый статус публичности
   */
  setFilePrivacy: async (token: string, fileId: string, isPublic: boolean): Promise<FileMetadata> => {
    const response = await axios.put(
      `${API_BASE_URL}/files/${fileId}/privacy`, 
      { is_public: isPublic },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  },
  
  /**
   * Получить токен доступа для приватного файла
   * @param token JWT токен пользователя
   * @param fileId Идентификатор файла
   */
  generateFileAccessToken: async (token: string, fileId: string): Promise<FileAccessResponse> => {
    const response = await axios.get(`${API_BASE_URL}/files/${fileId}/token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },
  
  /**
   * Скачать файл по его ID
   * @param token JWT токен пользователя
   * @param fileId Идентификатор файла
   */
  downloadFile: async (token: string, fileId: string): Promise<Blob> => {
    const response = await axios.get(`${API_BASE_URL}/files/${fileId}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },
  
  /**
   * Скачать публичный файл по его ID
   * @param fileId Идентификатор публичного файла
   */
  downloadPublicFile: async (fileId: string): Promise<Blob> => {
    const response = await axios.get(`${API_BASE_URL}/public/${fileId}`, {
      responseType: 'blob'
    });
    
    return response.data;
  },
  
  /**
   * Скачать приватный файл по токену доступа
   * @param fileId Идентификатор файла
   * @param accessToken Токен доступа
   */
  downloadFileWithToken: async (fileId: string, accessToken: string): Promise<Blob> => {
    const response = await axios.get(`${API_BASE_URL}/api/files/access/${fileId}?token=${accessToken}`, {
      responseType: 'blob'
    });
    
    return response.data;
  },
  
  /**
   * Получить список папок пользователя
   * @param token JWT токен пользователя
   */
  getFolders: async (token: string): Promise<string[]> => {
    const response = await axios.get(`${API_BASE_URL}/files/folders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  },
  
  /**
   * Открыть файл для просмотра в браузере
   * @param token JWT токен пользователя или null для публичного файла
   * @param file Метаданные файла
   */
  openFile: async (token: string | null, file: FileMetadata): Promise<string> => {
    try {
      // Публичный файл
      if (file.is_public) {
        return `${API_BASE_URL}/public/${file.id}`;
      }
      
      // Приватный файл - нужен токен
      if (!token) {
        throw new Error("Требуется авторизация для доступа к приватному файлу");
      }
      
      // Получаем временный токен доступа
      const { file_url, access_token } = await fileApi.generateFileAccessToken(token, file.id);
      
      return `${API_BASE_URL}${file_url}`;
    } catch (error) {
      console.error("Ошибка при открытии файла:", error);
      throw error;
    }
  }
};

export default fileApi;
