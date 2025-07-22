import React, { useState } from 'react';
import { Box, Button, Container, Typography, TextField, Paper, Divider, Chip, CircularProgress, Stack } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';
import { uploadResume, startInterview } from '../utils/api';
import { useRouter } from 'next/router';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const router = useRouter();

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !linkedin) {
      setError('Please upload a resume or provide a LinkedIn URL.');
      return;
    }
    setLoading(true);
    try {
      const result = await uploadResume(file || undefined, linkedin || undefined, name || undefined, email || undefined);
      setParsed(result);
      setSkills(result.skills || []);
      setCandidateId(result.candidate_id);
      console.log(result);
      setError('');
    } catch (err) {
      setError('Failed to parse resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!candidateId) return;
    setLoading(true);
    try {
      const res = await startInterview(candidateId, 'Software Engineer');
      router.push({ pathname: '/interview', query: { interview: res.interview_id, question: res.question } });
    } catch (err) {
      setError('Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 6, md: 10 }, mb: { xs: 6, md: 10 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, width: '100%', maxWidth: 480, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: 22, md: 32 }, mb: 2 }}>
          Upload Resume or LinkedIn
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleSubmit}>
          <Stack spacing={2} alignItems="center" width="100%">
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={e => setName(e.target.value)}
              inputProps={{ 'aria-label': 'Name' }}
            />
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
              inputProps={{ 'aria-label': 'Email' }}
            />
            <Box {...getRootProps()}
              sx={{
                border: '2px dashed #1976d2',
                borderRadius: 2,
                py: 4,
                px: 2,
                textAlign: 'center',
                bgcolor: isDragActive ? '#e3f2fd' : 'inherit',
                cursor: 'pointer',
                width: '100%',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                my: 0,
              }}
              tabIndex={0}
              aria-label="Resume Dropzone"
            >
              <input {...getInputProps()} />
              <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 500 }}>
                {file ? file.name : 'Drag & drop PDF resume here, or click to select'}
              </Typography>
            </Box>
            <Typography align="center" sx={{ fontSize: { xs: 14, md: 16 } }}>or</Typography>
            <TextField
              label="LinkedIn URL"
              fullWidth
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              inputProps={{ 'aria-label': 'LinkedIn URL' }}
            />
            {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ py: 1.5, fontSize: { xs: 16, md: 18 }, mt: 1 }}
              aria-label="Parse Resume"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Parse Resume'}
            </Button>
          </Stack>
        </form>
        {skills.length > 0 && (
          <Paper elevation={2} sx={{ mt: 5, p: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Extracted Skills</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
              {skills.map(skill => (
                <Chip key={skill} label={skill} color="primary" />
              ))}
            </Box>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2, fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
              onClick={handleStartInterview}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Start Interview'}
            </Button>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default UploadPage; 