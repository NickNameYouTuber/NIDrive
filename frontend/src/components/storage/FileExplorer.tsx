import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import { useSnackbar } from 'notistack';

interface FileExplorerProps {
  currentFolderId: number | null;
  isLoading: boolean;
  updateTrigger?: number; // Триггер для обновления списка файлов
}

const FileExplorer: React.FC<FileExplorerProps> = ({ currentFolderId, isLoading, updateTrigger = 0 }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  
  // New folder dialog
  const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  
  // Fetch files and folders data
  useEffect(() => {
    const fetchData = async () => {
      setLocalLoading(true);
      try {
        // Fetch folders
        const foldersData = await folderService.getFolders(currentFolderId);
        setFolders(foldersData);
        
        // Fetch files
        const filesData = await fileService.getFiles(currentFolderId);
        setFiles(filesData);
      } catch (error) {
        console.error('Error fetching files/folders:', error);
        enqueueSnackbar('Failed to load files or folders', { variant: 'error' });
      } finally {
        setLocalLoading(false);
      }
    };
    
    if (!isLoading) {
      fetchData();
    }
  }, [currentFolderId, isLoading, updateTrigger, enqueueSnackbar]);
  
  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      enqueueSnackbar('Please enter a folder name', { variant: 'warning' });
      return;
    }
    
    try {
      const newFolder = await folderService.createFolder(newFolderName, currentFolderId);
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setNewFolderOpen(false);
      enqueueSnackbar(`Folder "${newFolderName}" created`, { variant: 'success' });
    } catch (error) {
      console.error('Error creating folder:', error);
      enqueueSnackbar('Failed to create folder', { variant: 'error' });
    }
  };
  
  // Handle folder navigation
  const handleFolderClick = (folderId: number) => {
    navigate(`/storage/${folderId}`);
  };
  
  // Handle folder deletion
  const handleDeleteFolder = async (folderId: number) => {
    try {
      await folderService.deleteFolder(folderId);
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      enqueueSnackbar('Folder deleted', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting folder:', error);
      enqueueSnackbar('Failed to delete folder', { variant: 'error' });
    }
  };
  
  // Handle file deletion
  const handleDeleteFile = async (fileId: number) => {
    try {
      await fileService.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
      enqueueSnackbar('File deleted', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting file:', error);
      enqueueSnackbar('Failed to delete file', { variant: 'error' });
    }
  };
  
  // Handle file visibility toggle
  const handleToggleFileVisibility = async (fileId: number, isPublic: boolean) => {
    try {
      const updatedFile = await fileService.toggleFileVisibility(fileId, isPublic);
      setFiles(prev => prev.map(file => file.id === fileId ? updatedFile : file));
      enqueueSnackbar(`File is now ${isPublic ? 'public' : 'private'}`, { variant: 'success' });
    } catch (error) {
      console.error('Error toggling file visibility:', error);
      enqueueSnackbar('Failed to update file visibility', { variant: 'error' });
    }
  };

  if (isLoading || localLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {folders.length === 0 && files.length === 0 
            ? 'No files or folders' 
            : `${folders.length} folder${folders.length !== 1 ? 's' : ''}, ${files.length} file${files.length !== 1 ? 's' : ''}`}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<CreateNewFolderIcon />}
          onClick={() => setNewFolderOpen(true)}
        >
          New Folder
        </Button>
      </Box>

      {/* Folders grid */}
      {folders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Folders</Typography>
          <Grid container spacing={2}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                <FolderItem 
                  folder={folder}
                  onFolderClick={handleFolderClick}
                  onDeleteFolder={handleDeleteFolder}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Files grid */}
      {files.length > 0 ? (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Files</Typography>
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                <FileItem 
                  file={file}
                  onDeleteFile={handleDeleteFile}
                  onToggleVisibility={handleToggleFileVisibility}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        files.length === 0 && folders.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              This folder is empty
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Upload files or create folders to get started
            </Typography>
          </Paper>
        )
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
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
          <Button onClick={() => setNewFolderOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileExplorer;
