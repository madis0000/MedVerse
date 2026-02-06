import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import type { Notification } from '@/types';

export function useNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    const socket = io(window.location.origin, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Notifications] WebSocket connected');
    });

    socket.on('notification', (notification: Notification) => {
      addNotification(notification);
    });

    socket.on('notifications:initial', (notifications: Notification[]) => {
      setNotifications(notifications);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Notifications] WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Notifications] WebSocket connection error:', error.message);
    });

    return () => {
      socket.off('connect');
      socket.off('notification');
      socket.off('notifications:initial');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, addNotification, setNotifications]);

  return socketRef;
}
