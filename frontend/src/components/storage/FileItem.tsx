import React from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { InsertDriveFile, GetApp, Delete, Visibility, VisibilityOff, MoreVert } from '@mui/icons-material';

interface FileItemProps {
  file: any;
  onDownload: (event: React.MouseEvent<HTMLElement> | null) => void;
  onDelete: (event: React.MouseEvent<HTMLElement> | null) => void;
  onToggleVisibility: (event: React.MouseEvent<HTMLElement> | null) => void;
  viewMode: 'grid' | 'list' | 'large';
}

export const FileItem: React.FC<FileItemProps> = ({ file, onDownload, onDelete, onToggleVisibility, viewMode }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getIconForMimeType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <InsertDriveFile sx={{ color: '#2196f3' }} />;
    } else if (mimeType.startsWith('video/')) {
      return <InsertDriveFile sx={{ color: '#f44336' }} />;
    } else if (mimeType === 'application/pdf') {
      return <InsertDriveFile sx={{ color: '#f44336' }} />;
    } else if (mimeType.startsWith('text/')) {
      return <InsertDriveFile sx={{ color: '#4caf50' }} />;
    } else {
      return <InsertDriveFile sx={{ color: '#9e9e9e' }} />;
    }
  };

  if (viewMode === 'list') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #e0e0e0' }}>
        {getIconForMimeType(file.mime_type)}
        <Box sx={{ ml: 2, flexGrow: 1 }}>
          <Typography variant="body1">{file.filename}</Typography>
          <Typography variant="caption" color="textSecondary">
            {file.mime_type} - {file.size_mb.toFixed(2)} MB
          </Typography>
        </Box>
        <IconButton size="small" onClick={onDownload} sx={{ mr: 1 }}>
          <GetApp fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onToggleVisibility} sx={{ mr: 1 }}>
          {file.is_public ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={onDelete}>
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': { backgroundColor: '#f5f5f5' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: viewMode === 'large' ? 200 : 150,
      }}
    >
      {getIconForMimeType(file.mime_type)}
      <Typography variant="body2" noWrap sx={{ mt: 1, maxWidth: '100%' }}>
        {file.filename}
      </Typography>
      <Typography variant="caption" color="textSecondary">
        {file.size_mb.toFixed(2)} MB
      </Typography>
      <IconButton
        size="small"
        sx={{ position: 'absolute', top: 5, right: 5 }}
        onClick={handleClick}
      >
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => { handleClose(); onDownload(null); }}>
          Download
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); onToggleVisibility(null); }}>
          {file.is_public ? 'Make Private' : 'Make Public'}
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); onDelete(null); }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FileItem;
