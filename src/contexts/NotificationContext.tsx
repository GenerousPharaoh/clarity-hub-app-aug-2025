import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert, Snackbar, SnackbarCloseReason } from '@mui/material';

interface NotificationContextProps {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  hideNotification: () => void;
}

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationState {
  open: boolean;
  message: string;
  type: NotificationType;
  duration: number;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    type: 'info',
    duration: 4000,
  });

  const showNotification = (
    message: string | any,
    type: NotificationType = 'info',
    duration: number = 4000
  ) => {
    // Ensure message is always a string to prevent objects being rendered as children
    const messageText = typeof message === 'string' 
      ? message 
      : typeof message === 'object' && message?.message 
      ? String(message.message)
      : String(message);
    
    setNotification({
      open: true,
      message: messageText,
      type,
      duration,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    hideNotification();
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => hideNotification()}
          severity={notification.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 