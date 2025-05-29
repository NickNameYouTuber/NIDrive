import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { 
  DocumentIcon, 
  PhotoIcon, 
  MusicalNoteIcon, 
  FilmIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

interface FileStats {
  totalCount: number;
  byType: {
    [key: string]: number;
  };
  recentFiles: any[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch storage usage
        const storageResponse = await api.get('/storage/usage');
        setStorageInfo(storageResponse.data);
        
        // Fetch files
        const filesResponse = await api.get('/files');
        
        // Calculate file stats
        const files = filesResponse.data;
        const byType: {[key: string]: number} = {};
        
        files.forEach((file: any) => {
          const extension = file.filename.split('.').pop()?.toLowerCase() || 'unknown';
          byType[extension] = (byType[extension] || 0) + 1;
        });
        
        setFileStats({
          totalCount: files.length,
          byType,
          recentFiles: files.slice(0, 5) // Get 5 most recent files
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Обзор</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Storage Card */}
        <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Использование хранилища</h2>
          
          {storageInfo && (
            <>
              <div className="mt-4 mb-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className="h-2 rounded-full bg-primary-600" 
                    style={{ width: `${storageInfo.percentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{formatBytes(storageInfo.used)}</span>
                <span>{formatBytes(storageInfo.total)}</span>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Использовано {storageInfo.percentage.toFixed(1)}% из доступных 5 ГБ
              </p>
            </>
          )}
        </div>

        {/* Files Count Card */}
        <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Файлы</h2>
          
          {fileStats && (
            <div className="mt-4">
              <p className="text-3xl font-bold text-primary-600">
                {fileStats.totalCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Всего файлов в хранилище
              </p>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">По типам файлов</h3>
                <ul className="mt-2 space-y-2">
                  {Object.entries(fileStats.byType).slice(0, 3).map(([type, count]) => (
                    <li key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">.{type}</span>
                      <span className="text-sm font-medium dark:text-gray-300">{count} файлов</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* User Info Card */}
        <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Аккаунт</h2>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Имя пользователя</p>
            <p className="font-medium dark:text-gray-200">
              {user?.first_name} {user?.last_name}
            </p>
            
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Telegram</p>
            <p className="font-medium dark:text-gray-200">@{user?.username || 'user'}</p>
            
            <div className="mt-4 p-3 bg-primary-50 dark:bg-[#2e2e2e] rounded-md">
              <p className="text-sm text-primary-700 dark:text-primary-400">
                Ваши файлы также доступны через Telegram бота
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      {fileStats && fileStats.recentFiles.length > 0 && (
        <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Недавние файлы</h2>
          
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
            {fileStats.recentFiles.map((file) => (
              <li key={file.id} className="py-3">
                <div className="flex items-center">
                  {getFileIcon(file.filename)}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBytes(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-[#2e2e2e] rounded-md hover:bg-primary-100 dark:hover:bg-[#3e3e3e]"
                  >
                    Открыть
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
