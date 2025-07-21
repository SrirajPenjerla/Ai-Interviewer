import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material';

const ProctorPage = () => {
  const [room, setRoom] = useState('default');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleConnect = () => {
    setConnecting(true);
    setError(null);
    // Connect to signaling server
    const ws = new WebSocket(`ws://localhost:8000/ws/proctor?room=${room}`);
    wsRef.current = ws;
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    };

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
    };
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'offer' && data.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', answer }));
      }
      if (data.type === 'ice-candidate' && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
    ws.onerror = (err) => {
      setError('WebSocket error');
      setConnecting(false);
    };
    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
    };
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      pcRef.current?.close();
    };
  }, []);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Proctor/Observer View
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the room ID to connect and observe the candidate&apos;s video stream in real time.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
          <TextField
            label="Room ID"
            value={room}
            onChange={e => setRoom(e.target.value)}
            size="small"
            disabled={connected || connecting}
          />
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={connected || connecting}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: 320, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }} />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {connected ? 'Connected to room: ' + room : 'Not connected'}
        </Typography>
      </Paper>
    </Container>
  );
};

export default ProctorPage; 