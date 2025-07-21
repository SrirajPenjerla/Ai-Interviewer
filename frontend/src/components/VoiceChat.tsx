import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, LinearProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AnimatedAvatar from './AnimatedAvatar';

// Add type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceChatProps {
  interviewId: number;
  onTranscription: (text: string) => void;
  onAIResponse: (audioBlob: Blob) => void;
  currentQuestion?: string;
  onAutoSend?: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ 
  interviewId, 
  onTranscription, 
  onAIResponse, 
  currentQuestion,
  onAutoSend 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [silenceProgress, setSilenceProgress] = useState(0);
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldAskQuestion, setShouldAskQuestion] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startSilenceTimer = () => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
    }
    
    silenceIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechTime;
      
      if (timeSinceLastSpeech > 5000 && transcription.trim() && !isProcessing) { // 5 seconds
        console.log('Auto-sending after 5 seconds of silence');
        onTranscription(transcription);
        setTranscription('');
        setSilenceProgress(0);
        setShouldAskQuestion(true);
      } else if (transcription.trim() && !isProcessing) {
        const progress = Math.min((timeSinceLastSpeech / 5000) * 100, 100);
        setSilenceProgress(progress);
      }
    }, 100);
  };

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep listening
      recognitionRef.current.interimResults = true; // Get interim results
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
        startSilenceTimer();
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update transcription with interim results
        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript) {
          setTranscription(currentTranscript);
          setLastSpeechTime(Date.now());
          setIsUserSpeaking(true);
          resetSilenceTimer();
          
          // Stop any ongoing AI speech when user starts speaking
          if (synthesisRef.current && synthesisRef.current.speaking) {
            synthesisRef.current.cancel();
            setIsAISpeaking(false);
          }
        }

        // If we have final results, send them
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setIsProcessing(true);
          onTranscription(finalTranscript);
          setIsUserSpeaking(false);
          setTranscription('');
          setIsProcessing(false);
          // Mark that we should ask the next question after processing
          setShouldAskQuestion(true);
          // Don't stop listening, keep going
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        stopSilenceTimer();
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        stopSilenceTimer();
      };
    } else {
      setError('Speech recognition not supported in this browser');
      setIsSupported(false);
    }

    // Initialize speech synthesis
    synthesisRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSilenceTimer();
      if (questionTimeoutRef.current) {
        clearTimeout(questionTimeoutRef.current);
      }
    };
  }, [onTranscription, currentQuestion, hasStarted, startSilenceTimer]);

  const resetSilenceTimer = () => {
    setLastSpeechTime(Date.now());
    setSilenceProgress(0);
  };

  const stopSilenceTimer = () => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    setSilenceProgress(0);
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    try {
      // First request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now start speech recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopSilenceTimer();
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const speakText = (text: string, isQuestion: boolean = true) => {
    if (synthesisRef.current && !isUserSpeaking && !isProcessing) {
      // Stop any current speech
      synthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set up speaking state
      setIsAISpeaking(true);
      
      utterance.onstart = () => {
        setIsAISpeaking(true);
      };
      
      utterance.onend = () => {
        setIsAISpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsAISpeaking(false);
      };
      
      // Faster voice settings for questions
      if (isQuestion) {
        utterance.rate = 1.1; // Faster speed
        utterance.pitch = 1.2; // Higher pitch for questions
        utterance.volume = 0.9;
        
        // Use a more natural voice if available
        const voices = synthesisRef.current.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Natural') || 
          voice.name.includes('Premium') ||
          voice.name.includes('Female') ||
          voice.name.includes('en-US')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
      
      synthesisRef.current.speak(utterance);
    }
  };

  const handleSpeakQuestion = () => {
    if (currentQuestion) {
      speakText(currentQuestion, true);
    } else {
      speakText("Please tell me about your experience with the technologies mentioned in your resume.", true);
    }
  };

  // Ask question immediately after user completes their answer
  useEffect(() => {
    if (shouldAskQuestion && currentQuestion && isListening && !isUserSpeaking && !isProcessing && !isAISpeaking) {
      // Clear any existing timeout
      if (questionTimeoutRef.current) {
        clearTimeout(questionTimeoutRef.current);
      }
      
      // Ask question immediately after user finishes
      questionTimeoutRef.current = setTimeout(() => {
        if (!isUserSpeaking && !isProcessing && !isAISpeaking) {
          speakText(currentQuestion, true);
          setShouldAskQuestion(false);
        }
      }, 500); // 0.5 second delay for immediate response
    }
  }, [shouldAskQuestion, currentQuestion, isListening, isUserSpeaking, isProcessing, isAISpeaking]);

  // Reset question asked flag when question changes
  useEffect(() => {
    setShouldAskQuestion(false);
  }, [currentQuestion]);

  // Auto-speak question when a new question is displayed and user is not speaking
  useEffect(() => {
    if (
      currentQuestion &&
      isListening &&
      !isUserSpeaking &&
      !isAISpeaking &&
      !isProcessing
    ) {
      // Speak the question automatically
      speakText(currentQuestion, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Voice Interview
      </Typography>
      
      {/* Animated AI Avatar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <AnimatedAvatar
          isSpeaking={isAISpeaking}
          isListening={isListening && !isUserSpeaking}
          isThinking={isProcessing}
          size={100}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant={isListening ? "contained" : "outlined"}
          color={isListening ? "error" : "primary"}
          onClick={handleVoiceToggle}
          disabled={!isSupported}
          startIcon={isListening ? <MicOffIcon /> : <MicIcon />}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleSpeakQuestion}
          startIcon={<VolumeUpIcon />}
        >
          Repeat Question
        </Button>
        
        {loading && <CircularProgress size={24} />}
      </Box>

      {silenceProgress > 0 && transcription.trim() && !isProcessing && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Auto-sending in {Math.ceil((5000 - (Date.now() - lastSpeechTime)) / 1000)}s...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={silenceProgress} 
            sx={{ mt: 1 }}
            color="warning"
          />
        </Box>
      )}

      {transcription && !isProcessing && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Transcribed:
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
            {`"${transcription}"`}
          </Typography>
        </Box>
      )}

      {isProcessing && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Processing your answer...
          </Typography>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {isListening ? 'Listening... Speak clearly. Answer will auto-send after 5 seconds of silence.' : 'Click the microphone to start voice input.'}
      </Typography>
      
      {!isSupported && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Voice recognition is not supported in this browser. Try using Chrome or Edge.
        </Alert>
      )}
    </Paper>
  );
};

export default VoiceChat; 