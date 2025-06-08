import React, { useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  LinearProgress,
  IconButton, 
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useSnackbar } from 'notistack';
import { fileService } from '../../services/fileService';

interface FileUploaderProps {
  currentFolderId: number | null;
  onFileUploaded?: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ currentFolderId, onFileUploaded }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (acceptedFiles: File[]) => {
    // Create unique IDs for each file
    const newFiles = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending' as const
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleFileSelect(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);

    try {
      // Process files sequentially
      for (const fileObj of files) {
        if (fileObj.status !== 'pending') continue;
        
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading' } : f
        ));
        
        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setFiles(prev => prev.map(f => 
              f.id === fileObj.id ? { 
                ...f, 
                progress: Math.min(90, f.progress + 10) 
              } : f
            ));
          }, 200);
          
          // Upload file
          await fileService.uploadFile(
            fileObj.file,
            currentFolderId,
            false // Default to private
          );
          
          clearInterval(progressInterval);
          
          // Mark as completed
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress: 100, status: 'completed' } : f
          ));
          
          enqueueSnackbar(`Uploaded ${fileObj.file.name}`, { variant: 'success' });
          
          // Вызываем callback для обновления списка файлов в родительском компоненте
          if (onFileUploaded) {
            onFileUploaded();
          }
        } catch (error) {
          console.error(`Error uploading ${fileObj.file.name}:`, error);
          
          // Mark as error
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { 
              ...f, 
              status: 'error', 
              errorMessage: error instanceof Error ? error.message : 'Upload failed'
            } : f
          ));
          
          enqueueSnackbar(`Failed to upload ${fileObj.file.name}`, { variant: 'error' });
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload Files
      </Typography>
      
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onClick={handleClickUpload}
        sx={{
          border: '2px dashed',
          borderColor: theme => theme.palette.divider,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: theme => theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.16)',
          },
        }}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="body1">
          Drag and drop files here, or click to select files
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Max file size: 200 MB
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </Typography>
            <Box>
              <Button 
                onClick={clearCompleted} 
                disabled={!files.some(f => f.status === 'completed')}
                size="small"
                sx={{ mr: 1 }}
              >
                Clear Completed
              </Button>
              <Button 
                variant="contained" 
                onClick={handleUpload}
                disabled={isUploading || !files.some(f => f.status === 'pending')}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </Box>
          </Box>

          <List>
            {files.map(file => (
              <ListItem key={file.id} sx={{ py: 1, px: 0 }}>
                <ListItemText
                  primary={file.file.name}
                  secondary={`${(file.file.size / (1024 * 1024)).toFixed(2)} MB`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { 
                      fontWeight: 500,
                      color: file.status === 'error' ? 'error.main' : 'text.primary'
                    }
                  }}
                />
                
                <Box sx={{ width: '50%', mr: 2 }}>
                  {file.status === 'uploading' && (
                    <LinearProgress variant="determinate" value={file.progress} />
                  )}
                  {file.status === 'completed' && (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} /> Completed
                    </Typography>
                  )}
                  {file.status === 'error' && (
                    <Typography variant="body2" color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} /> {file.errorMessage || 'Error'}
                    </Typography>
                  )}
                </Box>
                
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    <CancelIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          
          {files.some(f => f.status === 'error') && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Some files failed to upload. Please try again.
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default FileUploader;
