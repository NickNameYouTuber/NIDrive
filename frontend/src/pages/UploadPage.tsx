import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { ArrowUpTrayIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface UploadStatus {
  id: number;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const UploadPage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [folder, setFolder] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add files to upload queue with initial status
    const newUploads = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
    
    // Process each file for upload
    acceptedFiles.forEach((file, index) => {
      uploadFile(file, newUploads[index].id);
    });
  }, [folder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const uploadFile = async (file: File, uploadId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (folder.trim()) {
      formData.append('folder', folder.trim());
    }
    
    try {
      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            setUploads(prev => 
              prev.map(upload => 
                upload.id === uploadId 
                  ? { ...upload, progress: percentCompleted } 
                  : upload
              )
            );
          }
        }
      });
      
      // Update status to success
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'success', progress: 100 } 
            : upload
        )
      );
      
    } catch (error: any) {
      // Update status to error
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId 
            ? { 
                ...upload, 
                status: 'error', 
                error: error.response?.data?.detail || 'Ошибка загрузки' 
              } 
            : upload
        )
      );
    }
  };

  const removeUpload = (id: number) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Загрузка файлов</h1>
      </div>

      {/* Folder selection */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <label htmlFor="folder" className="block text-sm font-medium text-gray-700">
          Папка (необязательно)
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="folder"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Введите имя папки"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Оставьте пустым, чтобы загрузить в корневую директорию
        </p>
      </div>

      {/* File upload dropzone */}
      <div 
        {...getRootProps()} 
        className={`p-10 border-2 border-dashed rounded-lg cursor-pointer ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <ArrowUpTrayIcon className="w-12 h-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            {isDragActive
              ? 'Перетащите файлы сюда...'
              : 'Перетащите файлы сюда или нажмите для выбора'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Максимальный размер всех файлов: 5 ГБ
          </p>
        </div>
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-900">Загрузки</h2>
          
          <ul className="mt-4 space-y-4">
            {uploads.map(upload => (
              <li key={upload.id} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    {upload.status === 'success' ? (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : upload.status === 'error' ? (
                      <XMarkIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 mr-1">
                        <svg className="w-5 h-5 animate-spin text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 ml-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(upload.size)}
                      </p>
                      {upload.error && (
                        <p className="text-xs text-red-500">{upload.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeUpload(upload.id)}
                    className="p-1 ml-2 text-gray-400 rounded-full hover:text-gray-500 hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1 mt-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-1 rounded-full ${
                      upload.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-primary-500'
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
