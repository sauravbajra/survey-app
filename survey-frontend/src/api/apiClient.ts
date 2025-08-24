
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

interface SurveyData {
  survey_title: string;
  status?: 'draft' | 'published' | 'scheduled';
  publish_date?: string | null;
}

interface QuestionData {
  question_title: string;
  question_type: string;
  options?: string[] | null;
}

interface SubmissionAnswer {
    question_id: number;
    answer_value: string | string[];
}

interface SurveyFilters {
    status?: string;
    is_external?: string;
}

const apiClient = axios.create({ baseURL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response, // If the response is successful, just pass it through
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && (error.response.status === 401 || error.response.status === 422)) {
      // Clear the expired token
      localStorage.removeItem('accessToken');
      // Redirect to the login page
      window.location.href = '/login';
      // You could also show a toast message here if you set up a global toast provider
    }
    return Promise.reject(error);
  }
);

export const api = {
  // --- Auth ---
  login: (username: string, password: string) => apiClient.post('/login', { username, password }),
  register: (username: string, password: string) => apiClient.post('/register', { username, password }),
  refreshToken: () => apiClient.post('/refresh'),

  // --- Surveys ---
  // getSurveys: (page = 1, per_page = 10) => apiClient.get(`/surveys/?page=${page}&per_page=${per_page}`),
    getSurveys: (page = 1, per_page = 10, filters: SurveyFilters = {}) => {
    const params = new URLSearchParams({
        page: String(page),
        per_page: String(per_page),
    });

    if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
    }
    if (filters.is_external && filters.is_external !== 'all') {
        params.append('is_external', filters.is_external);
    }

    return apiClient.get(`/surveys/`, { params });
  },
  getSurveyById: (surveyId: string) => apiClient.get(`/surveys/${surveyId}`),
  createSurvey: (data: SurveyData) => apiClient.post('/surveys/', data),
  updateSurvey: (surveyId: string, data: Partial<SurveyData>) => apiClient.put(`/surveys/${surveyId}`, data),
  deleteSurvey: (surveyId: string) => apiClient.delete(`/surveys/${surveyId}`),
  publishSurvey: (surveyId: string) => apiClient.patch(`/surveys/${surveyId}/publish`),
  draftSurvey: (surveyId: string) => apiClient.patch(`/surveys/${surveyId}/draft`),

  // --- Questions ---
  createQuestion: (surveyId: string, data: QuestionData) => apiClient.post(`/surveys/${surveyId}/questions`, data),
  updateQuestion: (questionId: number, data: Partial<QuestionData>) => apiClient.put(`/surveys/questions/${questionId}`, data),
  deleteQuestion: (questionId: number) => apiClient.delete(`/surveys/questions/${questionId}`),

  // --- Submissions ---
  getSubmissionsForSurvey: (surveyId: string, page = 1, per_page = 10) => apiClient.get(`/surveys/${surveyId}/submissions?page=${page}&per_page=${per_page}`),
  getSubmissionById: (submissionId: number) => apiClient.get(`/submissions/${submissionId}`),
  createSubmission: (surveyId: string, answers: SubmissionAnswer[]) => apiClient.post(`/surveys/${surveyId}/submissions`, answers),
  deleteSubmission: (submissionId: number) => apiClient.delete(`/submissions/${submissionId}`),

  // --- Analytics ---
  getSurveyAnalytics: (surveyId: string) => apiClient.get(`/surveys/${surveyId}/analytics`),

  getPublicSurvey: (surveyId: string) => apiClient.get(`/public/surveys/${surveyId}`),
  submitPublicSurvey: (surveyId: string, answers: SubmissionAnswer[]) => apiClient.post(`/public/surveys/${surveyId}/submit`, answers),
};
