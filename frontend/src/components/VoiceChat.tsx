import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, LinearProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // <<< ADDED
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
  const [hasStarted, setHasStarted] = useState(false); // <<< ADDED: To control the overall interview state

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousQuestionRef = useRef<string | undefined>(); // <<< ADDED: To prevent re-speaking the same question

  // This effect now correctly handles auto-sending on silence
  useEffect(() => {
    if (!isListening || !transcription.trim() || isProcessing || isAISpeaking) {
      stopSilenceTimer();
      return;
    }

    const startSilenceTimer = () => {
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

      silenceIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechTime;

        if (timeSinceLastSpeech > 5000) {
          console.log('Auto-sending after 5 seconds of silence');
          onTranscription(transcription);
          setTranscription('');
          stopSilenceTimer(); // Stop the timer after sending
        } else {
          const progress = Math.min((timeSinceLastSpeech / 5000) * 100, 100);
          setSilenceProgress(progress);
        }
      }, 100);
    };

    startSilenceTimer();

    return () => {
      stopSilenceTimer();
    };
  }, [isListening, transcription, lastSpeechTime, isProcessing, isAISpeaking, onTranscription]);


  // Setup speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        if (isAISpeaking) return; // <<< ADDED: Ignore results if AI is speaking

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript.trim() + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const currentFinalTranscript = transcription + finalTranscript;
        const currentInterimTranscript = currentFinalTranscript + interimTranscript;

        if (interimTranscript || finalTranscript) {
          // Stop any ongoing AI speech when user starts speaking
          if (synthesisRef.current && synthesisRef.current.speaking) {
            synthesisRef.current.cancel();
            setIsAISpeaking(false);
          }
          setLastSpeechTime(Date.now());
          setIsUserSpeaking(true);
          setSilenceProgress(0);
        }

        setTranscription(currentInterimTranscript);

        if (finalTranscript) {
            setIsUserSpeaking(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
             setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setIsUserSpeaking(false);
        // Don't auto-send here, let the silence timer handle it
      };
    } else {
      setError('Speech recognition not supported in this browser');
      setIsSupported(false);
    }

    synthesisRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      stopSilenceTimer();
    };
  }, []);

  const stopSilenceTimer = () => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    setSilenceProgress(0);
  };

  const startListening = async () => {
    if (!recognitionRef.current || isListening) return;
    try {
      // Ensure microphone permission is granted before starting
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // We only needed permission
      
      console.log('Starting listening...');
      recognitionRef.current.start();
      setIsListening(true);
      setLastSpeechTime(Date.now());
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping listening...');
      recognitionRef.current.stop();
    }
    setIsListening(false);
    stopSilenceTimer();
  };
  
  // <<< CHANGED: Function to speak text, now with a callback for when speech ends
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (synthesisRef.current && text) {
      // Stop listening while AI speaks to prevent feedback loop
      stopListening(); 
      synthesisRef.current.cancel(); // Cancel any previous speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      
      const voices = synthesisRef.current.getVoices();
      const preferredVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsAISpeaking(true);
      
      utterance.onend = () => {
        setIsAISpeaking(false);
        if (onEndCallback) {
          onEndCallback(); // Execute the callback, e.g., to start listening again
        }
      };
      
      utterance.onerror = () => setIsAISpeaking(false);

      synthesisRef.current.speak(utterance);
    }
  };
  
  // <<< ADDED: Handler to start the entire interview process
  const handleStartInterview = () => {
    setHasStarted(true);
    const firstQuestion = currentQuestion || "Please tell me about your experience with the technologies mentioned in your resume.";
    // Speak the first question, and once done, start listening for the answer.
    speakText(firstQuestion, () => {
      startListening();
    });
  };

  // <<< ADDED: Handler to stop the interview
  const handleStopInterview = () => {
    stopListening();
    if (synthesisRef.current) {
        synthesisRef.current.cancel();
    }
    setHasStarted(false);
    setTranscription('');
  };

  // <<< REWORKED: This effect now automatically speaks new questions during the interview
  useEffect(() => {
    // Only speak if the interview has started, a new question is available, and the AI isn't already doing something.
    if (hasStarted && currentQuestion && currentQuestion !== previousQuestionRef.current && !isAISpeaking && !isProcessing) {
      speakText(currentQuestion, () => {
        startListening(); // Start listening for the user's answer after the question is asked
      });
    }
    // Update the ref to the current question
    previousQuestionRef.current = currentQuestion;
  }, [currentQuestion, hasStarted, isProcessing, isAISpeaking]);


  const handleSpeakQuestion = () => {
    if (currentQuestion) {
      speakText(currentQuestion, () => {
        startListening();
      });
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Voice Interview
      </Typography>

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
      
      {/* <<< CHANGED: Dynamic button controls based on interview state */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
        {!hasStarted ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartInterview}
            disabled={!isSupported}
            startIcon={<PlayArrowIcon />}
            size="large"
          >
            Start Interview
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="error"
              onClick={handleStopInterview}
              startIcon={<MicOffIcon />}
            >
              Stop Interview
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleSpeakQuestion}
              disabled={isAISpeaking}
              startIcon={<VolumeUpIcon />}
            >
              Repeat Question
            </Button>
          </>
        )}
        {loading && <CircularProgress size={24} />}
      </Box>

      {silenceProgress > 0 && transcription.trim() && !isProcessing && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Auto-sending in {Math.ceil(5 - (Date.now() - lastSpeechTime) / 1000)}s...
          </Typography>
          <LinearProgress
            variant="determinate"
            value={silenceProgress}
            sx={{ mt: 1 }}
            color="warning"
          />
        </Box>
      )}

      {transcription && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Your Answer:
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
      
      {/* <<< CHANGED: More descriptive caption */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {hasStarted 
            ? isAISpeaking 
                ? 'Interviewer is speaking...' 
                : isListening 
                    ? 'Listening... Speak your answer clearly.' 
                    : 'Click "Stop Interview" to end.'
            : 'Click "Start Interview" to begin.'
        }
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
