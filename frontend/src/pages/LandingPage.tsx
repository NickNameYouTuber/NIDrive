import React from 'react';
import { Box, Button, Container, Grid, Typography, Paper, Stack, useMediaQuery, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';
import IconButton from '@mui/material/IconButton';
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import TelegramIcon from '@mui/icons-material/Telegram';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';

const LandingPage: React.FC = () => {
  const theme = useMuiTheme();
  const { toggleColorMode } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <CloudUploadIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Управление файлами',
      description: 'Загружайте, организуйте и делитесь файлами в один клик. Доступ откуда угодно.',
    },
    {
      icon: <SecurityIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Безопасное хранение',
      description: 'Ваши файлы зашифрованы. Контролируйте настройки доступа к каждому файлу.',
    },
    {
      icon: <TelegramIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Telegram авторизация',
      description: 'Войдите через Telegram без создания дополнительных аккаунтов.',
    },
    {
      icon: <SpeedIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Быстрый доступ',
      description: 'Мгновенный поиск и доступ к вашим файлам. Скачивание на высокой скорости.',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header - более стильный и современный */}
      <Box
        component="header"
        sx={{
          p: isMobile ? 2 : 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.9)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            '& svg': {
              mr: 1,
              fontSize: '1.8rem'
            }
          }}
        >
          <StorageIcon />
          NIDrive
        </Typography>
        <Box>
          <IconButton 
            onClick={toggleColorMode} 
            color="inherit" 
            sx={{ 
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'rotate(180deg)'
              }
            }}
          >
            <BrightnessMediumIcon />
          </IconButton>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            sx={{ 
              ml: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={<TelegramIcon />}
          >
            Войти
          </Button>
        </Box>
      </Box>

      {/* Hero section - современный и более привлекательный */}
      <Box
        sx={{
          position: 'relative',
          pt: isMobile ? 10 : 15,
          pb: isMobile ? 10 : 15,
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(170deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(170deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
      >
        {/* Декоративные элементы */}
        <Box sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,123,255,0.2) 0%, rgba(0,123,255,0) 70%)',
          zIndex: 0
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(25,135,84,0.2) 0%, rgba(25,135,84,0) 70%)',
          zIndex: 0
        }} />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
            sx={{ 
              fontWeight: 800,
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              marginBottom: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #4dabf5 0%, #2979ff 100%)'
                : 'linear-gradient(45deg, #0d47a1 30%, #2196f3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            NI Drive
            <Box component="span" sx={{ display: 'block', fontSize: isMobile ? '1.5rem' : '2rem', mt: 1 }}>
              Облачное хранилище файлов
            </Box>
          </Typography>
          
          <Typography 
            variant="h5" 
            align="center" 
            color="text.secondary" 
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              mb: 4,
              px: 2,
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              lineHeight: 1.6
            }}
          >
            Храните, отправляйте и управляйте файлами в едином защищенном месте.
            NIDrive предлагает простой доступ с авторизацией через Telegram.
          </Typography>
          
          <Stack
            sx={{ pt: 2, pb: 3 }}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={isMobile ? 2 : 3}
            justifyContent="center"
            alignItems="center"
          >
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="contained" 
              size="large"
              startIcon={<TelegramIcon />}
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 8px 20px rgba(41, 121, 255, 0.3)',
                background: 'linear-gradient(to right, #2979ff, #4dabf5)',
                '&:hover': {
                  boxShadow: '0 10px 25px rgba(41, 121, 255, 0.4)',
                  background: 'linear-gradient(to right, #2979ff, #2979ff)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Войти через Telegram
            </Button>
            <Button 
              component={RouterLink} 
              to="/storage" 
              variant="outlined" 
              size="large"
              sx={{ 
                py: 1.5, 
                px: 4, 
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1.1rem',
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Узнать больше
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features section - современный дизайн */}
      <Box 
        sx={{ 
          py: isMobile ? 8 : 12,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(180deg, #16213e 0%, #121212 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
          position: 'relative',
          overflow: 'hidden'
        }} 
        id="features"
      >
        <Box sx={{ 
          position: 'absolute', 
          width: '400px', 
          height: '400px', 
          borderRadius: '50%', 
          right: '-200px',
          top: '10%',
          background: 'linear-gradient(45deg, rgba(41, 121, 255, 0.03), rgba(41, 121, 255, 0.08))',
          zIndex: 0 
        }} />
        <Box sx={{ 
          position: 'absolute', 
          width: '300px', 
          height: '300px', 
          borderRadius: '50%', 
          left: '-150px',
          bottom: '5%',
          background: 'linear-gradient(45deg, rgba(25, 135, 84, 0.03), rgba(25, 135, 84, 0.05))',
          zIndex: 0 
        }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="h2" 
            align="center" 
            gutterBottom 
            sx={{ 
              mb: 2,
              fontWeight: 700,
              fontSize: isMobile ? '2rem' : '2.5rem',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #4dabf5 30%, #2979ff 90%)'
                : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Наши преимущества
          </Typography>
          
          <Typography 
            variant="h6" 
            align="center" 
            color="text.secondary" 
            sx={{ 
              mb: 8, 
              maxWidth: '700px', 
              mx: 'auto',
              px: 2,
              fontWeight: 400,
              lineHeight: 1.6 
            }}
          >
            NIDrive предлагает простой и безопасный способ хранения и управления файлами
          </Typography>
          
          <Grid container spacing={isMobile ? 3 : 4}>
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(30, 30, 30, 0.7)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 30px rgba(0, 0, 0, 0.12)'
                    },
                  }}
                  elevation={0}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        </Container>
      </Box>

      {/* CTA section - современный дизайн с призывом к действию */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 8,
        }}
      >
        <Container>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Typography variant="h4" gutterBottom>
                Ready to get started?
              </Typography>
              <Typography variant="body1" paragraph>
                Sign in with your Telegram account to start using NIDrive now. 
                Store up to 1GB of files for free and manage them easily.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 3, md: 0 } }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.grey[100],
                  }
                }}
                startIcon={<TelegramIcon />}
              >
                Sign in with Telegram
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.95)' 
            : 'rgba(245, 245, 245, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'}`,
          py: 4,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'flex-start',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 2 : 0 }}>
              <StorageIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                NIDrive
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 3,
              alignItems: 'center'
            }}>
              <RouterLink to="/about" style={{ 
                textDecoration: 'none', 
                color: theme.palette.text.secondary 
              }}>
                О проекте
              </RouterLink>
              <RouterLink to="/terms" style={{ 
                textDecoration: 'none', 
                color: theme.palette.text.secondary 
              }}>
                Условия использования
              </RouterLink>
              <RouterLink to="/privacy" style={{ 
                textDecoration: 'none', 
                color: theme.palette.text.secondary 
              }}>
                Конфиденциальность
              </RouterLink>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2, opacity: 0.3 }} />
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ opacity: 0.8 }}>
            {'\u00A9 '}
            {new Date().getFullYear()}
            {' NICorp. Все права защищены.'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
