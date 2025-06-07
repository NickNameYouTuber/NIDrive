import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton, Typography, CircularProgress, Paper, Divider, useTheme, Tooltip, Chip, Avatar } from '@mui/material';
import { Folder, InsertDriveFile, Delete, GetApp, Visibility, VisibilityOff, MoreVert, FolderOpenOutlined } from '@mui/icons-material';
import StorageIcon from '@mui/icons-material/Storage';
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
  const theme = useTheme();
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
    <>
      {/* Folders section with header */}
      {folders.length > 0 && (
        <>
          <Typography 
            variant="h6" 
            sx={{
              pt: 1,
              pb: 2,
              fontWeight: 500,
              color: theme => theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: theme => `1px solid ${theme.palette.divider}`,
              mb: 2
            }}
          >
            <Folder /> Папки ({folders.length})
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {folders.map(folder => (
              <Grid item xs={6} sm={4} md={3} lg={viewMode === 'large' ? 3 : 2} key={folder.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: theme => `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    height: viewMode === 'large' ? 200 : 150,
                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    '&:hover': { 
                      backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(245, 245, 245, 0.9)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <Folder sx={{
                    fontSize: viewMode === 'large' ? 80 : 50, 
                    color: '#fbc02d',
                    mb: 2,
                    transition: 'all 0.2s',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))'
                  }} />
                  <Typography 
                    variant={viewMode === 'large' ? 'body1' : 'body2'} 
                    fontWeight={500} 
                    align="center" 
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      maxWidth: '90%'
                    }}
                  >
                    {folder.name}
                  </Typography>
                  
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    opacity: 0, 
                    transition: 'opacity 0.2s',
                    '.MuiPaper-root:hover &': { opacity: 1 } 
                  }}>
                    <IconButton
                      size="small"
                      sx={{ 
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)', 
                        backdropFilter: 'blur(4px)',
                        '&:hover': { backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)' }
                      }}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteFolder(folder.id, e)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Files section with header */}
      {filesData.length > 0 && (
        <>
          <Typography 
            variant="h6" 
            sx={{
              pt: 1,
              pb: 2,
              fontWeight: 500,
              color: theme => theme.palette.info.main,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: theme => `1px solid ${theme.palette.divider}`,
              mb: 2
            }}
          >
            <InsertDriveFile /> Файлы ({filesData.length})
          </Typography>

          <Grid container spacing={2}>
            {filesData.map(file => (
              <Grid item xs={6} sm={4} md={3} lg={viewMode === 'large' ? 3 : 2} key={file.id}>
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
        </>
      )}
      
      {/* When both are empty */}
      {folders.length === 0 && filesData.length === 0 && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10
        }}>
          <StorageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Эта папка пуста
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, maxWidth: 400 }}>
            Загрузите файлы или создайте новую папку, чтобы начать
          </Typography>
        </Box>
      )}
    </>
  );

  const renderListView = () => (
    <>
      {/* Folders section with header */}
      {folders.length > 0 && (
        <>
          <Typography 
            variant="h6" 
            sx={{
              pt: 1,
              pb: 2,
              fontWeight: 500,
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              mb: 2
            }}
          >
            <Folder /> Папки ({folders.length})
          </Typography>

          <Paper elevation={0} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
            <List sx={{ p: 0 }}>
              {folders.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem 
                    onClick={() => handleFolderClick(folder.id)} 
                    sx={{ 
                      cursor: 'pointer',
                      py: 1.5,
                      '&:hover': { 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Folder sx={{ color: '#fbc02d' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" fontWeight={500}>{folder.name}</Typography>
                      } 
                      secondary="Папка" 
                    />
                    <Tooltip title="Удалить папку">
                      <IconButton 
                        size="small" 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteFolder(folder.id, e)}
                        sx={{
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                          '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}

      {/* Files section with header */}
      {filesData.length > 0 && (
        <>
          <Typography 
            variant="h6" 
            sx={{
              pt: 1,
              pb: 2,
              fontWeight: 500,
              color: theme.palette.info.main,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              mb: 2
            }}
          >
            <InsertDriveFile /> Файлы ({filesData.length})
          </Typography>

          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List sx={{ p: 0 }}>
              {filesData.map((file, index) => (
                <React.Fragment key={file.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem 
                    sx={{ 
                      py: 1.5, 
                      '&:hover': { 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                      }
                    }}
                  >
                    <ListItemIcon>
                      {file.mime_type?.startsWith('image/') ? (
                        <Avatar 
                          variant="rounded"
                          src={`${process.env.REACT_APP_API_URL}/api/files/preview/${file.id}`}
                          sx={{ width: 40, height: 40, borderRadius: 1 }}
                        />
                      ) : (
                        <InsertDriveFile sx={{ 
                          color: file.mime_type?.startsWith('image/') ? '#2196f3' :
                                 file.mime_type?.startsWith('video/') ? '#f44336' :
                                 file.mime_type === 'application/pdf' ? '#ff9800' :
                                 file.mime_type?.startsWith('text/') ? '#4caf50' : '#9e9e9e'
                        }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body1" fontWeight={500}>{file.filename}</Typography>}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={file.mime_type} 
                            size="small" 
                            variant="outlined" 
                            sx={{ height: 20, fontSize: '0.7rem' }} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            {file.size_mb.toFixed(2)} MB
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Скачать файл">
                        <IconButton 
                          size="small" 
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDownloadFile(file.id, file.filename, e)} 
                          sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                            '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)' }
                          }}
                        >
                          <GetApp fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={file.is_public ? 'Сделать приватным' : 'Сделать публичным'}>
                        <IconButton 
                          size="small" 
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleToggleVisibility(file.id, file.is_public, e)} 
                          sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                            '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)' }
                          }}
                        >
                          {file.is_public ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить файл">
                        <IconButton 
                          size="small" 
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDeleteFile(file.id, e)}
                          sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                            '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}
      
      {/* When both are empty */}
      {folders.length === 0 && filesData.length === 0 && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10
        }}>
          <StorageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Эта папка пуста
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, maxWidth: 400 }}>
            Загрузите файлы или создайте новую папку, чтобы начать
          </Typography>
        </Box>
      )}
    </>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
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
