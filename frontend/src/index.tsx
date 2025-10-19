import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MantineProvider 
      defaultColorScheme="dark"
      theme={{
        colors: {
          // Custom colors matching the existing theme
          dark: [
            '#C1C2C5',
            '#A6A7AB',
            '#909296',
            '#5c5f66',
            '#373A40',
            '#2C2E33',
            '#25262b',
            '#1A1B1E',
            '#141517',
            '#101113',
          ],
        },
        primaryColor: 'blue',
      }}
    >
      <ModalsProvider>
        <Notifications />
        <App />
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);