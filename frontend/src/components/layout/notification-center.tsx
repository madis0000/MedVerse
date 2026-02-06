import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/stores/notification-store';
import { useNotifications as useNotificationsApi, useMarkAsRead, useMarkAllAsRead } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  FlaskConical,
  FileText,
  DollarSign,
  AlertCircle,
  User,
} from 'lucide-react';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, any> = {
  APPOINTMENT: Calendar,
  LAB: FlaskConical,
  DOCUMENT: FileText,
  BILLING: DollarSign,
  ALERT: AlertCircle,
  USER: User,
};

const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  LAB: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  DOCUMENT: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  BILLING: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  ALERT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  USER: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEntityPath(referenceType?: string, referenceId?: string): string | null {
  if (!referenceType || !referenceId) return null;

  const routes: Record<string, string> = {
    APPOINTMENT: `/appointments/${referenceId}`,
    PATIENT: `/patients/${referenceId}`,
    LAB_ORDER: `/laboratory/${referenceId}`,
    INVOICE: `/billing/${referenceId}`,
    DOCUMENT: `/documents`,
    CONSULTATION: `/consultations/${referenceId}`,
  };

  return routes[referenceType] || null;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications: storeNotifications, unreadCount: storeUnreadCount, markAsRead: localMarkAsRead, markAllAsRead: localMarkAllAsRead, setNotifications } = useNotificationStore();
  const { data: notificationsData } = useNotificationsApi();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Sync API data into store
  useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data);
    }
  }, [notificationsData, setNotifications]);

  const notifications = storeNotifications;
  const unreadCount = storeUnreadCount;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      localMarkAsRead(notification.id);
      markAsRead.mutate(notification.id);
    }

    const path = getEntityPath(notification.referenceType, notification.referenceId);
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    localMarkAllAsRead();
    markAllAsRead.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-card border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 20).map((notification, index) => {
                  const Icon = TYPE_ICONS[notification.type] || Bell;
                  const iconColor = TYPE_COLORS[notification.type] || TYPE_COLORS.ALERT;

                  return (
                    <div key={notification.id}>
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          'flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                          !notification.isRead && 'bg-primary/5',
                        )}
                      >
                        <div
                          className={cn(
                            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                            iconColor,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm truncate',
                                notification.isRead
                                  ? 'text-foreground'
                                  : 'font-semibold text-foreground',
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </button>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
