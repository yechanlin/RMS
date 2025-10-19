const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.name && Array.isArray(errorData.name)) {
            // Handle Django REST framework field validation errors
            errorMessage = errorData.name[0];
          } else if (errorData.name && typeof errorData.name === 'string') {
            errorMessage = errorData.name;
          } else if (typeof errorData === 'object') {
            // Handle generic validation errors
            const firstError = Object.values(errorData)[0];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        } catch (e) {
          // If we can't parse JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle empty responses (like DELETE requests that return 204)
      if (response.status === 204 || response.status === 201) {
        return { success: true, status: response.status };
      }

      // Handle JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Companies API
  async getCompanies() {
    const response = await this.request('/companies/');
    // Handle paginated response
    return response.results || response;
  }

  async getCompany(id) {
    return this.request(`/companies/${id}/`);
  }

  async createCompany(companyData) {
    return this.request('/companies/', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(id, companyData) {
    return this.request(`/companies/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(id) {
    return this.request(`/companies/${id}/`, {
      method: 'DELETE',
    });
  }

  async searchCompanies(searchTerm) {
    return this.request(`/companies/?search=${encodeURIComponent(searchTerm)}`);
  }

  // Jobs API
  async getJobs() {
    const response = await this.request('/jobs/');
    // Handle paginated response
    return response.results || response;
  }

  async getJob(id) {
    return this.request(`/jobs/${id}/`);
  }

  async createJob(jobData) {
    return this.request('/jobs/', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id, jobData) {
    return this.request(`/jobs/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id) {
    return this.request(`/jobs/${id}/`, {
      method: 'DELETE',
    });
  }

  async getJobsByCompany(companyId) {
    return this.request(`/jobs/?company=${companyId}`);
  }

  async searchJobs(searchTerm) {
    return this.request(`/jobs/?search=${encodeURIComponent(searchTerm)}`);
  }

  // Resume/CV API
  async uploadCV(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/resumes/base-cv/upload/', {
      method: 'POST',
      headers: {}, // Remove Content-Type header to let browser set it with boundary
      body: formData,
    });
  }

  async getLatestCV() {
    return this.request('/resumes/base-cv/latest/');
  }

  async downloadCV(id) {
    return this.request(`/resumes/base-cv/${id}/download/`);
  }

  async getCVStats() {
    return this.request('/resumes/base-cv/stats/');
  }

  async extractCVText(id) {
    return this.request(`/resumes/base-cv/${id}/extract_text/`);
  }

  async updateCVText(id, text) {
    const formData = new FormData();
    formData.append('text', text);

    return this.request(`/resumes/base-cv/${id}/update_text/`, {
      method: 'POST',
      headers: {}, // Remove Content-Type header to let browser set it for FormData
      body: formData,
    });
  }

  // Tailor resume API
  async tailorResume({ cv, cv_text, company, job_description, additional_feedback }) {
    const formData = new FormData();
    
    // Add either cv file or cv_text, but not both
    if (cv_text) {
      formData.append('cv_text', cv_text);
    } else if (cv) {
      formData.append('cv', cv);
    } else {
      throw new Error('Either cv file or cv_text must be provided');
    }
    
    formData.append('company', company);
    formData.append('job_description', job_description);
    
    // Add additional feedback if provided
    if (additional_feedback) {
      formData.append('additional_feedback', additional_feedback);
    }

    console.log('Tailor resume request:', {
      cv: cv?.name || 'No file',
      cv_text: cv_text ? cv_text.substring(0, 100) + '...' : 'No text',
      company,
      job_description: job_description?.substring(0, 100) + '...',
      additional_feedback: additional_feedback ? additional_feedback.substring(0, 50) + '...' : 'None'
    });

    return this.request('/resumes/tailor-resume/', {
      method: 'POST',
      headers: {}, // Let the browser set multipart boundary automatically
      body: formData,
    });
  }

  // Tailored resumes API
  async getTailoredResumes(jobId = null) {
    const url = jobId ? `/resumes/tailored-resumes/?job_id=${jobId}` : '/resumes/tailored-resumes/';
    const response = await this.request(url);
    return response.results || response;
  }

  async deleteTailoredResume(id) {
    return this.request(`/resumes/tailored-resumes/${id}/`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
