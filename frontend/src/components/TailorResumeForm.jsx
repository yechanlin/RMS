import React, { useState } from 'react';
import axios from 'axios';

const TailorResumeForm = () => {
  const [formData, setFormData] = useState({
    cv: null,
    company: '',
    job_description: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, cv: file }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('cv', formData.cv);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('job_description', formData.job_description);

      // Make API call
      const response = await axios.post(
        'http://localhost:8000/api/resumes/tailor-resume/',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while tailoring the resume');
    } finally {
      setLoading(false);
    }
  };

  const downloadTailoredResume = () => {
    if (result?.file_path) {
      const downloadUrl = `http://localhost:8000/media/${result.file_path}`;
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Tailor Your Resume</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CV Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Your CV (PDF or TXT)
          </label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Company
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="e.g., Google, Microsoft, Amazon"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            name="job_description"
            value={formData.job_description}
            onChange={handleInputChange}
            placeholder="Paste the full job description here..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.cv || !formData.company || !formData.job_description}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Tailoring Resume...' : 'Tailor Resume'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-6 space-y-4 flex">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">{result.message}</p>
            <p className="text-green-700 text-sm">Company: {result.company}</p>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadTailoredResume}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Download Tailored Resume
          </button>

          {/* Tailored Resume Preview */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tailored Resume Preview:</h3>
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {result.tailored_resume}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailorResumeForm;
