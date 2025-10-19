import React from 'react';
import { Button, ButtonProps } from '@mantine/core';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading = false, 
  children, 
  disabled,
  ...props 
}) => {
  return (
    <Button 
      loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Button>
  );
};