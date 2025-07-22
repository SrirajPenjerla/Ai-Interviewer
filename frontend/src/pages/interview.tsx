import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { nextQuestion } from '../utils/api';
import VoiceChat from '../components/VoiceChat';
import VideoProctor from '../components/VideoProctor';
import Link from 'next/link';

// Demo questions defined outside the component for stability
const demoQuestions = [
    "Tell me about yourself and your background in software development.",
    "Can you walk me through a complex algorithm you've implemented? What was the time complexity?",
    "Describe a challenging debugging scenario you encountered. What was the root cause?",
    "How would you design a scalable microservices architecture?",
    "Tell me about a performance optimization you made to an existing system.",
    "Design a real-time chat application that can handle millions of users.",
    "Describe a time when you had to lead a team through a difficult technical challenge.",
    "How do you ensure your code is maintainable and readable?",
    "What emerging technologies do you think will have the biggest impact in the next 5 years?",
    "Tell me about your experience with CI/CD pipelines and testing strategies."
];
const TOTAL_DEMO_QUESTIONS = demoQuestions.length;

const InterviewPage = () => {
  const router = useRouter();
  const { interview, question } = router.query;
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [progress, setProgress] = useState<string[]>([]);
  const [scores, setScores] = useState<Array<Record<string, number>>>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Consolidated state for loading/processing
  const [isProcessing, setIsProcessing] = useState(false);
  // State to track if AI is speaking
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      if (interview && question) {
        setCurrentQuestion(question as string);
        setProgress([question as string]);
      } else if (!interview) {
        // Automatically enter demo mode if no interview ID is present
        setDemoMode(true);
        // Do not set a question here; wait for the user to click "Start Demo"
      }
    }
  }, [router.isReady, interview, question]);

  const handleVoiceTranscription = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    try {
      if (interview) {
        const res = await nextQuestion(parseInt(interview as string), text);
        setScores([...scores, res.score]);

        if (res.question) {
          setCurrentQuestion(res.question);
          setProgress([...progress, res.question]);
        } else {
          setInterviewComplete(true);
        }
      } else { // Demo mode logic
        setDemoMode(true);
        const currentQuestionIndex = progress.length;
        if (currentQuestionIndex < TOTAL_DEMO_QUESTIONS) {
          const nextDemoQuestion = demoQuestions[currentQuestionIndex];
          setCurrentQuestion(nextDemoQuestion);
          setProgress([...progress, nextDemoQuestion]);

          const simulatedScore = { score: Math.floor(Math.random() * 3) + 6 };
          setScores([...scores, simulatedScore]);
        } else {
          setInterviewComplete(true);
        }
      }
    } catch (err) {
      console.error('Error handling transcription, falling back to demo mode:', err);
      // Fallback logic in case of API error
      setDemoMode(true);
      const currentQuestionIndex = progress.length;
      if (currentQuestionIndex < TOTAL_DEMO_QUESTIONS) {
        const nextDemoQuestion = demoQuestions[currentQuestionIndex];
        setCurrentQuestion(nextDemoQuestion);
        setProgress([...progress, nextDemoQuestion]);
      } else {
        setInterviewComplete(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIResponse = (audioBlob: Blob) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    setIsAISpeaking(true); 
    audio.play();
    audio.onended = () => {
      setIsAISpeaking(false);
    };
  };

  const handleGoToReport = () => {
    router.push({ pathname: '/report', query: { interview } });
  };

  const startDemoInterview = () => {
    setDemoMode(true);
    setCurrentQuestion(demoQuestions[0]);
    setProgress([demoQuestions[0]]);
    setInterviewComplete(false);
    setScores([]);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      {demoMode && !currentQuestion && ( // <<< MODIFIED: Only show demo alert before start
        <Alert severity="info" sx={{ mb: 2 }}>
          You are in demo mode. Your progress will not be saved.
        </Alert>
      )}

      {!currentQuestion && (
        <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '10px' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            AI Interview Practice
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Upload your resume for a tailored interview or start a general technical demo.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Link href="/upload" passHref>
              <Typography component="span" sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 1.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'primary.dark' }}}>
                Upload Resume
              </Typography>
            </Link>
            <Typography component="span" onClick={startDemoInterview} sx={{ bgcolor: 'secondary.main', color: 'white', px: 3, py: 1.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'secondary.dark' }}}>
              Start Demo Interview
            </Typography>
          </Box>
        </Paper>
      )}

      {currentQuestion && (
        <Paper elevation={8} sx={{ p: { xs: 2, md: 4 }, borderRadius: '15px', position: 'relative' }}>
          {/* <<< CHANGED: Logic to unmount webcam when interview is complete */}
          { !interviewComplete && (
            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
              {/* <<< CHANGED: Increased width and height for a larger view */}
              <Box sx={{ width: 160, height: 120, borderRadius: 2, boxShadow: 3, overflow: 'hidden', border: '2px solid white' }}>
                <VideoProctor signalingUrl={"ws://localhost:8000/ws/proctor"} />
              </Box>
            </Box>
          )}
          
          <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
            Interview in Progress
          </Typography>

          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Current Question:</Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
              {`"${currentQuestion}"`}
            </Typography>
          </Paper>

          <Box sx={{ maxWidth: 500, mx: 'auto', width: '100%' }}>
            <VoiceChat
              interviewId={parseInt(interview as string) || 1}
              onTranscription={handleVoiceTranscription}
              onAIResponse={handleAIResponse}
              currentQuestion={currentQuestion}
              isProcessing={isProcessing}
              isAISpeaking={isAISpeaking}
              onAutoSend={() => {}}
            />
          </Box>
          
          {isProcessing && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Processing your answer...</Typography>
            </Box>
          )}

          {interviewComplete && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" gutterBottom>🎉 Interview Complete!</Typography>
              <Typography component="span" onClick={handleGoToReport} sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 1.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'primary.dark' }}}>
                View Report
              </Typography>
            </Box>
          )}

          {progress.length > 0 && !interviewComplete && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: {progress.length} of {demoMode ? TOTAL_DEMO_QUESTIONS : '...'} questions
              </Typography>
              <LinearProgress
                variant="determinate"
                value={demoMode ? (progress.length / TOTAL_DEMO_QUESTIONS) * 100 : (progress.length / 10) * 100} // Fallback for real interview
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default InterviewPage;
