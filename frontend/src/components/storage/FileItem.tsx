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
  Button
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GetAppIcon from '@mui/icons-material/GetApp';
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
}

const FileItem: React.FC<FileItemProps> = ({ file, onDeleteFile, onToggleVisibility }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
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

  const handleDownload = () => {
    handleMenuClose();
    window.open(fileService.getDownloadLink(file.id), '_blank');
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

  return (
    <Card sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4
      }
    }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          py: 2,
          bgcolor: 'action.hover'
        }}
      >
        {getFileIcon()}
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" noWrap title={file.filename}>
          {file.filename}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatFileSize(file.size_mb)}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Added {formatDate(file.created_at)}
        </Typography>
        {file.is_public && (
          <Chip 
            label="Public" 
            size="small" 
            color="primary" 
            sx={{ mt: 1 }}
            icon={<VisibilityIcon />}
          />
        )}
      </CardContent>
      <CardActions>
        <Button 
          size="small" 
          startIcon={<GetAppIcon />} 
          onClick={handleDownload}
          sx={{ mr: 'auto' }}
        >
          Download
        </Button>
        <IconButton onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>
      </CardActions>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleVisibility}>
          <ListItemIcon>
            {file.is_public ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </ListItemIcon>
          <ListItemText>
            {file.is_public ? 'Make Private' : 'Make Public'}
          </ListItemText>
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
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default FileItem;
