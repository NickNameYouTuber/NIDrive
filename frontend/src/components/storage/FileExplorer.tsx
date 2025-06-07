import React, { useState, useEffect, useMemo } from 'react';
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
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider,
  InputAdornment,
  IconButton,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
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
  
  // View options
  type ViewMode = 'compact' | 'comfortable' | 'large' | 'list';
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable');
  
  // New folder dialog
  const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Filter options
  type FileType = 'image' | 'document' | 'video' | 'audio' | 'other' | 'all';
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(false);
  const [showPrivateOnly, setShowPrivateOnly] = useState<boolean>(false);
  
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

  // Determine file type based on MIME type
  const getFileType = (mimeType: string): FileType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.startsWith('text/') || 
      mimeType === 'application/pdf' || 
      mimeType.includes('document') || 
      mimeType.includes('spreadsheet') || 
      mimeType.includes('presentation')
    ) return 'document';
    return 'other';
  };

  // Filter and sort logic
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleSortClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortChange = (sortType: 'name' | 'date' | 'size', direction: 'asc' | 'desc') => {
    setSortBy(sortType);
    setSortDirection(direction);
    handleSortClose();
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Apply filters and sorting to the files
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Apply search filter
      const matchesSearch = searchQuery === '' || 
        file.filename.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply file type filter
      const matchesFileType = fileTypeFilter === 'all' || 
        getFileType(file.mime_type) === fileTypeFilter;
      
      // Apply visibility filter
      const matchesVisibility = 
        (!showPublicOnly && !showPrivateOnly) || // No filter
        (showPublicOnly && file.is_public) || 
        (showPrivateOnly && !file.is_public);
      
      return matchesSearch && matchesFileType && matchesVisibility;
    }).sort((a, b) => {
      // Apply sorting
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename);
      } else if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else { // size
        return sortDirection === 'asc'
          ? a.size_mb - b.size_mb
          : b.size_mb - a.size_mb;
      }
    });
  }, [files, searchQuery, fileTypeFilter, showPublicOnly, showPrivateOnly, sortBy, sortDirection]);

  // We don't filter folders, just sort them
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else { // date
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [folders, sortBy, sortDirection]);

  if (isLoading || localLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Navigation path and search/filter controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexGrow: 1 }}>
          {/* Navigation path (moved from below) */}
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Storage
          </Typography>
          <Button
            variant="text"
            onClick={() => navigate('/storage')}
            sx={{ textTransform: 'none' }}
          >
            Root
          </Button>
          {currentFolderId !== null && (
            <Typography variant="body1" sx={{ mx: 1 }}>
              {/* Here would go breadcrumbs if we implement a path */}
              {/* For now just showing Root ---- */}
              ----
            </Typography>
          )}
        </Box>

        {/* Search component */}
        <FormControl sx={{ minWidth: 200, maxWidth: 300, flexGrow: 1 }}>
          <OutlinedInput
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
            endAdornment={
              searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={clearSearch}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          />
        </FormControl>

        {/* Filters and sort buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Sort files">
            <IconButton onClick={handleSortClick}>
              <SortIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter files">
            <IconButton onClick={handleFilterClick}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          
          {/* View mode toggle */}
          <Tooltip title="Switch view mode">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="list" aria-label="list view">
                <Tooltip title="List view">
                  <ViewListIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="compact" aria-label="compact grid">
                <Tooltip title="Compact grid">
                  <ViewComfyIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="comfortable" aria-label="comfortable grid">
                <Tooltip title="Comfortable grid">
                  <ViewModuleIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="large" aria-label="large grid">
                <Tooltip title="Large grid">
                  <GridViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Action buttons bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {/* Stats about files and folders */}
        <Typography variant="body2" color="text.secondary">
          {folders.length === 0 && filteredFiles.length === 0 
            ? 'No files or folders' 
            : `${sortedFolders.length} folder${sortedFolders.length !== 1 ? 's' : ''}, ${filteredFiles.length} file${filteredFiles.length !== 1 ? 's' : ''}`}
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<CreateNewFolderIcon />}
          onClick={() => setNewFolderOpen(true)}
          size="small"
        >
          New Folder
        </Button>
      </Box>

      {/* Filter and Sort Menus */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterClose}
        sx={{ mt: 1 }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>File Type</Typography>
          <FormControl size="small" fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value as FileType)}
              label="Type"
              size="small"
            >
              <MenuItem value="all">All Files</MenuItem>
              <MenuItem value="image">Images</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Visibility</Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showPublicOnly}
                  onChange={(e) => {
                    setShowPublicOnly(e.target.checked);
                    if (e.target.checked) setShowPrivateOnly(false);
                  }}
                  size="small"
                  icon={<VisibilityOffIcon fontSize="small" />}
                  checkedIcon={<VisibilityIcon fontSize="small" />}
                />
              }
              label="Show Public Only"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showPrivateOnly}
                  onChange={(e) => {
                    setShowPrivateOnly(e.target.checked);
                    if (e.target.checked) setShowPublicOnly(false);
                  }}
                  size="small"
                  icon={<VisibilityIcon fontSize="small" />}
                  checkedIcon={<VisibilityOffIcon fontSize="small" />}
                />
              }
              label="Show Private Only"
            />
          </FormGroup>
        </Box>
      </Menu>

      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={() => handleSortChange('name', 'asc')}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Name (A-Z)
            {sortBy === 'name' && sortDirection === 'asc' && (
              <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>✓</Box>
            )}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('name', 'desc')}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Name (Z-A)
            {sortBy === 'name' && sortDirection === 'desc' && (
              <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>✓</Box>
            )}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortChange('date', 'desc')}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Newest First
            {sortBy === 'date' && sortDirection === 'desc' && (
              <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>✓</Box>
            )}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('date', 'asc')}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Oldest First
            {sortBy === 'date' && sortDirection === 'asc' && (
              <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>✓</Box>
            )}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortChange('size', 'desc')}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Largest First
            {sortBy === 'size' && sortDirection === 'desc' && (
              <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>✓</Box>
            )}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('size', 'asc')}>
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            Smallest First
            {sortBy === 'size' && sortDirection === 'asc' && (
              <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>✓</Box>
            )}
          </Box>
        </MenuItem>
      </Menu>

      {/* Folders grid */}
      {sortedFolders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Folders</Typography>
          <Grid container spacing={2}>
            {sortedFolders.map((folder) => (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'list' ? 12 : viewMode === 'compact' ? 3 : viewMode === 'large' ? 6 : 4} 
                md={viewMode === 'list' ? 12 : viewMode === 'compact' ? 2 : viewMode === 'large' ? 4 : 3} 
                lg={viewMode === 'list' ? 12 : viewMode === 'compact' ? 2 : viewMode === 'large' ? 3 : 2.4}
                key={folder.id}
              >
                <FolderItem 
                  folder={folder}
                  onFolderClick={handleFolderClick}
                  onDeleteFolder={handleDeleteFolder}
                  viewMode={viewMode}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Files grid */}
      {filteredFiles.length > 0 ? (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Files</Typography>
          <Grid container spacing={2}>
            {filteredFiles.map((file) => (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'list' ? 12 : viewMode === 'compact' ? 3 : viewMode === 'large' ? 6 : 4} 
                md={viewMode === 'list' ? 12 : viewMode === 'compact' ? 2 : viewMode === 'large' ? 4 : 3} 
                lg={viewMode === 'list' ? 12 : viewMode === 'compact' ? 2 : viewMode === 'large' ? 3 : 2.4}
                key={file.id}
              >
                <FileItem 
                  file={file} 
                  onDeleteFile={handleDeleteFile}
                  onToggleVisibility={handleToggleFileVisibility}
                  viewMode={viewMode}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        filteredFiles.length === 0 && sortedFolders.length === 0 && (
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
