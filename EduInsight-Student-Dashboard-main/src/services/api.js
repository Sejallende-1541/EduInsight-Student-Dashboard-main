// EduInsight Frontend API Client with live backend & seamless sample dataset fallback
import {
  getOfflineDashboardStats,
  getOfflineStudents,
  getOfflineAnalysis,
  getOfflineModelInfo,
  getOfflinePrediction,
  getOfflineAtRisk,
} from './offlineFallback';
import sampleStudents from '../data/sampleStudents.json';

async function request(endpoint, options = {}) {
  // Candidate URLs in priority order
  const urls = [];
  if (import.meta.env.VITE_API_URL) {
    urls.push(`${import.meta.env.VITE_API_URL}${endpoint}`);
  }
  urls.push(`/api${endpoint}`);
  urls.push(`http://localhost:8000/api${endpoint}`);
  urls.push(`http://127.0.0.1:8000/api${endpoint}`);

  // Deduplicate URLs while preserving order
  const candidateUrls = [...new Set(urls)];
  let lastNetworkError = null;

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        // The server actually responded with an error (e.g., 400 Duplicate ID, 422 Validation Error)
        let errorMsg = `Server Error (${res.status})`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch (e) {
          // ignore json parse error
        }
        // Do NOT retry alternative URLs on a 4xx application error; immediately throw the server's exact message!
        throw new Error(errorMsg);
      }
      return await res.json();
    } catch (err) {
      // If this is an application error thrown from above (not a browser network failure), immediately rethrow it
      const msg = err.message || '';
      const isNetworkError =
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed') ||
        msg.includes('ECONNREFUSED');

      if (!isNetworkError) {
        throw err;
      }
      lastNetworkError = err;
      // Continue to next candidate URL
    }
  }

  throw lastNetworkError || new Error('Cannot connect to backend API server on port 8000.');
}

export const api = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      return await request('/dashboard/stats');
    } catch (err) {
      console.warn('Backend API unavailable. Activating built-in sample dataset fallback:', err);
      return getOfflineDashboardStats();
    }
  },

  // Students
  getStudents: async ({ search = '', department = 'All', page = 1, pageSize = 15 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department && department !== 'All') params.append('department', department);
    params.append('page', page);
    params.append('page_size', pageSize);
    try {
      return await request(`/students/?${params.toString()}`);
    } catch (err) {
      return getOfflineStudents({ search, department, page, pageSize });
    }
  },

  getAllStudents: async () => {
    try {
      return await request('/students/all');
    } catch (err) {
      return sampleStudents;
    }
  },

  getStudentById: async (id) => {
    try {
      return await request(`/students/${id}`);
    } catch (err) {
      const found = sampleStudents.find((s) => s.id === parseInt(id) || s.student_id === id);
      if (found) return found;
      throw new Error('Student not found');
    }
  },

  createStudent: async (studentData) => {
    return await request('/students/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
  },

  updateStudent: async (id, studentData) => {
    return await request(`/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
  },

  deleteStudent: async (id) => {
    return await request(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await request('/students/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getExportCsvUrl: () => `http://localhost:8000/api/students/export/csv`,

  // Analysis
  getAnalysisSummary: async () => {
    try {
      return await request('/analysis/summary');
    } catch (err) {
      return getOfflineAnalysis();
    }
  },

  // Predictions / ML
  getModelInfo: async () => {
    try {
      return await request('/predictions/model-info');
    } catch (err) {
      return getOfflineModelInfo();
    }
  },

  retrainModel: async (testSize = 0.2) => {
    try {
      return await request(`/predictions/train?test_size=${testSize}`, {
        method: 'POST',
      });
    } catch (err) {
      return getOfflineModelInfo();
    }
  },

  predictMarks: async (input) => {
    try {
      return await request('/predictions/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch (err) {
      return getOfflinePrediction(
        input.study_hours_per_week,
        input.attendance_percentage,
        input.past_exam_marks,
        input.assignment_score
      );
    }
  },

  // At-Risk
  getAtRiskStudents: async (marksThreshold = 40.0, attendanceThreshold = 75.0) => {
    const params = new URLSearchParams({
      marks_threshold: marksThreshold,
      attendance_threshold: attendanceThreshold,
    });
    try {
      return await request(`/students/risk/flagged?${params.toString()}`);
    } catch (err) {
      return getOfflineAtRisk(marksThreshold, attendanceThreshold);
    }
  },
};
