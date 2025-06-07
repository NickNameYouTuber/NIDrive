import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GetAppIcon from '@mui/icons-material/GetApp';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import { fileService } from '../../services/fileService';

interface FileItemProps {
  file: {
    id: number;
    filename: string;
    size_mb: number;
    mime_type: string;
    is_public: boolean;
    public_url: string | null;
    created_at: string;
  };
  onDeleteFile: (fileId: number) => Promise<void>;
  onToggleVisibility: (fileId: number, isPublic: boolean) => Promise<void>;
  viewMode?: 'compact' | 'comfortable' | 'large' | 'list';
}

const FileItem: React.FC<FileItemProps> = ({ file, onDeleteFile, onToggleVisibility, viewMode = 'comfortable' }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publicUrlDialogOpen, setPublicUrlDialogOpen] = useState(false);
  const [publicUrlData, setPublicUrlData] = useState<{
    file_url: string;
    filename: string;
    is_public: boolean;
    requires_auth?: boolean;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    await onDeleteFile(file.id);
  };

  const handleToggleVisibility = async () => {
    handleMenuClose();
    await onToggleVisibility(file.id, !file.is_public);
  };

  const handleDownload = async () => {
    handleMenuClose();
    try {
      await fileService.downloadFile(file.id, file.filename);
    } catch (error) {
      console.error('Ошибка при скачивании:', error);
      alert(`Ошибка при скачивании ${file.filename}`);
    }
  };
  
  // Добавляем обработчик для получения публичной ссылки
  const handleGetPublicUrl = async () => {
    handleMenuClose();
    try {
      const urlData = await fileService.getPublicUrl(file.id);
      setPublicUrlData(urlData);
      setPublicUrlDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при получении публичной ссылки:', error);
      alert('Не удалось получить публичную ссылку');
    }
  };
  
  // Копирование ссылки в буфер обмена
  const copyToClipboard = () => {
    if (publicUrlData?.file_url) {
      navigator.clipboard.writeText(publicUrlData.file_url)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
        })
        .catch(err => {
          console.error('Ошибка при копировании:', err);
        });
    }
  };

  // Get file icon based on MIME type
  const getFileIcon = () => {
    if (file.mime_type.startsWith('image/')) {
      return <ImageIcon fontSize="large" />;
    } else if (file.mime_type === 'application/pdf') {
      return <PictureAsPdfIcon fontSize="large" />;
    } else if (file.mime_type.startsWith('text/')) {
      return <DescriptionIcon fontSize="large" />;
    } else {
      return <InsertDriveFileIcon fontSize="large" />;
    }
  };

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 0.1) {
      return `${Math.round(size * 1024)} KB`;
    } else if (size < 1) {
      return `${Math.round(size * 100) / 100} MB`;
    } else {
      return `${Math.round(size * 10) / 10} MB`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Определяем стили для разных режимов отображения
  const getCardStyles = () => {
    const baseStyles = {
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: viewMode !== 'list' ? 'translateY(-4px)' : 'none',
        boxShadow: 3,
      }
    };
    
    switch (viewMode) {
      case 'list':
        return {
          ...baseStyles,
          height: 'auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          p: 1
        };
      case 'compact':
        return {
          ...baseStyles,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '& .MuiCardContent-root': {
            p: 1
          },
          '& .MuiCardActions-root': {
            p: '0 8px 8px'
          },
          '& .MuiTypography-root': {
            fontSize: '0.85rem'
          }
        };
      case 'large':
        return {
          ...baseStyles,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '& .MuiCardContent-root': {
            p: 2
          },
          '& .MuiTypography-root.file-name': {
            fontSize: '1.2rem'
          }
        };
      case 'comfortable':
      default:
        return {
          ...baseStyles,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        };
    }
  };
  
  // Форматирование MIME типа файла
  const formatMimeType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'Image';
    } else if (mimeType === 'application/pdf') {
      return 'PDF';
    } else if (mimeType.startsWith('text/')) {
      return 'Text';
    } else if (mimeType.startsWith('video/')) {
      return 'Video';
    } else if (mimeType.startsWith('audio/')) {
      return 'Audio';
    } else {
      return mimeType.split('/')[1] || mimeType;
    }
  };
  
  return (
    <Card variant="outlined" sx={getCardStyles()}>
      {viewMode === 'list' ? (
        // List view layout
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 40%', overflow: 'hidden' }}>
            <Box sx={{ mr: 1 }}>{getFileIcon()}</Box>
            <Typography className="file-name" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {file.filename}
            </Typography>
          </Box>
          
          <Box sx={{ flex: '0 0 15%', pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(file.size_mb)}
            </Typography>
          </Box>
          
          <Box sx={{ flex: '0 0 15%', pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {formatMimeType(file.mime_type)}
            </Typography>
          </Box>
          
          <Box sx={{ flex: '0 0 15%', pl: 2 }}>
            <Chip 
              size="small" 
              color={file.is_public ? "success" : "default"} 
              label={file.is_public ? "Public" : "Private"} 
              icon={file.is_public ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            />
          </Box>
          
          <Box sx={{ flex: '0 0 15%', display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={handleDownload} size="small">
              <GetAppIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={handleMenuClick} size="small">
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        // Grid view layout
        <>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              py: viewMode === 'compact' ? 1 : 2,
              bgcolor: 'action.hover'
            }}
          >
            {getFileIcon()}
          </Box>
          <CardContent sx={{ 
            flexGrow: 1, 
            p: viewMode === 'compact' ? 1 : 2,
            overflow: 'hidden' 
          }}>
            <Typography 
              className="file-name" 
              variant={viewMode === 'large' ? "h6" : "subtitle1"} 
              noWrap 
              title={file.filename}
              sx={{ 
                mb: 0.5,
                fontSize: viewMode === 'compact' ? '0.9rem' : 'inherit'
              }}
            >
              {file.filename}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: viewMode === 'compact' ? '0.8rem' : 'inherit'
              }}
            >
              {formatFileSize(file.size_mb)}
            </Typography>
            
            {viewMode !== 'compact' && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                display="block"
                sx={{ mt: 0.5 }}
              >
                Added {formatDate(file.created_at)}
              </Typography>
            )}
            
            {file.is_public && viewMode !== 'compact' && (
              <Chip 
                label="Public" 
                size="small" 
                color="primary" 
                sx={{ mt: 1 }}
                icon={<VisibilityIcon />}
              />
            )}
          </CardContent>
          <CardActions sx={{ 
            p: viewMode === 'compact' ? '2px 8px 8px' : undefined 
          }}>
            <Button 
              size="small" 
              startIcon={<GetAppIcon />} 
              onClick={handleDownload}
              sx={{ mr: 'auto' }}
            >
              {viewMode !== 'compact' ? 'Download' : ''}
            </Button>
            <IconButton onClick={handleMenuClick} size={viewMode === 'compact' ? 'small' : 'medium'}>
              <MoreVertIcon fontSize={viewMode === 'compact' ? 'small' : 'medium'} />
            </IconButton>
          </CardActions>
        </>
      )}
      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{ paper: { sx: { width: 200 } } }}
      >
        <MenuItem onClick={handleToggleVisibility}>
          <ListItemIcon>
            {file.is_public ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </ListItemIcon>
          <ListItemText>
            {file.is_public ? 'Make Private' : 'Make Public'}
          </ListItemText>
        </MenuItem>
        {/* Новый пункт меню для получения публичной ссылки */}
        <MenuItem onClick={handleGetPublicUrl}>
          <ListItemIcon>
            <LinkIcon />
          </ListItemIcon>
          <ListItemText>Get Download Link</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <GetAppIcon />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{file.filename}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалоговое окно для отображения ссылки на скачивание */}
      <Dialog
        open={publicUrlDialogOpen}
        onClose={() => setPublicUrlDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {publicUrlData?.is_public ? "Public Download Link" : "Direct Download Link"}
        </DialogTitle>
        <DialogContent>
          {publicUrlData?.requires_auth && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a private file. A direct download link has been generated that will work with your current authentication.
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            You can use this link to download {publicUrlData?.filename}:
          </DialogContentText>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              value={publicUrlData?.file_url || ''}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
            />
            <Tooltip title="Copy link">
              <Button 
                onClick={copyToClipboard} 
                startIcon={<ContentCopyIcon />}
                sx={{ ml: 1 }}
              >
                Copy
              </Button>
            </Tooltip>
          </Box>
          
          <DialogContentText variant="body2">
            You can also use the button below to download the file directly:
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={async () => {
              try {
                if (publicUrlData?.file_url && publicUrlData?.filename) {
                  await fileService.downloadFile(file.id, publicUrlData.filename);
                }
              } catch (error) {
                console.error('Ошибка при скачивании:', error);
              }
            }}
            color="primary"
            startIcon={<GetAppIcon />}
          >
            Download
          </Button>
          <Button onClick={() => setPublicUrlDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомление о успешном копировании */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
      >
        <Alert onClose={() => setCopySuccess(false)} severity="success" sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default FileItem;
