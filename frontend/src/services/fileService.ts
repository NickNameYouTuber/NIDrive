import apiClient from './apiClient'; // Убедитесь, что путь к файлу правильный

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

// API endpoint for files
const API_ENDPOINT = '/api/v1/files';
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

// Sample data for test mode
const testFiles = [
  {
    id: 1,
    filename: 'document.pdf',
    filepath: '/uploads/document.pdf',
    mime_type: 'application/pdf',
    size: 1024000,
    size_mb: 1.02,
    owner_id: '12345678',
    folder_id: null,
    is_public: false,
    public_url: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    is_deleted: false
  },
  {
    id: 2,
    filename: 'image.jpg',
    filepath: '/uploads/image.jpg',
    mime_type: 'image/jpeg',
    size: 512000,
    size_mb: 0.51,
    owner_id: '12345678',
    folder_id: 1,
    is_public: true,
    public_url: 'https://example.com/public/image.jpg',
    created_at: '2025-01-16T14:30:00Z',
    updated_at: '2025-01-16T14:30:00Z',
    is_deleted: false
  }
];

export const fileService = {
  getFiles: async (folderId: number | null = null) => {
    if (isTestMode) {
      console.log('Test mode: Returning test files');
      return folderId === null ? testFiles : testFiles.filter(file => file.folder_id === folderId);
    }
    const url = folderId !== null 
      ? `${API_ENDPOINT}?folder_id=${folderId}` 
      : API_ENDPOINT;
    const response = await apiClient.get(url);
    return response.data;
  },

  uploadFile: async (file: File, folderId: number | null = null) => {
    if (isTestMode) {
      console.log('Test mode: Simulating file upload');
      return { id: Math.floor(Math.random() * 1000), filename: file.name, size: file.size };
    }
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== null) {
      formData.append('folder_id', folderId.toString());
    }
    const response = await apiClient.post(API_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteFile: async (fileId: number) => {
    if (isTestMode) {
      console.log('Test mode: Simulating file deletion');
      return { success: true };
    }
    const response = await apiClient.delete(`${API_ENDPOINT}/${fileId}`);
    return response.data;
  },

  downloadFile: async (fileId: number, filename: string) => {
    if (isTestMode) {
      console.log('Test mode: Simulating file download');
      return { success: true };
    }
    const response = await apiClient.get(`${API_ENDPOINT}/${fileId}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  toggleFileVisibility: async (fileId: number, isPublic: boolean) => {
    if (isTestMode) {
      console.log('Test mode: Simulating toggling file visibility');
      const file = testFiles.find(f => f.id === fileId);
      if (file) {
        file.is_public = isPublic;
        file.public_url = isPublic ? `https://example.com/public/${file.filename}` : null;
      }
      return { success: true };
    }
    const response = await apiClient.patch(`${API_ENDPOINT}/${fileId}`, { is_public: isPublic });
    return response.data;
  },

  getPublicFileUrl: async (fileId: number) => {
    if (isTestMode) {
      console.log('Test mode: Returning test public URL');
      const file = testFiles.find(f => f.id === fileId);
      return file && file.is_public ? file.public_url : null;
    }
    const response = await apiClient.get(`${API_ENDPOINT}/${fileId}/public-url`);
    return response.data.public_url;
  },

  getRecentFiles: async () => {
    if (isTestMode) {
      console.log('Test mode: Returning test recent files');
      return testFiles.slice(0, 5);
    }
    const response = await apiClient.get(`${API_ENDPOINT}/recent`);
    return response.data;
  },

  searchFiles: async (query: string, mimeType: string | null = null, folderId: number | null = null) => {
    if (isTestMode) {
      console.log('Test mode: Returning test search results for files');
      let results = testFiles.filter(file => file.filename.toLowerCase().includes(query.toLowerCase()));
      if (mimeType) {
        results = results.filter(file => file.mime_type === mimeType);
      }
      if (folderId !== null) {
        results = results.filter(file => file.folder_id === folderId);
      }
      return results;
    }
    let url = `${API_ENDPOINT}/search?q=${encodeURIComponent(query)}`;
    if (mimeType) {
      url += `&mime_type=${encodeURIComponent(mimeType)}`;
    }
    if (folderId !== null) {
      url += `&folder_id=${folderId}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  }
};
