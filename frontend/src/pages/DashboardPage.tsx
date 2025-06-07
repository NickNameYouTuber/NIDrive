import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, LinearProgress, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import StorageIcon from '@mui/icons-material/Storage';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import RecentFiles from '../components/dashboard/RecentFiles';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Добро пожаловать, {user?.username || 'User'}!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Вот обзор вашего хранилища NIDrive.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }} elevation={3}>
            <InsertDriveFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">Файлов</Typography>
            <Typography variant="h4">{stats?.total_files || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }} elevation={3}>
            <FolderIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6">Папок</Typography>
            <Typography variant="h4">{stats?.total_folders || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }} elevation={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StorageIcon sx={{ fontSize: 48, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">Использовано пространства</Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatStorage(stats?.used_space || 0)} из {formatStorage(stats?.quota || 0)}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats?.usage_percent || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => navigate('/upload')}
        >
          Загрузить файл
        </Button>
        <Button
          variant="outlined"
          startIcon={<FolderIcon />}
          onClick={() => navigate('/create-folder')}
        >
          Создать папку
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/storage')}
        >
          Перейти к хранилищу
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Recent Files Section */}
      <RecentFiles />
    </Box>
  );
};

export default DashboardPage;
