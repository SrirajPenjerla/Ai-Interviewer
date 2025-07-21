import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Paper, Stack } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WorkIcon from '@mui/icons-material/Work';
import AssessmentIcon from '@mui/icons-material/Assessment';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Upload', href: '/upload' },
  { label: 'Interview', href: '/interview' },
  { label: 'Report', href: '/report' },
];

const IndexPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      {/* Background Gradient */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #fff 100%)',
        zIndex: -1,
      }} />
      {/* Navbar */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.92)', boxShadow: 0 }}>
        <Toolbar sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, px: { xs: 1, sm: 2 } }}>
          <SmartToyIcon color="primary" sx={{ fontSize: 36, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }} />
          <Typography variant="h5" fontWeight={700} color="primary" sx={{ flexGrow: 1, fontSize: { xs: 22, sm: 28 } }}>
            AI Interviewer
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {NAV_LINKS.map(link => (
              <Button
                key={link.href}
                component="a"
                href={link.href}
                color="primary"
                sx={{ fontWeight: 600, width: { xs: '100%', sm: 'auto' }, minHeight: 44, fontSize: { xs: 16, sm: 18 } }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>
      {/* Hero Section */}
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Paper elevation={6} sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.97)', width: '100%' }}>
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontSize: { xs: 32, md: 56 }, letterSpacing: 1 }}>
            Welcome to Your AI Interviewer
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontSize: { xs: 16, md: 24 } }}>
            Simulate real interviews, get instant feedback, and receive a professional report. Start your journey now!
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mt: 4 }}>
            <Button
              component="a"
              href="/upload"
              size="large"
              variant="contained"
              color="primary"
              startIcon={<WorkIcon />}
              sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' }, minHeight: 52, fontSize: { xs: 18, md: 20 } }}
            >
              Start Interview
            </Button>
            <Button
              component="a"
              href="/interview"
              size="large"
              variant="outlined"
              color="primary"
              startIcon={<SmartToyIcon />}
              sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' }, minHeight: 52, fontSize: { xs: 18, md: 20 } }}
            >
              Demo Chat
            </Button>
            <Button
              component="a"
              href="/report"
              size="large"
              variant="text"
              color="secondary"
              startIcon={<AssessmentIcon />}
              sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' }, minHeight: 52, fontSize: { xs: 18, md: 20 } }}
            >
              View Report
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default IndexPage;
