import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Breadcrumbs, Link, Divider, Button } from '@mui/material';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';
import FileExplorer from '../components/storage/FileExplorer';
import FileUploaderModal from '../components/storage/FileUploaderModal';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Storage
        </Typography>
      </Box>
      
      <Divider sx={{ my: 3 }} />

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
      
      {/* File Explorer */}
      <FileExplorer 
        currentFolderId={currentFolderId} 
        isLoading={isLoading}
        updateTrigger={filesUpdateTrigger}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />
      
      {/* File Uploader Modal */}
      <FileUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentFolderId={currentFolderId}
        onFileUploaded={refreshFiles}
      />
    </Box>
  );
};

export default StoragePage;
