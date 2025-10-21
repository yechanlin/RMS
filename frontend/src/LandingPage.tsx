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

// Create typed wrapper components for icons that return JSX.Element
const ExclamationIcon = ({ size }: { size: number }): JSX.Element => {
  const IconComponent = FaExclamationTriangle as any;
  return React.createElement(IconComponent, { size });
};

const GoogleIcon = ({ size }: { size: number }): JSX.Element => {
  const IconComponent = FaGoogle as any;
  return React.createElement(IconComponent, { size });
};

const GitHubIcon = ({ size }: { size: number }): JSX.Element => {
  const IconComponent = FaGithub as any;
  return React.createElement(IconComponent, { size });
};

interface SocialButtonProps {
  icon: ({ size }: { size: number }) => JSX.Element;
  text: string;
  onClick: () => void;
  color: string;
}

interface LandingPageProps {
  onLogin: (email: string, password: string, isRegistering: boolean) => void;
}

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon: Icon, text, onClick, color }) => {
  return (
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
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const form = useForm<FormValues>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => 
        value.length < 8 && isRegistering ? 'Password must be at least 8 characters long' : null,
      confirmPassword: (value: string, values: FormValues) =>
        isRegistering && value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = (values: FormValues): void => {
    if (!values.email || !values.password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError('');
    onLogin(values.email, values.password, isRegistering);
  };

  const handleGoogleAuth = (): void => {
    // Implement Google OAuth
  };

  const handleGitHubAuth = (): void => {
    // Implement GitHub OAuth
  };

  const toggleRegistrationMode = (): void => {
    setIsRegistering(!isRegistering);
    setError('');
    form.reset();
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e293b 75%, #111827 100%)',
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
                GRIMS
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
                  icon={<ExclamationIcon size={16} />}
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
              icon={GoogleIcon}
              text="Google"
              onClick={handleGoogleAuth}
              color="red"
            />
            <SocialButton
              icon={GitHubIcon}
              text="GitHub"
              onClick={handleGitHubAuth}
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
                onClick={toggleRegistrationMode}
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
};

export default LandingPage;