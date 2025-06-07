import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Breadcrumbs, Link, Divider, useMediaQuery, useTheme } from '@mui/material';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import FileExplorer from '../components/storage/FileExplorer';
import FileUploader from '../components/storage/FileUploader';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import ViewToggle from '../components/storage/ViewToggle';
import SearchBar from '../components/storage/SearchBar';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Корневая папка' }]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filesUpdateTrigger, setFilesUpdateTrigger] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'large'>('grid');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const currentFolderId = folderId ? parseInt(folderId, 10) : null;

  // Функция для обновления списка файлов
  const refreshFiles = () => {
    setFilesUpdateTrigger(prev => prev + 1);
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

  const handleViewChange = (mode: 'grid' | 'list' | 'large') => {
    setViewMode(mode);
  };

  const handleSearch = async (query: string, filters: any) => {
    if (!query) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    try {
      const results = await fileService.searchFiles(query, filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, px: isMobile ? 1 : 3, py: 2, maxWidth: '1400px', mx: 'auto' }}>
      {/* Заголовок и хлебные крошки */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 2 : 0 }}>
          <StorageIcon sx={{ mr: 1, color: theme.palette.primary.main, fontSize: '2rem' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Хранилище
          </Typography>
        </Box>
        
        {/* Панель поиска и переключателя вида */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
          <Box sx={{ flexGrow: 1, mr: 2, maxWidth: isMobile ? '100%' : '300px' }}>
            <SearchBar onSearch={handleSearch} />
          </Box>
          <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
        </Box>
      </Box>

      {/* Улучшенная навигация по хлебным крошкам */}
      <Paper 
        sx={{ 
          p: 1.5, 
          mb: 3, 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(8px)',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(66, 66, 66, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
        }} 
        elevation={0}
      >
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />} 
          aria-label="навигация по папкам"
          sx={{ px: 1 }}
        >
          {breadcrumbs.map((breadcrumb, index) => (
            <Link
              key={index}
              underline="hover"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: '8px',
                px: 1,
                py: 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)'
                },
                color: index === breadcrumbs.length - 1 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                fontWeight: index === breadcrumbs.length - 1 ? 500 : 400
              }}
              onClick={() => handleBreadcrumbClick(breadcrumb.id)}
            >
              {breadcrumb.id === null ? (
                <HomeIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
              ) : (
                <FolderIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
              )}
              {breadcrumb.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* Кнопка загрузки файла */}
      <Box sx={{ mb: 3 }}>
        <FileUploader currentFolderId={currentFolderId} onFileUploaded={refreshFiles} />
      </Box>

      <FileExplorer 
        currentFolderId={currentFolderId} 
        isLoading={isLoading}
        updateTrigger={filesUpdateTrigger}
        setUpdateTrigger={setFilesUpdateTrigger}
        viewMode={viewMode}
        files={isSearching ? searchResults : undefined}
      />
    </Box>
  );
};

export default StoragePage;
