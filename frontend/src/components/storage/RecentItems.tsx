import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  CircularProgress,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

interface RecentFile {
  id: number;
  filename: string;
  mime_type: string;
  size_mb: number;
  created_at: string;
  is_public: boolean;
  folder_id: number | null;
  preview_url?: string;
  download_url?: string;
}

interface RecentFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

interface RecentItemsProps {
  recentFiles: RecentFile[];
  recentFolders: RecentFolder[];
  onFileClick: (file: RecentFile) => void;
  onFolderClick: (folderId: number | null) => void;
  onViewAllClick: () => void;
  isLoading?: boolean;
}

const RecentItems: React.FC<RecentItemsProps> = ({
  recentFiles,
  recentFolders,
  onFileClick,
  onFolderClick,
  onViewAllClick,
  isLoading = false,
}) => {
  // Сортировка всех элементов по дате создания
  const allItems = [
    ...recentFiles.map(file => ({ 
      ...file, 
      type: 'file',
      date: new Date(file.created_at)
    })),
    ...recentFolders.map(folder => ({ 
      ...folder, 
      type: 'folder',
      date: new Date(folder.created_at)
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
   .slice(0, 6); // Ограничиваем количество до 6

  // Получение иконки файла по MIME-типу
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon fontSize="large" color="primary" />;
    } else if (mimeType === 'application/pdf') {
      return <PictureAsPdfIcon fontSize="large" color="error" />;
    } else if (mimeType.startsWith('video/')) {
      return <VideoFileIcon fontSize="large" color="secondary" />;
    } else if (mimeType.startsWith('audio/')) {
      return <AudioFileIcon fontSize="large" color="success" />;
    } else {
      return <InsertDriveFileIcon fontSize="large" color="action" />;
    }
  };

  // Функция форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }} elevation={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Недавние элементы
        </Typography>
        <Tooltip title="Показать все">
          <IconButton onClick={onViewAllClick} size="small">
            <KeyboardArrowRightIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : allItems.length === 0 ? (
        <Box sx={{ py: 3 }}>
          <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
            No recent items found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {allItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={`${item.type}-${item.id}`}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 3,
                  }
                }}
                onClick={() => item.type === 'file' 
                  ? onFileClick(item as unknown as RecentFile)
                  : onFolderClick((item as unknown as RecentFolder).id)
                }
              >
                <CardActionArea sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', p: 2 }}>
                  {item.type === 'file' ? (
                    (item as unknown as RecentFile).mime_type.startsWith('image/') && (item as unknown as RecentFile).preview_url ? (
                      <CardMedia
                        component="img"
                        height="100"
                        image={(item as unknown as RecentFile).preview_url}
                        alt={(item as unknown as RecentFile).filename}
                        sx={{ objectFit: 'contain', mb: 1 }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        {getFileIcon((item as unknown as RecentFile).mime_type)}
                      </Box>
                    )
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <FolderIcon fontSize="large" color="primary" />
                    </Box>
                  )}
                  <CardContent sx={{ p: 1, pt: 0, width: '100%' }}>
                    <Typography 
                      variant="body2" 
                      component="div" 
                      noWrap 
                      sx={{ 
                        textAlign: 'center',
                        fontWeight: 'medium',
                        mb: 0.5
                      }}
                    >
                      {item.type === 'file' 
                        ? (item as unknown as RecentFile).filename
                        : (item as unknown as RecentFolder).name
                      }
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block',
                        textAlign: 'center'
                      }}
                    >
                      {formatDate(item.date.toISOString())}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default RecentItems;
