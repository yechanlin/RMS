import React, { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Divider,
  Alert,
  Box,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { FaGoogle, FaGithub, FaExclamationTriangle } from 'react-icons/fa';

const SocialButton = ({ icon: Icon, text, onClick, color }) => (
  <Button
    variant="default"
    fullWidth
    leftSection={<Icon size={18} />}
    onClick={onClick}
    styles={{
      root: {
        backgroundColor: 'var(--mantine-color-dark-6)',
        border: '1px solid var(--mantine-color-dark-4)',
        '&:hover': {
          backgroundColor: color === 'red' ? 'var(--mantine-color-red-9)' : 'var(--mantine-color-dark-5)',
        },
      },
    }}
  >
    Continue with {text}
  </Button>
);

export default function LandingPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => 
        value.length < 8 && isRegistering ? 'Password must be at least 8 characters long' : null,
      confirmPassword: (value, values) =>
        isRegistering && value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = (values) => {
    if (!values.email || !values.password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError('');
    onLogin(values.email, values.password, isRegistering);
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #1e293b 0%, #0a2540 50%, #2563eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container size="xs" px="md">
        <Paper
          radius="lg"
          p="xl"
          withBorder
          style={{
            backgroundColor: 'var(--mantine-color-dark-6)',
            border: '1px solid var(--mantine-color-blue-9)',
          }}
        >
          <Center mb="lg">
            <Stack align="center" gap="xs">
              <Title 
                order={1} 
                size="2.5rem"
                style={{ 
                  color: 'var(--mantine-color-blue-4)',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                RMS
              </Title>
              <Text 
                size="lg" 
                c="blue.2" 
                ta="center"
              >
                Build your career story visually and easily.
              </Text>
            </Stack>
          </Center>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="you@email.com"
                required
                styles={{
                  input: {
                    backgroundColor: 'var(--mantine-color-dark-7)',
                    border: '1px solid var(--mantine-color-blue-7)',
                    color: 'var(--mantine-color-blue-1)',
                    '&::placeholder': {
                      color: 'var(--mantine-color-blue-4)',
                    },
                    '&:focus': {
                      borderColor: 'var(--mantine-color-blue-5)',
                    },
                  },
                  label: {
                    color: 'var(--mantine-color-blue-2)',
                    fontWeight: 500,
                  },
                }}
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                required
                styles={{
                  input: {
                    backgroundColor: 'var(--mantine-color-dark-7)',
                    border: '1px solid var(--mantine-color-blue-7)',
                    color: 'var(--mantine-color-blue-1)',
                    '&::placeholder': {
                      color: 'var(--mantine-color-blue-4)',
                    },
                    '&:focus': {
                      borderColor: 'var(--mantine-color-blue-5)',
                    },
                  },
                  label: {
                    color: 'var(--mantine-color-blue-2)',
                    fontWeight: 500,
                  },
                }}
                {...form.getInputProps('password')}
              />

              {isRegistering && (
                <PasswordInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  required
                  styles={{
                    input: {
                      backgroundColor: 'var(--mantine-color-dark-7)',
                      border: '1px solid var(--mantine-color-blue-7)',
                      color: 'var(--mantine-color-blue-1)',
                      '&::placeholder': {
                        color: 'var(--mantine-color-blue-4)',
                      },
                      '&:focus': {
                        borderColor: 'var(--mantine-color-blue-5)',
                      },
                    },
                    label: {
                      color: 'var(--mantine-color-blue-2)',
                      fontWeight: 500,
                    },
                  }}
                  {...form.getInputProps('confirmPassword')}
                />
              )}

              {error && (
                <Alert
                  icon={<FaExclamationTriangle size={16} />}
                  color="red"
                  variant="filled"
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                size="md"
                fullWidth
                gradient={{ from: 'blue.6', to: 'blue.5' }}
                variant="gradient"
                style={{
                  fontWeight: 700,
                  fontSize: '1.125rem',
                }}
              >
                {isRegistering ? 'Create Account' : 'Log In with Email'}
              </Button>
            </Stack>
          </form>

          <Divider 
            label="OR" 
            labelPosition="center" 
            my="lg"
            styles={{
              label: {
                color: 'var(--mantine-color-blue-4)',
              },
            }}
          />

          <Stack gap="sm">
            <SocialButton
              icon={FaGoogle}
              text="Google"
              onClick={() => {/* Implement Google OAuth */}}
              color="red"
            />
            <SocialButton
              icon={FaGithub}
              text="GitHub"
              onClick={() => {/* Implement GitHub OAuth */}}
              color="dark"
            />
          </Stack>

          <Center mt="lg">
            <Group gap="xs">
              <Text size="sm" c="blue.3">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  form.reset();
                }}
                style={{
                  color: 'var(--mantine-color-blue-4)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                {isRegistering ? 'Log in' : 'Create one'}
              </Button>
            </Group>
          </Center>
        </Paper>

        <Center mt="lg">
          <Text size="xs" c="blue.4">
            &copy; {new Date().getFullYear()} ResumeBuilder
          </Text>
        </Center>
      </Container>
    </Box>
  );
}
