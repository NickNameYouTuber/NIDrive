import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton, Typography, CircularProgress } from '@mui/material';
import { Folder, InsertDriveFile, Delete, GetApp, Visibility, VisibilityOff, MoreVert } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import FileItem from './FileItem';

interface FileExplorerProps {
  currentFolderId: number | null;
  updateTrigger: number;
  setUpdateTrigger: React.Dispatch<React.SetStateAction<number>>;
  isLoading?: boolean;
  viewMode: 'grid' | 'list' | 'large';
  files?: any[];
}

const FileExplorer: React.FC<FileExplorerProps> = ({ currentFolderId, updateTrigger, setUpdateTrigger, isLoading = false, viewMode, files }) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [filesData, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch folders
        const foldersData = await folderService.getFolders(currentFolderId);
        setFolders(foldersData);

        // Use provided files if available (e.g., search results)
        if (files && files.length > 0) {
          setFiles(files);
        } else {
          // Otherwise fetch files for the current folder
          const filesData = await fileService.getFiles(currentFolderId);
          setFiles(filesData);
        }
      } catch (error) {
        enqueueSnackbar('Ошибка при загрузке данных', { variant: 'error' });
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchData();
    }
  }, [currentFolderId, updateTrigger, isLoading, files, enqueueSnackbar]);

  const handleFolderClick = (folderId: number) => {
    navigate(`/storage/${folderId}`);
  };

  const handleDeleteFolder = async (folderId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await folderService.deleteFolder(folderId);
      setUpdateTrigger(updateTrigger + 1);
      enqueueSnackbar('Папка удалена', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Ошибка при удалении папки', { variant: 'error' });
      console.error('Error deleting folder:', error);
    }
  };

  const handleDeleteFile = async (fileId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await fileService.deleteFile(fileId);
      setUpdateTrigger(updateTrigger + 1);
      enqueueSnackbar('Файл удален', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Ошибка при удалении файла', { variant: 'error' });
      console.error('Error deleting file:', error);
    }
  };

  const handleDownloadFile = async (fileId: number, filename: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await fileService.downloadFile(fileId, filename);
      enqueueSnackbar('Файл скачан', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Ошибка при скачивании файла', { variant: 'error' });
      console.error('Error downloading file:', error);
    }
  };

  const handleToggleVisibility = async (fileId: number, isPublic: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await fileService.toggleFileVisibility(fileId, !isPublic);
      setUpdateTrigger(updateTrigger + 1);
      enqueueSnackbar(isPublic ? 'Файл больше не публичный' : 'Файл теперь публичный', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Ошибка при изменении видимости файла', { variant: 'error' });
      console.error('Error toggling visibility:', error);
    }
  };

  const renderGridView = () => (
    <Grid container spacing={2}>
      {folders.map(folder => (
        <Grid item xs={6} sm={4} md={3} lg={viewMode === 'large' ? 2 : 2} key={folder.id}>
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#f5f5f5' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: viewMode === 'large' ? 200 : 150,
            }}
            onClick={() => handleFolderClick(folder.id)}
          >
            <Folder sx={{ fontSize: viewMode === 'large' ? 80 : 50, color: '#fbc02d' }} />
            <Typography variant="body2" noWrap sx={{ mt: 1, maxWidth: '100%' }}>
              {folder.name}
            </Typography>
            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 5, right: 5 }}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteFolder(folder.id, e)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
      ))}

      {filesData.map(file => (
        <Grid item xs={6} sm={4} md={3} lg={viewMode === 'large' ? 2 : 2} key={file.id}>
          <FileItem
            file={file}
            onDownload={(e: React.MouseEvent<HTMLElement>) => handleDownloadFile(file.id, file.filename, e as React.MouseEvent<HTMLButtonElement>)}
            onDelete={(e: React.MouseEvent<HTMLElement>) => handleDeleteFile(file.id, e as React.MouseEvent<HTMLButtonElement>)}
            onToggleVisibility={(e: React.MouseEvent<HTMLElement>) => handleToggleVisibility(file.id, file.is_public, e as React.MouseEvent<HTMLButtonElement>)}
            viewMode={viewMode}
          />
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <List>
      {folders.map(folder => (
        <ListItem key={folder.id} onClick={() => handleFolderClick(folder.id)} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <Folder color="primary" />
          </ListItemIcon>
          <ListItemText primary={folder.name} secondary="Folder" />
          <ListItemSecondaryAction>
            <IconButton size="small" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteFolder(folder.id, e)}>
              <Delete fontSize="small" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}

      {filesData.map(file => (
        <ListItem key={file.id} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <InsertDriveFile />
          </ListItemIcon>
          <ListItemText
            primary={file.filename}
            secondary={`${file.mime_type} - ${file.size_mb.toFixed(2)} MB`}
          />
          <ListItemSecondaryAction>
            <IconButton size="small" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDownloadFile(file.id, file.filename, e)} sx={{ mr: 1 }}>
              <GetApp fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleToggleVisibility(file.id, file.is_public, e)} sx={{ mr: 1 }}>
              {file.is_public ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
            </IconButton>
            <IconButton size="small" onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteFile(file.id, e)}>
              <Delete fontSize="small" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (folders.length === 0 && filesData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="textSecondary">
          В этой папке пока нет файлов или папок
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {viewMode === 'list' ? renderListView() : renderGridView()}
    </Box>
  );
};

export default FileExplorer;
