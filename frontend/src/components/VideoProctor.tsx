import React, { useEffect, useRef, useState } from 'react';

interface VideoProctorProps {
  signalingUrl: string;
}

const VideoProctor: React.FC<VideoProctorProps> = ({ signalingUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Get webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Set up WebRTC peer connection
        const peer = new RTCPeerConnection();
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        setPc(peer);
      })
      .catch((err) => {
        setError('Could not access webcam: ' + err.message);
      });
  }, []);

  useEffect(() => {
    if (!pc) return;
    // Connect to signaling server
    const socket = new WebSocket(signalingUrl);
    socket.onopen = () => {
      // Create offer
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: 'offer', offer }));
      });
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'answer' && data.answer) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
      if (data.type === 'ice-candidate' && data.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    };
    return () => {
      socket.close();
      pc.close();
    };
  }, [pc, signalingUrl]);

  return (
    <div style={{ textAlign: 'center' }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: 180, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }} />
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
};

export default VideoProctor; 