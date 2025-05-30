import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { API_BASE_URL } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { 
  DocumentIcon, 
  PhotoIcon, 
  MusicalNoteIcon, 
  FilmIcon, 
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface File {
  id: string;
  filename: string;
  file_url: string;
  public_url?: string;
  file_size: number;
  is_public: boolean;
  created_at: string;
  folder?: string;
}

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderList, setFolderList] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/files');
      setFiles(response.data);
      
      // Extract unique folders
      const folders = response.data
        .map((file: File) => file.folder)
        .filter((folder: string | null) => folder !== null)
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
      
      setFolderList(folders);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Обновляем список файлов после удаления
        fetchFiles();
      } else {
        const data = await response.json();
        setError(data.detail || 'Ошибка при удалении файла');
      }
    } catch (err) {
      setError('Ошибка сети при удалении файла');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilePrivacy = async (fileId: string) => {
    setIsLoading(true);
    try {
      // Используем новый API эндпоинт, который гарантированно работает с Nginx
      const response = await api.post(`/api/privacy/toggle/${fileId}`);
      console.log('Privacy toggle response:', response.data);
      
      // Успешный ответ, обновляем список файлов
      fetchFiles();
    } catch (error: any) {
      // Обрабатываем ошибку axios
      console.error('Error toggling privacy:', error);
      setError(error.response?.data?.detail || 'Ошибка при изменении статуса приватности');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLinkToClipboard = (fileId: string, fileUrl: string | null | undefined) => {
    if (!fileUrl) return;
    const fullUrl = `${window.location.origin}${API_BASE_URL}${fileUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopySuccess(fileId);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get icon for file type
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <PhotoIcon className="w-8 h-8 text-primary-500" />;
      case 'mp3':
      case 'wav':
        return <MusicalNoteIcon className="w-8 h-8 text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FilmIcon className="w-8 h-8 text-red-500" />;
      case 'pdf':
        return <DocumentTextIcon className="w-8 h-8 text-red-600" />;
      default:
        return <DocumentIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  // Filter files by current folder
  const filteredFiles = files.filter(file => 
    currentFolder === null 
      ? file.folder === null 
      : file.folder === currentFolder
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Файлы</h1>
      </div>

      {/* Folder navigation */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setCurrentFolder(null)}
          className={`px-3 py-1 text-sm rounded-md ${
            currentFolder === null
              ? 'bg-primary-100 text-primary-700 dark:bg-[#2e2e2e] dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Все файлы
        </button>
        
        {folderList.map(folder => (
          <button
            key={folder}
            onClick={() => setCurrentFolder(folder)}
            className={`px-3 py-1 text-sm rounded-md ${
              currentFolder === folder
                ? 'bg-primary-100 text-primary-700 dark:bg-[#2e2e2e] dark:text-primary-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {folder}
          </button>
        ))}
      </div>

      {/* File list */}
      {filteredFiles.length === 0 ? (
        <div className="p-8 text-center">
          <DocumentIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Нет файлов</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {currentFolder === null
              ? 'У вас пока нет загруженных файлов'
              : `В папке "${currentFolder}" пока нет файлов`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-dark-card shadow dark:shadow-gray-800 sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFiles.map(file => (
              <li key={file.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    {getFileIcon(file.filename)}
                    <div className="flex-1 min-w-0 ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.filename}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatBytes(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyLinkToClipboard(file.id, file.is_public ? file.public_url : file.file_url)}
                        className="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300"
                        title={file.is_public ? "Копировать публичную ссылку" : "Копировать ссылку"}
                      >
                        {copySuccess === file.id ? (
                          <span className="text-xs text-green-600 dark:text-green-400">Скопировано!</span>
                        ) : (
                          <LinkIcon className="w-5 h-5" />
                        )}
                      </button>
                      <a
                        href={file.is_public ? `${API_BASE_URL}${file.public_url}` : `${API_BASE_URL}/api/files/download/${file.id}`}
                        download
                        className="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300"
                        title="Скачать"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => toggleFilePrivacy(file.id)}
                        className={`p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300`}
                        title={file.is_public ? "Сделать личным" : "Сделать публичным"}
                      >
                        {file.is_public ? (
                          <LockClosedIcon className="w-5 h-5" />
                        ) : (
                          <GlobeAltIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400"
                        title="Удалить"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FilesPage;
