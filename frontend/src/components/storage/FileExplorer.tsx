import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  ButtonGroup,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
  FormGroup,
  Checkbox,
  OutlinedInput,
  Select,
  InputLabel,
  Chip,
  SelectChangeEvent,
  useMediaQuery,
  Theme
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import { useSnackbar } from 'notistack';

interface FileExplorerProps {
  currentFolderId: number | null;
  isLoading: boolean;
  updateTrigger?: number; // Триггер для обновления списка файлов
  onUploadClick?: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ currentFolderId = null, isLoading: parentLoading = false, updateTrigger = 0, onUploadClick }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Media queries for responsive design
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery((theme: Theme) => theme.breakpoints.between('sm', 'md'));
  
  // State variables
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<any[]>([]);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'comfortable' : 'list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  
  // View options
  type ViewMode = 'compact' | 'comfortable' | 'large' | 'list';
  
  // Search and filtering
  type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(false);
  const [showPrivateOnly, setShowPrivateOnly] = useState<boolean>(false);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState<null | HTMLElement>(null);
  
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
        const validFoldersData = Array.isArray(foldersData) ? foldersData : [];
        setFolders(validFoldersData);
        setFilteredFolders(validFoldersData);
        
        // Fetch files
        const filesData = await fileService.getFiles(currentFolderId);
        const validFilesData = Array.isArray(filesData) ? filesData : [];
        setFiles(validFilesData);
        setFilteredFiles(validFilesData);
      } catch (error) {
        console.error('Error fetching files/folders:', error);
        enqueueSnackbar('Failed to load files or folders', { variant: 'error' });
      } finally {
        setLocalLoading(false);
      }
    };
    
    if (!parentLoading) {
      fetchData();
    }
  }, [currentFolderId, parentLoading, updateTrigger, enqueueSnackbar]);
  
  // Apply search and filters
  useEffect(() => {
    // Filtering files
    let newFilteredFiles = [...files];
    
    // Search by name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      newFilteredFiles = newFilteredFiles.filter(file => 
        file.filename.toLowerCase().includes(query)
      );
    }
    
    // Filter by file type
    if (fileTypes.length > 0) {
      newFilteredFiles = newFilteredFiles.filter(file => {
        const mimeType = file.mime_type.toLowerCase();
        return fileTypes.some(type => {
          switch (type) {
            case 'image': return mimeType.startsWith('image/');
            case 'document': return mimeType === 'application/pdf' || 
                                  mimeType.startsWith('text/') || 
                                  mimeType.includes('document') || 
                                  mimeType.includes('sheet');
            case 'video': return mimeType.startsWith('video/');
            case 'audio': return mimeType.startsWith('audio/');
            case 'other': return !mimeType.startsWith('image/') && 
                                 !mimeType.startsWith('video/') && 
                                 !mimeType.startsWith('audio/') && 
                                 !mimeType.includes('document') && 
                                 !mimeType.includes('sheet') && 
                                 mimeType !== 'application/pdf';
            default: return false;
          }
        });
      });
    }
    
    // Filter by visibility
    if (showPublicOnly && !showPrivateOnly) {
      newFilteredFiles = newFilteredFiles.filter(file => file.is_public);
    } else if (!showPublicOnly && showPrivateOnly) {
      newFilteredFiles = newFilteredFiles.filter(file => !file.is_public);
    }
    
    // Sort files
    newFilteredFiles.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.filename.localeCompare(b.filename);
        case 'name-desc':
          return b.filename.localeCompare(a.filename);
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'size-asc':
          return a.size_mb - b.size_mb;
        case 'size-desc':
          return b.size_mb - a.size_mb;
        default:
          return 0;
      }
    });
    
    setFilteredFiles(newFilteredFiles);
    
    // Filtering folders (only by name)
    let newFilteredFolders = [...folders];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      newFilteredFolders = newFilteredFolders.filter(folder => 
        folder.name.toLowerCase().includes(query)
      );
    }
    
    // Sort folders
    newFilteredFolders.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredFolders(newFilteredFolders);
  }, [files, folders, searchQuery, fileTypes, sortOption, showPublicOnly, showPrivateOnly]);
  
  // Handle filter menu
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };
  
  const handleFileTypeChange = (event: SelectChangeEvent<FileType[]>) => {
    const value = event.target.value as FileType[];
    setFileTypes(value);
  };
  
  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortOption(event.target.value as SortOption);
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setFileTypes([]);
    setSortOption('name-asc');
    setShowPublicOnly(false);
    setShowPrivateOnly(false);
  };
  
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
      {/* Header with actions - responsive layout */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 2, 
        gap: 2 
      }}>
        <Typography variant="h6">
          {(!filteredFolders || filteredFolders.length === 0) && (!filteredFiles || filteredFiles.length === 0) 
            ? 'No files or folders' 
            : `${filteredFolders?.length || 0} folder${(!filteredFolders || filteredFolders.length !== 1) ? 's' : ''}, ${filteredFiles?.length || 0} file${(!filteredFiles || filteredFiles.length !== 1) ? 's' : ''}`}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2, 
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' }
        }}>
          {/* View mode toggle - hidden on very small screens */}
          <Tooltip title="Switch view mode">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              aria-label="view mode"
              size={isMobile ? "small" : "medium"}
              sx={{ 
                display: { xs: 'none', sm: 'flex' }
              }}
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
          
          {/* Buttons - full width on mobile */}
          <ButtonGroup 
            variant="contained"
            orientation={isMobile ? "vertical" : "horizontal"}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              '& .MuiButton-root': {
                width: { xs: '100%', sm: 'auto' }
              }
            }}
          >
            <Button 
              startIcon={<CloudUploadIcon />}
              onClick={onUploadClick}
              color="primary"
              fullWidth={isMobile}
              size={isMobile ? "medium" : "medium"}
            >
              Upload Files
            </Button>
            <Button 
              startIcon={<CreateNewFolderIcon />}
              onClick={() => setNewFolderOpen(true)}
              color="secondary"
              fullWidth={isMobile}
              size={isMobile ? "medium" : "medium"}
            >
              New Folder
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Search and Filters UI - responsive layout */}
      <Box sx={{
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        flexWrap: 'wrap', 
        gap: 2, 
        alignItems: { xs: 'stretch', md: 'center' },
        mb: 3
      }}>
        <TextField
          placeholder="Search files and folders"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            flexGrow: 1, 
            minWidth: { xs: '100%', sm: 200 },
            width: { xs: '100%', md: 'auto' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          size="small"
          fullWidth={isMobile}
        />

        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 150 },
            width: { xs: '100%', md: 'auto' }
          }} 
          size="small"
        >
          <InputLabel id="sort-select-label">Sort By</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortOption}
            onChange={handleSortChange}
            label="Sort By"
            startAdornment={<SortIcon sx={{ mr: 1 }} />}
            fullWidth={isMobile}
          >
            <MenuItem value="name-asc">Name (A-Z)</MenuItem>
            <MenuItem value="name-desc">Name (Z-A)</MenuItem>
            <MenuItem value="date-asc">Date (Oldest)</MenuItem>
            <MenuItem value="date-desc">Date (Newest)</MenuItem>
            <MenuItem value="size-asc">Size (Smallest)</MenuItem>
            <MenuItem value="size-desc">Size (Largest)</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterMenuOpen}
            size="small"
          >
            Filters
            {(fileTypes.length > 0 || showPublicOnly || showPrivateOnly) && 
              <Chip 
                size="small" 
                label={fileTypes.length + (showPublicOnly || showPrivateOnly ? 1 : 0)} 
                sx={{ ml: 1 }} 
              />}
          </Button>
          <Menu
            anchorEl={filterMenuAnchorEl}
            open={Boolean(filterMenuAnchorEl)}
            onClose={handleFilterMenuClose}
            sx={{ mt: 1, '& .MuiPaper-root': { width: 280, p: 1 } }}
          >
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>File Types</Typography>
              <FormControl sx={{ width: '100%', mb: 2 }} size="small">
                <InputLabel id="file-type-label">Filter by type</InputLabel>
                <Select
                  labelId="file-type-label"
                  multiple
                  value={fileTypes}
                  onChange={handleFileTypeChange}
                  input={<OutlinedInput label="Filter by type" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as FileType[]).map((type) => (
                        <Chip key={type} label={type} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="image">Images</MenuItem>
                  <MenuItem value="document">Documents</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Visibility</Typography>
              <FormGroup>
                <FormControlLabel 
                  control={<Checkbox 
                    checked={showPublicOnly} 
                    onChange={(e) => {
                      setShowPublicOnly(e.target.checked);
                      if (e.target.checked) setShowPrivateOnly(false);
                    }} 
                    size="small"
                    icon={<VisibilityOffIcon fontSize="small" />}
                    checkedIcon={<VisibilityIcon fontSize="small" />}
                  />} 
                  label="Public only" 
                />
                <FormControlLabel 
                  control={<Checkbox 
                    checked={showPrivateOnly} 
                    onChange={(e) => {
                      setShowPrivateOnly(e.target.checked);
                      if (e.target.checked) setShowPublicOnly(false);
                    }} 
                    size="small"
                    icon={<VisibilityIcon fontSize="small" />}
                    checkedIcon={<VisibilityOffIcon fontSize="small" />}
                  />} 
                  label="Private only" 
                />
              </FormGroup>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear All
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={handleFilterMenuClose}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Menu>
        </Box>
      </Box>

      {/* Files and folders grid - responsive layout */}
      {filteredFolders.length > 0 || filteredFiles.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          {/* Folders section */}
          {filteredFolders && filteredFolders.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>Folders</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {filteredFolders.map((folder) => {
                  // Адаптивные размеры ячеек для разных устройств и режимов отображения
                  return (
                    <Grid 
                      item 
                      xs={12} 
                      sm={viewMode === 'list' ? 12 : 6} 
                      md={viewMode === 'list' ? 12 : viewMode === 'compact' ? 4 : viewMode === 'comfortable' ? 6 : 6}
                      lg={viewMode === 'list' ? 12 : viewMode === 'compact' ? 3 : viewMode === 'comfortable' ? 4 : 6}
                      key={folder.id}
                    >
                      <FolderItem 
                        folder={folder}
                        onFolderClick={handleFolderClick}
                        onDeleteFolder={handleDeleteFolder}
                        viewMode={isMobile ? 'comfortable' : viewMode} // На мобильных принудительно комфортный режим
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
          
          {/* Files section */}
          {filteredFiles && filteredFiles.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>Files</Typography>
              <Grid container spacing={2}>
                {filteredFiles.map((file) => {
                  // Адаптивные размеры ячеек для разных устройств и режимов отображения
                  return (
                    <Grid 
                      item 
                      xs={12} 
                      sm={viewMode === 'list' ? 12 : 6} 
                      md={viewMode === 'list' ? 12 : viewMode === 'compact' ? 4 : viewMode === 'comfortable' ? 6 : 6}
                      lg={viewMode === 'list' ? 12 : viewMode === 'compact' ? 3 : viewMode === 'comfortable' ? 4 : 6}
                      key={file.id}
                    >
                      <FileItem 
                        file={file}
                        onDeleteFile={handleDeleteFile}
                        onToggleVisibility={handleToggleFileVisibility}
                        viewMode={isMobile ? 'comfortable' : viewMode} // На мобильных принудительно комфортный режим
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            This folder is empty
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Upload files or create folders to get started
          </Typography>
        </Paper>
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
