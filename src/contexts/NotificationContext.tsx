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
    message: string,
    type: NotificationType = 'info',
    duration: number = 4000
  ) => {
    setNotification({
      open: true,
      message,
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