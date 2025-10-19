import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Stack,
  Group,
  FileInput,
  TextInput,
  Textarea,
  Button,
  Alert,
  Box,
  Text,
  Code,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { FaUpload, FaExclamationTriangle, FaCheck, FaDownload, FaEye } from 'react-icons/fa';
import axios from 'axios';

const TailorResumeForm = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const form = useForm({
    initialValues: {
      cv: null,
      company: '',
      job_description: ''
    },
    validate: {
      cv: (value) => (value ? null : 'Please upload your CV'),
      company: (value) => (value ? null : 'Please enter company name'),
      job_description: (value) => (value ? null : 'Please enter job description'),
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('cv', values.cv);
      formDataToSend.append('company', values.company);
      formDataToSend.append('job_description', values.job_description);

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
      notifications.show({
        title: 'Success!',
        message: 'Resume tailored successfully',
        color: 'green',
        icon: <FaCheck size={16} />,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An error occurred while tailoring the resume';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <FaExclamationTriangle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTailoredResume = () => {
    if (result?.file_path) {
      const downloadUrl = `http://localhost:8000/media/${result.file_path}`;
      window.open(downloadUrl, '_blank');
      notifications.show({
        title: 'Download Started',
        message: 'Your tailored resume is being downloaded',
        color: 'blue',
        icon: <FaDownload size={16} />,
      });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Paper radius="lg" p="xl" withBorder>
        <Title order={2} ta="center" mb="xl" c="blue">
          Tailor Your Resume
        </Title>
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            {/* CV Upload */}
            <Box>
              <FileInput
                label="Upload Your CV"
                placeholder="Choose PDF, DOC, DOCX, or TXT file"
                accept=".pdf,.doc,.docx,.txt"
                leftSection={<FaUpload size={16} />}
                required
                {...form.getInputProps('cv')}
              />
              <Text size="xs" c="dimmed" mt="xs">
                Supported formats: PDF, DOC, DOCX, TXT
              </Text>
            </Box>

            {/* Company Name */}
            <TextInput
              label="Target Company"
              placeholder="e.g., Google, Microsoft, Amazon"
              required
              {...form.getInputProps('company')}
            />

            {/* Job Description */}
            <Textarea
              label="Job Description"
              placeholder="Paste the full job description here..."
              minRows={8}
              required
              {...form.getInputProps('job_description')}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!form.isValid()}
              fullWidth
              leftSection={loading ? null : <FaUpload size={18} />}
            >
              {loading ? 'Tailoring Resume...' : 'Tailor Resume'}
            </Button>
          </Stack>
        </form>

        {/* Error Display */}
        {error && (
          <Alert
            icon={<FaExclamationTriangle size={16} />}
            color="red"
            mt="lg"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {/* Result Display */}
        {result && (
          <Box mt="xl">
            <Stack gap="md">
              <Alert
                icon={<FaCheck size={16} />}
                color="green"
                variant="filled"
              >
                <Text fw={500}>{result.message}</Text>
                <Text size="sm">Company: {result.company}</Text>
              </Alert>

              {/* Action Buttons */}
              <Group>
                <Button
                  leftSection={<FaDownload size={16} />}
                  onClick={downloadTailoredResume}
                  color="green"
                >
                  Download Tailored Resume
                </Button>
                <Button
                  leftSection={<FaEye size={16} />}
                  variant="outline"
                  onClick={() => {
                    if (result?.file_path) {
                      const previewUrl = `http://localhost:8000/media/${result.file_path}`;
                      window.open(previewUrl, '_blank');
                    }
                  }}
                >
                  Preview
                </Button>
              </Group>

              {/* Tailored Resume Preview */}
              <Box>
                <Title order={4} mb="sm">Tailored Resume Preview:</Title>
                <Paper
                  p="md"
                  withBorder
                  style={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                  }}
                >
                  <Code
                    block
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    {result.tailored_resume}
                  </Code>
                </Paper>
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TailorResumeForm;
