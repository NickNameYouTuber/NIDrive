import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Breadcrumbs, Link, Divider } from '@mui/material';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import FileExplorer from '../components/storage/FileExplorer';
import FileUploader from '../components/storage/FileUploader';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import ViewToggle from '../components/storage/ViewToggle';
import SearchBar from '../components/storage/SearchBar';

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
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Root' }]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filesUpdateTrigger, setFilesUpdateTrigger] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'large'>('grid');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
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
    const breadcrumbItems: BreadcrumbItem[] = [{ id: null, name: 'Root' }];

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

  const handleBreadcrumbClick = (id: number | null) => {
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Storage
        </Typography>
      </Box>

      {/* Breadcrumb Navigation */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 1 }} elevation={1}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="folder navigation breadcrumb"
        >
          {breadcrumbs.map((breadcrumb, index) => (
            <Link
              key={index}
              underline="hover"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                color: index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'
              }}
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
              onClick={() => handleBreadcrumbClick(breadcrumb.id)}
            >
              {breadcrumb.id === null && <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />}
              {breadcrumb.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <FileUploader currentFolderId={currentFolderId} onFileUploaded={refreshFiles} />
        </Box>
        
        <Box>
          <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <SearchBar onSearch={handleSearch} />
      </Box>

      <FileExplorer 
        currentFolderId={currentFolderId} 
        isLoading={isLoading}
        updateTrigger={filesUpdateTrigger}
        setUpdateTrigger={setFilesUpdateTrigger}
        viewMode={viewMode}
        files={isSearching ? searchResults : undefined}
      />
    </Box>
  );
};

export default StoragePage;
