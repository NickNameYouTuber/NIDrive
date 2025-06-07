import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileUploader from './FileUploader';

interface FileUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: number | null;
  onFileUploaded: () => void;
}

const FileUploaderModal: React.FC<FileUploaderModalProps> = ({ 
  isOpen, 
  onClose, 
  currentFolderId, 
  onFileUploaded 
}) => {
  // При успешной загрузке файла вызываем callbacks
  const handleFileUploaded = () => {
    // Уведомляем родительский компонент что файл был загружен
    onFileUploaded();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="upload-files-dialog-title"
    >
      <DialogTitle id="upload-files-dialog-title" sx={{ m: 0, p: 2 }}>
        Upload Files
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ width: '100%' }}>
          <FileUploader 
            currentFolderId={currentFolderId}
            onFileUploaded={handleFileUploaded}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploaderModal;
