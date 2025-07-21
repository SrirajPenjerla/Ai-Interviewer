import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { nextQuestion } from '../utils/api';
import VoiceChat from '../components/VoiceChat';
import AnimatedAvatar from '../components/AnimatedAvatar';
import Link from 'next/link';
import VideoProctor from '../components/VideoProctor';
import { motion } from 'framer-motion';

const InterviewPage = () => {
  const router = useRouter();
  const { interview, question } = router.query;
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [scores, setScores] = useState<Array<Record<string, number>>>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Demo questions for when backend is not available
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

  useEffect(() => {
    if (interview && router.isReady) {
      if (question) {
        setCurrentQuestion(question as string);
        setProgress([question as string]);
      } else {
        setDemoMode(true);
        setCurrentQuestion(demoQuestions[0]);
        setProgress([demoQuestions[0]]);
      }
    }
  }, [interview, router.isReady, question]);

  const handleVoiceTranscription = async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
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
      } else {
        setDemoMode(true);
        const currentQuestionIndex = progress.length;
        if (currentQuestionIndex < demoQuestions.length) {
          const nextQuestion = demoQuestions[currentQuestionIndex];
          setCurrentQuestion(nextQuestion);
          setProgress([...progress, nextQuestion]);

          // Simulate score
          const simulatedScore = {
            score: Math.floor(Math.random() * 3) + 6,
            technical_depth: Math.floor(Math.random() * 3) + 6,
            problem_solving: Math.floor(Math.random() * 3) + 6,
            communication: Math.floor(Math.random() * 3) + 6,
            experience: Math.floor(Math.random() * 3) + 6,
            critical_thinking: Math.floor(Math.random() * 3) + 6
          };
          setScores([...scores, simulatedScore]);
        } else {
          setInterviewComplete(true);
        }
      }
    } catch (err) {
      console.error('Error in handleVoiceTranscription:', err);
      setDemoMode(true);
      const currentQuestionIndex = progress.length;
      if (currentQuestionIndex < demoQuestions.length) {
        const nextQuestion = demoQuestions[currentQuestionIndex];
        setCurrentQuestion(nextQuestion);
        setProgress([...progress, nextQuestion]);
      } else {
        setInterviewComplete(true);
      }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleAIResponse = (audioBlob: Blob) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
  };

  const handleGoToReport = () => {
    router.push({ pathname: '/report', query: { interview } });
  };

  const startDemoInterview = () => {
    setCurrentQuestion(demoQuestions[0]);
    setProgress([demoQuestions[0]]);
  };

  return (
    <Container maxWidth="md" sx={{
      mt: 6, mb: 6, background: 'linear-gradient(135deg, rgba(0,123,255,0.1), rgba(40,41,61,0.1))',
      borderRadius: '10px', boxShadow: 3, position: 'relative'
    }}>
      {demoMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Running in demo mode. Backend server may not be available.
        </Alert>
      )}

      {!currentQuestion && !interview && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Welcome to AI Interviewer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start with a resume upload or try a demo interview
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Link href="/upload" passHref>
              <Typography component="span" sx={{
                bgcolor: 'primary.main', color: 'white', px: 3, py: 1.5, borderRadius: 1, cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.dark' }
              }}>
                Upload Resume
              </Typography>
            </Link>
            <Typography component="span" sx={{
              bgcolor: 'secondary.main', color: 'white', px: 3, py: 1.5, borderRadius: 1, cursor: 'pointer',
              '&:hover': { bgcolor: 'secondary.dark' }
            }} onClick={startDemoInterview}>
              Start Demo Interview
            </Typography>
          </Box>
        </Box>
      )}

      {currentQuestion && (
        <Paper elevation={8} sx={{
          p: { xs: 2, md: 6 }, borderRadius: '15px', bgcolor: 'rgba(255,255,255,0.98)', maxWidth: 800, mx: 'auto',
          boxShadow: 12, position: 'relative', overflow: 'hidden',
          minHeight: { xs: 0, md: 500 },
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3, letterSpacing: 1, fontSize: { xs: 24, md: 32 } }}>
            Interview
          </Typography>
          {/* Webcam: Responsive placement */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'block' },
              justifyContent: { xs: 'center', md: 'flex-end' },
              alignItems: { xs: 'center', md: 'flex-start' },
              position: { xs: 'static', md: 'absolute' },
              top: { md: 24 },
              right: { md: 24 },
              width: { xs: '100%', md: 140 },
              mb: { xs: 2, md: 0 },
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                width: { xs: 120, md: 120 },
                height: { xs: 90, md: 90 },
                borderRadius: 2,
                boxShadow: 3,
                border: '3px solid white',
                backgroundColor: 'black',
                overflow: 'hidden',
              }}
            >
              <VideoProctor signalingUrl={"ws://localhost:8000/ws/proctor"} />
            </Box>
          </Box>
          <Paper elevation={1} sx={{
            p: 3, mb: 3, bgcolor: '#f5f5f5', borderRadius: 3, maxWidth: 600, mx: 'auto', boxShadow: 3,
            fontSize: { xs: 16, md: 20 },
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: 18, md: 24 } }}>
              Current Question
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: { xs: 15, md: 18 } }}>
              {`"${currentQuestion}"`}
            </Typography>
          </Paper>
          <Box sx={{ maxWidth: 500, mx: 'auto', width: '100%' }}>
            <VoiceChat
              interviewId={parseInt(interview as string) || 1}
              onTranscription={handleVoiceTranscription}
              onAIResponse={handleAIResponse}
              currentQuestion={currentQuestion}
              onAutoSend={() => {}}
            />
          </Box>

          {loading && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Processing your answer...</Typography>
            </Box>
          )}

          {interviewComplete && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                🎉 Interview Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your interview has been completed. View your detailed report below.
              </Typography>
              <Typography component="span" sx={{
                bgcolor: 'primary.main', color: 'white', px: 3, py: 1.5, borderRadius: 1, cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.dark' }
              }} onClick={handleGoToReport}>
                View Report
              </Typography>
            </Box>
          )}

          {progress.length > 1 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: {progress.length} of 10 questions answered
              </Typography>
              <LinearProgress variant="determinate" value={(progress.length / 10) * 100} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default InterviewPage;
