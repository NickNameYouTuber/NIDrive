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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import { folderService } from '../../services/folderService';

interface FolderItemProps {
  folder: {
    id: number;
    name: string;
    created_at: string;
  };
  onFolderClick: (folderId: number) => void;
  onDeleteFolder: (folderId: number) => Promise<void>;
  viewMode?: 'compact' | 'comfortable' | 'large' | 'list';
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, onFolderClick, onDeleteFolder, viewMode = 'comfortable' }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folder.name);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCloseDeleteDialog = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    setDeleteDialogOpen(false);
  };
  
  const handleCloseRenameDialog = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    setRenameDialogOpen(false);
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLElement>) => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = () => {
    handleMenuClose();
    setNewFolderName(folder.name);
    setRenameDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    await onDeleteFolder(folder.id);
  };

  const handleConfirmRename = async () => {
    if (newFolderName.trim() !== '' && newFolderName !== folder.name) {
      try {
        await folderService.updateFolder(folder.id, newFolderName, null);
        // Update would happen via parent component re-fetching data
        setRenameDialogOpen(false);
      } catch (error) {
        console.error('Error renaming folder:', error);
      }
    } else {
      setRenameDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getCardStyles = () => {
    const baseStyles = {
      cursor: 'pointer',
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
          '& .MuiTypography-root.folder-name': {
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

  return (
    <Card 
      variant="outlined"
      sx={getCardStyles()}
      onClick={() => onFolderClick(folder.id)}
    >
      {viewMode === 'list' ? (
        // List view layout
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: '0 0 70%', overflow: 'hidden' }}>
            <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography className="folder-name" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {folder.name}
            </Typography>
          </Box>
          
          <Box sx={{ flex: '0 0 15%', pl: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(folder.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          
          <Box sx={{ flex: '0 0 15%', display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        // Grid view layout
        <>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            py: viewMode === 'compact' ? 1 : 2,
            bgcolor: theme => theme.palette.mode === 'light' ? 'primary.light' : 'primary.dark',
            color: 'white'
          }}>
            <FolderIcon sx={{ fontSize: viewMode === 'compact' ? 30 : 40 }} />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: viewMode === 'compact' ? 1 : 2, 
            justifyContent: 'space-between'
          }}>
            <Typography 
              className="folder-name"
              variant={viewMode === 'large' ? "h6" : "subtitle1"} 
              sx={{ 
                flex: 1, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontSize: viewMode === 'compact' ? '0.9rem' : 'inherit'
              }}
            >
              {folder.name}
            </Typography>
            <IconButton 
              size={viewMode === 'compact' ? 'small' : 'medium'}
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e);
              }}
            >
              <MoreVertIcon fontSize={viewMode === 'compact' ? 'small' : 'medium'} />
            </IconButton>
          </Box>
        </>
      )}
      {viewMode !== 'list' && viewMode !== 'compact' && (
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(folder.created_at)}
          </Typography>
        </CardContent>
      )}
      {viewMode === 'list' || (
        <CardActions sx={{ justifyContent: 'flex-end', p: viewMode === 'compact' ? '0 8px 8px' : undefined }}>
          {/* Здесь могут быть дополнительные действия, но убираем лишнюю кнопку с троеточием */}
        </CardActions>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
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
        onClose={handleCloseDeleteDialog}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the folder "{folder.name}" and all its contents? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={handleCloseRenameDialog}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Folder Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRename} variant="contained">Rename</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default FolderItem;
