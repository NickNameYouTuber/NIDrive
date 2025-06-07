import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Breadcrumbs, Link, Divider, useMediaQuery, useTheme,
  Button, IconButton, Tooltip
} from '@mui/material';
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
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Состояния для диалога создания папки
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  
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
    const breadcrumbItems: BreadcrumbItem[] = [{ id: null, name: 'Корневая папка' }];

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

  const handleBreadcrumbClick = (id: number | null, event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.preventDefault();
    }
    
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
    setSearchQuery(query);
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

  // Обработчик открытия диалога создания папки
  const handleOpenNewFolderDialog = () => {
    setNewFolderName('');
    setNewFolderDialogOpen(true);
  };

  // Обработчик закрытия диалога создания папки
  const handleCloseNewFolderDialog = () => {
    setNewFolderDialogOpen(false);
  };

  // Обработчик создания новой папки
  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      await folderService.createFolder({
        name: newFolderName.trim(),
        parent_id: currentFolderId
      });
      refreshFiles();
      handleCloseNewFolderDialog();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, px: isMobile ? 1 : 3, py: 2, maxWidth: '1400px', mx: 'auto' }}>
      {/* Шапка страницы с заголовком */}
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
      </Box>

      {/* Навигация с хлебными крошками */}
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
              onClick={(event) => handleBreadcrumbClick(breadcrumb.id, event)}
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

      {/* Блок с загрузкой файлов, созданием папки и управлением */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 2,
          mb: 2
        }}>
          <Box sx={{ flex: '1 1 auto' }}>
            <FileUploader currentFolderId={currentFolderId} onFileUploaded={refreshFiles} />
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isMobile ? 'flex-start' : 'center' 
          }}>
            <Tooltip title="Создать новую папку">
              <Button
                variant="contained"
                color="primary"
                startIcon={<CreateNewFolderIcon />}
                onClick={handleOpenNewFolderDialog}
                sx={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  px: 2
                }}
              >
                Новая папка
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Панель поиска и переключения вида - теперь под загрузчиком! */}
        <Paper
          sx={{
            p: 2,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66,66,66,0.4)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: isMobile ? '100%' : 'auto' 
          }}>
            <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 500 }}>
              {isSearching ? `Результаты поиска: ${searchResults.length}` : 'Файлы и папки:'}
            </Typography>
            {isSearching && (
              <Tooltip title="Очистить поиск">
                <Button 
                  size="small" 
                  onClick={() => handleSearch('', { type: 'all' })} 
                  sx={{ ml: 1, minWidth: 'auto' }}
                >
                  Сбросить
                </Button>
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: isMobile ? '100%' : 'auto',
            gap: 2 
          }}>
            <Box sx={{ flexGrow: 1, maxWidth: isMobile ? '100%' : '300px' }}>
              <SearchBar onSearch={handleSearch} />
            </Box>
            <Box>
              <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Основной контент - список файлов и папок */}
      <Paper
        sx={{
          p: 2,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66,66,66,0.3)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          minHeight: '200px',
        }}
      >
        <FileExplorer 
          currentFolderId={currentFolderId} 
          isLoading={isLoading}
          updateTrigger={filesUpdateTrigger}
          setUpdateTrigger={setFilesUpdateTrigger}
          viewMode={viewMode}
          files={isSearching ? searchResults : undefined}
        />
      </Paper>

      {/* Диалог создания новой папки */}
      <Dialog
        open={newFolderDialogOpen}
        onClose={handleCloseNewFolderDialog}
        aria-labelledby="create-folder-dialog-title"
      >
        <DialogTitle id="create-folder-dialog-title">Создать новую папку</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Введите имя новой папки, которая будет создана в текущей директории.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Имя папки"
            type="text"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewFolderDialog}>Отмена</Button>
          <Button 
            onClick={handleCreateNewFolder} 
            variant="contained" 
            color="primary"
            disabled={isCreatingFolder || !newFolderName.trim()}
          >
            {isCreatingFolder ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoragePage;
