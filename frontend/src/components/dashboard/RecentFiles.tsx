import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  CircularProgress, 
  Tooltip,
  Card,
  CardHeader,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GetAppIcon from '@mui/icons-material/GetApp';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';

interface RecentItemFile {
  id: number;
  filename: string;
  mime_type: string;
  folder_id: number | null;
  created_at: string;
  type: 'file';
}

interface RecentItemFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  type: 'folder';
}

type RecentItem = RecentItemFile | RecentItemFolder;

const RecentFiles: React.FC = () => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        setLoading(true);
        // Get recent files
        const recentFiles = await fileService.getRecentFiles();
        const formattedFiles: RecentItemFile[] = recentFiles.map(file => ({
          ...file,
          type: 'file'
        }));

        // Get recent folders
        const recentFolders = await folderService.getRecentFolders();
        const formattedFolders: RecentItemFolder[] = recentFolders.map(folder => ({
          ...folder,
          type: 'folder'
        }));

        // Combine and sort by date
        const allItems = [...formattedFiles, ...formattedFolders]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5); // Get only the top 5

        setRecentItems(allItems);
      } catch (error) {
        console.error('Error fetching recent items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentItems();
  }, []);

  const handleFileClick = (item: RecentItem) => {
    if (item.type === 'file') {
      // Navigate to the file's folder
      if (item.folder_id) {
        navigate(`/storage/${item.folder_id}`);
      } else {
        navigate(`/storage`);
      }
    } else {
      // Navigate to the folder
      navigate(`/storage/${item.id}`);
    }
  };

  const handleFileDownload = async (fileId: number) => {
    try {
      await fileService.downloadFile(fileId);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon />;
    } else if (mimeType === 'application/pdf') {
      return <PictureAsPdfIcon />;
    } else if (mimeType.startsWith('video/')) {
      return <VideoFileIcon />;
    } else if (mimeType.startsWith('audio/')) {
      return <AudioFileIcon />;
    } else if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'text/plain'
    ) {
      return <DescriptionIcon />;
    } else {
      return <InsertDriveFileIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader title="Recent Files & Folders" />
      <Divider />
      {recentItems.length > 0 ? (
        <List>
          {recentItems.map((item) => (
            <ListItem 
              key={`${item.type}-${item.id}`} 
              button 
              onClick={() => handleFileClick(item)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon>
                {item.type === 'file' 
                  ? getFileIcon(item.mime_type) 
                  : <FolderIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={item.type === 'file' ? item.filename : item.name} 
                secondary={new Date(item.created_at).toLocaleDateString()}
              />
              <ListItemSecondaryAction>
                {item.type === 'file' && (
                  <Tooltip title="Download">
                    <IconButton
                      edge="end"
                      aria-label="download"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDownload(item.id);
                      }}
                    >
                      <GetAppIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Open location">
                  <IconButton
                    edge="end"
                    aria-label="open"
                    onClick={() => handleFileClick(item)}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No recent activity
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default RecentFiles;
