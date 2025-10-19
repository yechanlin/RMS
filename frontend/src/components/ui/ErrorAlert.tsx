import React from 'react';
import { Alert, AlertProps } from '@mantine/core';

interface ErrorAlertProps extends Omit<AlertProps, 'children'> {
  error: string | null;
  onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  error, 
  onClose,
  ...props 
}) => {
  if (!error) return null;

  return (
    <Alert
      color="red"
      withCloseButton={!!onClose}
      onClose={onClose}
      {...props}
    >
      {error}
    </Alert>
  );
};