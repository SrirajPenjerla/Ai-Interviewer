import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const uploadResume = async (file?: File, linkedinUrl?: string, name?: string, email?: string) => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (linkedinUrl) formData.append('linkedin_url', linkedinUrl);
  if (name) formData.append('name', name);
  if (email) formData.append('email', email);
  const res = await axios.post(`${API_BASE}/resume/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const startInterview = async (candidateId: number, role: string) => {
  const res = await axios.post(`${API_BASE}/interview/start`, {
    candidate_id: candidateId,
    role,
  });
  return res.data;
};

export const nextQuestion = async (interviewId: number, answer: string) => {
  const res = await axios.post(`${API_BASE}/interview/next`, {
    interview_id: interviewId,
    answer,
  });
  return res.data;
};

export const getReport = async (interviewId: number) => {
  const res = await axios.get(`${API_BASE}/report/${interviewId}`, {
    responseType: 'blob',
  });
  return res.data;
};

export const getReportData = async (interviewId: number) => {
  const res = await axios.get(`${API_BASE}/report/${interviewId}/data`);
  return res.data;
}; 