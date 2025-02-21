'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationProps } from '../contracts/types';

interface NotificationContextType {
  notification: NotificationProps | null;
  showNotification: (message: string, type: 'error' | 'success' | 'info') => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const showNotification = (message: string, type: 'error' | 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}