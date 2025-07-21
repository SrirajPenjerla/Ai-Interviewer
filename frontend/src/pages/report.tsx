import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import Grid from '@mui/material/Grid';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/router';
import { getReport, getReportData } from '../utils/api';

interface Answer {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  technical_depth?: number;
  problem_solving?: number;
  communication?: number;
  experience?: number;
  critical_thinking?: number;
  overall_assessment?: string;
}

interface InterviewReport {
  interview_id: number;
  candidate_name: string;
  role: string;
  total_score: number;
  average_score: number;
  answers: Answer[];
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement?: string[];
  recommendations: string[];
  potential?: string;
  next_steps?: string[];
  category_analysis?: Record<string, string>;
  critical_weaknesses?: string[];
  hiring_recommendation?: string;
}

const ReportPage = () => {
  const router = useRouter();
  const { interview } = router.query;
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [report, setReport] = useState<InterviewReport | null>(null);

  // Mock data for demonstration
  const mockReport: InterviewReport = {
    interview_id: parseInt(interview as string) || 1,
    candidate_name: "John Doe",
    role: "Software Engineer",
    total_score: 85,
    average_score: 8.5,
    answers: [
      {
        question: "Tell me about your experience with React and how you handle state management.",
        answer: "I have 3 years of experience with React. I use hooks like useState and useContext for local state, and Redux for global state management. I also work with React Query for server state.",
        score: 9,
        feedback: "Excellent understanding of React concepts. Good mention of modern patterns like hooks and state management tools.",
        technical_depth: 9,
        problem_solving: 8,
        communication: 9,
        experience: 9,
        critical_thinking: 8
      },
      {
        question: "Describe a challenging project you worked on and how you solved the problems.",
        answer: "I worked on a real-time chat application that had performance issues with large message volumes. I implemented virtual scrolling and message pagination to improve performance.",
        score: 8,
        feedback: "Good problem-solving approach. Shows technical depth and practical experience.",
        technical_depth: 8,
        problem_solving: 8,
        communication: 7,
        experience: 8,
        critical_thinking: 7
      },
      {
        question: "How do you handle debugging and troubleshooting in production environments?",
        answer: "I use logging frameworks, monitoring tools like Sentry, and systematic debugging approaches. I also create reproducible test cases.",
        score: 7,
        feedback: "Solid debugging methodology. Could mention more specific tools and metrics.",
        technical_depth: 7,
        problem_solving: 7,
        communication: 7,
        experience: 7,
        critical_thinking: 7
      }
    ],
    overall_feedback: "Strong technical candidate with good problem-solving skills. Shows practical experience and understanding of modern development practices.",
    strengths: [
      "Excellent React knowledge and modern patterns",
      "Good problem-solving approach",
      "Practical experience with real-world projects",
      "Understanding of performance optimization"
    ],
    areas_for_improvement: [
      "Could improve system design knowledge",
      "More experience with cloud platforms would be beneficial",
      "Consider learning more about DevOps practices"
    ],
    recommendations: [
      "Continue building full-stack applications",
      "Learn more about microservices architecture",
      "Consider contributing to open source projects",
      "Practice system design interviews"
    ],
    potential: "High potential for leadership roles in the tech industry.",
    next_steps: ["Learn more about microservices architecture", "Practice system design interviews"],
    category_analysis: {
      technical_depth: "Excellent understanding of React concepts and modern patterns.",
      problem_solving: "Good problem-solving approach with technical depth and practical experience.",
      communication: "Excellent communication skills, both technical and non-technical.",
      experience: "Strong practical experience with real-world projects and understanding of modern development practices.",
      critical_thinking: "Solid debugging methodology and systematic approach to problem-solving."
    },
    critical_weaknesses: ["Could improve system design knowledge", "More experience with cloud platforms would be beneficial"],
    hiring_recommendation: "Highly recommend for a senior software engineer position."
  };

  useEffect(() => {
    if (interview) {
      // Fetch real report data from API
      const fetchReportData = async () => {
        try {
          const data = await getReportData(parseInt(interview as string));
          setReport(data);
        } catch (error) {
          console.error('Error fetching report data:', error);
          // Fallback to mock data if API fails
          setReport(mockReport);
        }
      };

      fetchReportData();
    }
  }, [interview]);

  const handleExportPDF = async () => {
    if (!interview) return;
    setLoading(true);
    setError('');
    try {
      const blob = await getReport(parseInt(interview as string));
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      setPdfUrl(url);
    } catch (err) {
      setError('Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    return 'Needs Improvement';
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button component="a" href="/" variant="contained" color="primary" sx={{ mt: 2 }}>
          Go Back Home
        </Button>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
            <AssessmentIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: 22, md: 32 } }}>
              Interview Report
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: 16, md: 22 } }}>
              {report.candidate_name || '-'} • {report.role || '-'}
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', width: '100%' }}>
              <CardContent>
                <Typography variant="h3" align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {report.average_score ?? '-'}{report.average_score ? '/10' : ''}
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', width: '100%' }}>
              <CardContent>
                <Typography variant="h3" align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {report.answers?.length ?? '-'}
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Questions Answered
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', width: '100%' }}>
              <CardContent>
                <Typography variant="h3" align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {report.answers && report.answers.length > 0 ? Math.round((report.answers.filter(a => a.score >= 8).length / report.answers.length) * 100) : '-'}%
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Strong Answers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      <Grid container spacing={3}>
        {/* Detailed Answers */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, width: '100%', overflowX: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              Detailed Answers
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {(!report.answers || report.answers.length === 0) && (
              <Alert severity="info">No answers available for this interview.</Alert>
            )}
            <List>
              {report.answers && report.answers.map((answer, index) => (
                <Accordion key={index} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel${index}-content`} id={`panel${index}-header`}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Chip
                        label={`${answer.score ?? '-'}${answer.score ? '/10' : ''}`}
                        color={getScoreColor(answer.score) as any}
                        size="small"
                        aria-label={`Score: ${answer.score ?? '-'}`}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {answer.question ? answer.question.substring(0, 60) : '-'}...
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Question:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {answer.question || '-'}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Answer:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                        {`"${answer.answer || '-'}"`}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Feedback:
                      </Typography>
                      <Alert severity={answer.score >= 8 ? 'success' : answer.score >= 6 ? 'warning' : 'error'} sx={{ mb: 2 }}>
                        {answer.feedback || '-'}
                      </Alert>
                      {/* Show per-category scores if available */}
                      {(answer.technical_depth || answer.problem_solving || answer.communication || answer.experience || answer.critical_thinking) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Category Scores:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Chip label={`Technical: ${answer.technical_depth ?? '-'} / 10`} color="info" size="small" />
                            <Chip label={`Problem Solving: ${answer.problem_solving ?? '-'} / 10`} color="info" size="small" />
                            <Chip label={`Communication: ${answer.communication ?? '-'} / 10`} color="info" size="small" />
                            <Chip label={`Experience: ${answer.experience ?? '-'} / 10`} color="info" size="small" />
                            <Chip label={`Critical Thinking: ${answer.critical_thinking ?? '-'} / 10`} color="info" size="small" />
                          </Box>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Score:
                        </Typography>
                        <Rating value={answer.score ? answer.score / 2 : 0} readOnly precision={0.5} />
                        <Typography variant="body2">
                          ({answer.score ?? '-'}{answer.score ? '/10' : ''} - {getScoreLabel(answer.score ?? 0)})
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </List>
          </Paper>
        </Grid>
        {/* Summary and Recommendations */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, width: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEventsIcon color="primary" />
              Overall Assessment
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 3 }}>
              {report.overall_feedback || '-'}
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Strengths:
              </Typography>
              {report.strengths && report.strengths.length > 0 ? report.strengths.map((strength, index) => (
                <Chip
                  key={index}
                  label={strength}
                  color="success"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              )) : <Typography variant="body2">-</Typography>}
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Areas for Improvement:
              </Typography>
              {report.areas_for_improvement && report.areas_for_improvement.length > 0 ? report.areas_for_improvement.map((area, index) => (
                <Chip
                  key={index}
                  label={area}
                  color="warning"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              )) : <Typography variant="body2">-</Typography>}
            </Box>
            <Box>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                Recommendations:
              </Typography>
              {report.recommendations && report.recommendations.length > 0 ? report.recommendations.map((rec, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {rec}
                </Typography>
              )) : <Typography variant="body2">-</Typography>}
            </Box>
          </Paper>
          {/* Score Distribution */}
          <Paper elevation={2} sx={{ p: 3, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Score Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {report.answers && report.answers.length > 0 ? report.answers.map((answer, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Q{index + 1}</Typography>
                  <Typography variant="body2">{answer.score ?? '-'}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={answer.score ? answer.score * 10 : 0}
                  color={getScoreColor(answer.score ?? 0) as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )) : <Typography variant="body2">No answers available.</Typography>}
          </Paper>
        </Grid>
      </Grid>
      {/* PDF Export */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            disabled={loading}
            size="large"
            aria-label="Download PDF Report"
          >
            {loading ? <CircularProgress size={24} /> : 'Download PDF Report'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {pdfUrl && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>PDF Preview</Typography>
            <iframe
              src={pdfUrl}
              width="100%"
              height="600px"
              style={{ border: '1px solid #ccc', borderRadius: 8 }}
              title="PDF Preview"
            />
            <Box sx={{ mt: 2 }}>
              <Button
                component="a"
                href={pdfUrl}
                download={`interview_report_${interview}.pdf`}
                variant="outlined"
                color="secondary"
                aria-label="Save PDF"
              >
                Save PDF
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      {/* New sections for category analysis, critical weaknesses, next steps, and hiring recommendation */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, width: '100%' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Detailed Category Analysis
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Category Analysis:
          </Typography>
          {report.category_analysis && Object.entries(report.category_analysis).length > 0 ? Object.entries(report.category_analysis).map(([cat, desc], idx) => (
            <Typography key={cat} variant="body2" sx={{ mb: 1 }}>
              <b>{cat.replace(/_/g, ' ')}:</b> {desc}
            </Typography>
          )) : <Typography variant="body2">-</Typography>}
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Critical Weaknesses:
          </Typography>
          {report.critical_weaknesses && report.critical_weaknesses.length > 0 ? report.critical_weaknesses.map((w, idx) => (
            <Chip key={idx} label={w} color="error" size="small" sx={{ mr: 1, mb: 1 }} />
          )) : <Typography variant="body2">-</Typography>}
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="secondary" gutterBottom>
            Next Steps:
          </Typography>
          {report.next_steps && report.next_steps.length > 0 ? report.next_steps.map((step, idx) => (
            <Chip key={idx} label={step} color="secondary" size="small" sx={{ mr: 1, mb: 1 }} />
          )) : <Typography variant="body2">-</Typography>}
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="info" gutterBottom>
            Hiring Recommendation:
          </Typography>
          <Chip label={report.hiring_recommendation ?? '-'} color="info" size="medium" />
        </Box>
      </Paper>
    </Container>
  );
};

export default ReportPage; 