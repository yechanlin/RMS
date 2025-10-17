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
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`Response data:`, data);
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
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
