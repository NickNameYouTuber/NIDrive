import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Breadcrumbs, Link, Divider } from '@mui/material';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import FileExplorer from '../components/storage/FileExplorer';
import FileUploader from '../components/storage/FileUploader';
import RecentItems from '../components/storage/RecentItems';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

interface BreadcrumbItem {
  id: number | null;
  name: string;
}

const StoragePage: React.FC = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Root' }]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filesUpdateTrigger, setFilesUpdateTrigger] = useState<number>(0);
  const currentFolderId = folderId ? parseInt(folderId, 10) : null;
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [recentFolders, setRecentFolders] = useState<any[]>([]);
  const [recentItemsLoading, setRecentItemsLoading] = useState<boolean>(false);
  
  // Функция для обновления списка файлов
  const refreshFiles = () => {
    setFilesUpdateTrigger(prev => prev + 1);
    // При добавлении новых файлов также обновляем список недавних элементов
    fetchRecentItems();
  };
  
  // Получаем недавние файлы и папки
  const fetchRecentItems = async () => {
    if (currentFolderId !== null) return; // Показываем недавние элементы только на главной странице
    
    setRecentItemsLoading(true);
    try {
      const [filesData, foldersData] = await Promise.all([
        fileService.getRecentFiles(8),
        folderService.getRecentFolders(8)
      ]);
      
      setRecentFiles(filesData);
      setRecentFolders(foldersData);
    } catch (error) {
      console.error('Error fetching recent items:', error);
    } finally {
      setRecentItemsLoading(false);
    }
  };

  useEffect(() => {
    const fetchFolderData = async () => {
      setIsLoading(true);
      try {
        if (currentFolderId !== null) {
          const folder = await folderService.getFolder(currentFolderId);
          setCurrentFolder(folder);
          await buildBreadcrumbs(folder);
        } else {
          setCurrentFolder(null);
          setBreadcrumbs([{ id: null, name: 'Root' }]);
          // Загружаем недавние элементы только когда находимся в корневой директории
          fetchRecentItems();
        }
      } catch (error) {
        console.error('Error fetching folder data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolderData();
  }, [currentFolderId]);

  const buildBreadcrumbs = async (folder: Folder) => {
    const breadcrumbItems: BreadcrumbItem[] = [{ id: null, name: 'Root' }];
    
    // If we're in a subfolder, build the path
    if (folder) {
      const getFolderPath = async (folderId: number | null) => {
        if (folderId === null) return;
        
        try {
          const parentFolder = await folderService.getFolder(folderId);
          if (parentFolder.parent_id !== null) {
            await getFolderPath(parentFolder.parent_id);
          }
          breadcrumbItems.push({
            id: parentFolder.id,
            name: parentFolder.name
          });
        } catch (error) {
          console.error('Error building breadcrumbs:', error);
        }
      };
      
      await getFolderPath(folder.parent_id);
      
      // Add the current folder
      breadcrumbItems.push({
        id: folder.id,
        name: folder.name
      });
    }
    
    setBreadcrumbs(breadcrumbItems);
  };

  const handleBreadcrumbClick = (id: number | null) => {
    if (id === null) {
      navigate('/storage');
    } else {
      navigate(`/storage/${id}`);
    }
  };
  
  // Обработка клика по недавнему файлу
  const handleRecentFileClick = (file: any) => {
    // Если файл находится в папке, переходим в эту папку
    if (file.folder_id !== null) {
      navigate(`/storage/${file.folder_id}`);
    } else {
      // Иначе просто переходим в корневой каталог
      navigate('/storage');
    }
    
    // Здесь можно добавить логику предпросмотра или скачивания файла
    // Например, открыть модальное окно с предпросмотром
  };
  
  // Обработка клика "Показать все недавние"
  const handleViewAllRecent = () => {
    // Для простоты сейчас просто переходим в корневую директорию
    navigate('/storage');
    
    // В будущем можно реализовать отдельную страницу или режим отображения всех недавних файлов
    // navigate('/storage/recent');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Storage
        </Typography>
      </Box>

      {/* File Uploader - Переместили выше навигации по запросу */}
      <FileUploader currentFolderId={currentFolderId} onFileUploaded={refreshFiles} />
      
      <Divider sx={{ my: 3 }} />
      
      {/* Недавние элементы - показываем только на главной странице */}
      {currentFolderId === null && (
        <RecentItems 
          recentFiles={recentFiles}
          recentFolders={recentFolders}
          onFileClick={handleRecentFileClick}
          onFolderClick={handleBreadcrumbClick}
          onViewAllClick={handleViewAllRecent}
        />
      )}

      {/* Breadcrumb Navigation */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 1 }} elevation={1}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="folder navigation breadcrumb"
        >
          {breadcrumbs.map((breadcrumb, index) => (
            <Link
              key={index}
              underline="hover"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                color: index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'
              }}
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
              onClick={() => handleBreadcrumbClick(breadcrumb.id)}
            >
              {breadcrumb.id === null && <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />}
              {breadcrumb.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>
      
      {/* File Explorer */}
      <FileExplorer 
        currentFolderId={currentFolderId} 
        isLoading={isLoading}
        updateTrigger={filesUpdateTrigger}
      />
    </Box>
  );
};

export default StoragePage;
