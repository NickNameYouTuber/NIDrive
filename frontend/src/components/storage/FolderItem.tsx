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
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, onFolderClick, onDeleteFolder }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folder.name);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLElement>) => {
    handleMenuClose(event);
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = (event: React.MouseEvent<HTMLElement>) => {
    handleMenuClose(event);
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

  return (
    <Card 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={() => onFolderClick(folder.id)}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          py: 2,
          bgcolor: theme => theme.palette.mode === 'light' ? 'primary.light' : 'primary.dark',
          color: 'white'
        }}
      >
        <FolderIcon sx={{ fontSize: 40 }} />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" noWrap title={folder.name}>
          {folder.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Created {formatDate(folder.created_at)}
        </Typography>
      </CardContent>
      <CardActions>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardActions>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
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
        onClose={() => setDeleteDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
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
        onClose={() => setRenameDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
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
