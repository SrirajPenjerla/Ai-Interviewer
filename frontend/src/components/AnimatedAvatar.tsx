import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { keyframes } from '@emotion/react';

interface AnimatedAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  size?: number;
  showName?: boolean;
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 8px #1976d2; }
  50% { box-shadow: 0 0 32px #42a5f5, 0 0 48px #90caf9; }
  100% { box-shadow: 0 0 8px #1976d2; }
`;

const wave = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(8deg); }
  75% { transform: rotate(-8deg); }
  100% { transform: rotate(0deg); }
`;

const thinking = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  isSpeaking,
  isListening,
  isThinking,
  size = 120,
  showName = true,
}) => {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setDots((prev) => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots(0);
    }
  }, [isThinking]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          mx: 'auto',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #90caf9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isSpeaking ? `${pulse} 1.2s infinite` : 'none',
          boxShadow: isSpeaking || isListening ? `0 0 32px #42a5f5, 0 0 48px #90caf9` : '0 8px 32px rgba(25, 118, 210, 0.3)',
          border: '3px solid #fff',
          ...(isSpeaking && { animation: `${pulse} 1.2s infinite, ${glow} 2s infinite` }),
          ...(isListening && { animation: `${wave} 1.2s infinite, ${glow} 2s infinite` }),
        }}
      >
        <SmartToyIcon
          sx={{
            fontSize: size * 0.5,
            color: 'white',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        />
        {/* Thinking dots */}
        {isThinking && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -24,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.5,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#1976d2',
                  animation: `${thinking} 1.5s infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
        )}
      </Box>
      {showName && (
        <Typography
          variant="h6"
          color="primary"
          sx={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.1)', mb: 1 }}
        >
          AI Interviewer
        </Typography>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontStyle: 'italic', opacity: 0.8 }}
      >
        {isSpeaking && 'AI is speaking'}
        {isListening && 'AI is listening'}
        {isThinking && `AI is thinking${'.'.repeat(dots)}`}
        {!isSpeaking && !isListening && !isThinking && 'Ready for your answer'}
      </Typography>
    </Box>
  );
};

export default AnimatedAvatar; 