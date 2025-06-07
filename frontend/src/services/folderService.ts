import apiClient from './authService';

const API_ENDPOINT = '/api/v1/folders';
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

// Sample data for test mode
const testFolders = [
  {
    id: 1,
    name: 'Documents',
    owner_id: '12345678',
    parent_id: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    is_deleted: false
  },
  {
    id: 2,
    name: 'Images',
    owner_id: '12345678',
    parent_id: null,
    created_at: '2025-01-16T14:30:00Z',
    updated_at: '2025-01-16T14:30:00Z',
    is_deleted: false
  },
  {
    id: 3,
    name: 'Work',
    owner_id: '12345678',
    parent_id: 1,
    created_at: '2025-01-17T09:00:00Z',
    updated_at: '2025-01-17T09:00:00Z',
    is_deleted: false
  }
];

// Sample folder tree for test mode
const testFolderTree = [
  {
    id: 1,
    name: 'Documents',
    owner_id: '12345678',
    parent_id: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    is_deleted: false,
    children: [
      {
        id: 3,
        name: 'Work',
        owner_id: '12345678',
        parent_id: 1,
        created_at: '2025-01-17T09:00:00Z',
        updated_at: '2025-01-17T09:00:00Z',
        is_deleted: false,
        children: [],
        files: []
      }
    ],
    files: [
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
      }
    ]
  },
  {
    id: 2,
    name: 'Images',
    owner_id: '12345678',
    parent_id: null,
    created_at: '2025-01-16T14:30:00Z',
    updated_at: '2025-01-16T14:30:00Z',
    is_deleted: false,
    children: [],
    files: [
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
      }
    ]
  }
];

export const folderService = {
  getFolders: async (parentId = null) => {
    if (isTestMode) {
      console.log('Test mode: Returning test folders');
      return testFolders.filter(folder => folder.parent_id === parentId);
    }
    
    const url = parentId !== null 
      ? `${API_ENDPOINT}?parent_id=${parentId}` 
      : API_ENDPOINT;
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getFolderTree: async () => {
    if (isTestMode) {
      console.log('Test mode: Returning test folder tree');
      return testFolderTree;
    }
    
    const response = await apiClient.get(`${API_ENDPOINT}/tree`);
    return response.data;
  },
  
  getFolder: async (folderId: number) => {
    if (isTestMode) {
      console.log('Test mode: Returning test folder');
      const folder = testFolders.find(f => f.id === folderId);
      if (!folder) throw new Error('Folder not found');
      return folder;
    }
    
    const response = await apiClient.get(`${API_ENDPOINT}/${folderId}`);
    return response.data;
  },
  
  createFolder: async (name: string, parentId: number | null) => {
    if (isTestMode) {
      console.log('Test mode: Simulating folder creation');
      
      // Create a fake response with the new folder data
      const newId = Math.max(...testFolders.map(f => f.id)) + 1;
      const newFolder = {
        id: newId,
        name,
        owner_id: '12345678',
        parent_id: parentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };
      
      return newFolder;
    }
    
    const response = await apiClient.post(API_ENDPOINT, { name, parent_id: parentId });
    return response.data;
  },
  
  updateFolder: async (folderId: number, name: string, parentId: number | null) => {
    if (isTestMode) {
      console.log('Test mode: Simulating folder update');
      const folder = testFolders.find(f => f.id === folderId);
      if (!folder) throw new Error('Folder not found');
      
      folder.name = name;
      folder.parent_id = parentId;
      folder.updated_at = new Date().toISOString();
      return folder;
    }
    
    const response = await apiClient.put(`${API_ENDPOINT}/${folderId}`, {
      name,
      parent_id: parentId
    });
    return response.data;
  },
  
  deleteFolder: async (folderId: number) => {
    if (isTestMode) {
      console.log('Test mode: Simulating folder deletion');
      return true;
    }
    
    await apiClient.delete(`${API_ENDPOINT}/${folderId}`);
    return true;
  },
  
  // Получение недавних папок
  getRecentFolders: async () => {
    if (isTestMode) {
      console.log('Test mode: Getting recent folders');
      return testFolders.slice(0, 5); // Возвращаем первые 5 папок как недавние
    }

    try {
      const response = await apiClient.get('/api/v1/folders/recent');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении недавних папок:', error);
      throw error;
    }
  }
};
