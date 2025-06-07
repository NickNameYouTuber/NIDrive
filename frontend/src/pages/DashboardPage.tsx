import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, LinearProgress, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import StorageIcon from '@mui/icons-material/Storage';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

interface UserStats {
  total_files: number;
  total_folders: number;
  used_space: number; // in MB
  quota: number; // in MB
  usage_percent: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await authService.getUserStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatStorage = (size: number) => {
    if (size < 1) {
      return `${Math.round(size * 1024)} KB`;
    } else if (size < 1024) {
      return `${Math.round(size * 10) / 10} MB`;
    } else {
      return `${Math.round(size / 102.4) / 10} GB`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Stats dashboard items
  const dashboardItems = [
    {
      title: 'Storage Used',
      icon: <StorageIcon fontSize="large" color="primary" />,
      value: stats ? formatStorage(stats.used_space) : '0 MB',
      secondaryText: stats ? `of ${formatStorage(stats.quota)}` : 'of 0 MB',
      progress: stats ? stats.usage_percent : 0
    },
    {
      title: 'Files',
      icon: <InsertDriveFileIcon fontSize="large" color="primary" />,
      value: stats?.total_files || 0,
      secondaryText: 'total files'
    },
    {
      title: 'Folders',
      icon: <FolderIcon fontSize="large" color="primary" />,
      value: stats?.total_folders || 0,
      secondaryText: 'total folders'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome{user?.first_name ? `, ${user.first_name}` : ''}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's an overview of your NIDrive cloud storage
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 180,
                borderRadius: 2,
              }}
              elevation={2}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {item.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {item.title}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.secondaryText}
                </Typography>
                {item.progress !== undefined && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.progress} 
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        backgroundColor: theme => theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: item.progress > 90 ? 'error.main' : 
                                        item.progress > 70 ? 'warning.main' : 
                                        'success.main',
                        }
                      }}
                    />
                    <Typography variant="body2" color="textSecondary" align="right" sx={{ mt: 0.5 }}>
                      {item.progress}% used
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => navigate('/storage')}
            >
              Upload Files
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => navigate('/storage')}
            >
              Browse Files
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
