// Notification configuration settings
export const NOTIFICATION_CONFIG = {
  // Time windows for deduplication (in minutes)
  DEDUPLICATION_WINDOWS: {
    TOURNAMENT_REMINDER: 60, // 1 hour
    SYSTEM_NOTIFICATION: 60, // 1 hour
    TOURNAMENT_CREATED: 30, // 30 minutes
    ADMIN_NOTIFICATION: 60, // 1 hour
  },

  // Notification intervals for tournament reminders
  TOURNAMENT_REMINDER_INTERVALS: [
    { hours: 24, label: '1 day', type: '1day' },
    { hours: 1, label: '1 hour', type: '1hour' },
    { minutes: 15, label: '15 minutes', type: '15min' },
    { minutes: 5, label: '5 minutes', type: '5min' },
    { minutes: 0, label: 'now', type: 'start' }
  ],

  // Cache cleanup settings
  CACHE_CLEANUP: {
    INTERVAL_HOURS: 24, // Clean up cache every 24 hours
    MAX_CACHE_SIZE: 1000, // Maximum number of cached notifications
  },

  // Socket.IO settings
  SOCKET: {
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    PING_TIMEOUT: 60000,
  },

  // Notification display settings
  DISPLAY: {
    MAX_NOTIFICATIONS_PER_PAGE: 10,
    AUTO_HIDE_DURATION: 5000, // 5 seconds
    MAX_NOTIFICATION_LENGTH: 200, // characters
  },

  // Email notification settings
  EMAIL: {
    ENABLED: true,
    TEMPLATE_PATH: '/templates/notifications/',
    FROM_ADDRESS: 'noreply@wildpoker.com',
  }
};

// Helper function to get deduplication window for a specific notification type
export const getDeduplicationWindow = (type: string): number => {
  switch (type) {
    case 'tournament_reminder':
      return NOTIFICATION_CONFIG.DEDUPLICATION_WINDOWS.TOURNAMENT_REMINDER;
    case 'system':
      return NOTIFICATION_CONFIG.DEDUPLICATION_WINDOWS.SYSTEM_NOTIFICATION;
    case 'tournament_created':
      return NOTIFICATION_CONFIG.DEDUPLICATION_WINDOWS.TOURNAMENT_CREATED;
    case 'admin':
      return NOTIFICATION_CONFIG.DEDUPLICATION_WINDOWS.ADMIN_NOTIFICATION;
    default:
      return 60; // Default 1 hour
  }
};

// Helper function to validate notification data
export const validateNotificationData = (notification: any): boolean => {
  if (!notification) return false;
  if (!notification.type) return false;
  if (!notification.title || notification.title.length === 0) return false;
  if (!notification.body || notification.body.length === 0) return false;
  if (notification.title.length > NOTIFICATION_CONFIG.DISPLAY.MAX_NOTIFICATION_LENGTH) return false;
  if (notification.body.length > NOTIFICATION_CONFIG.DISPLAY.MAX_NOTIFICATION_LENGTH) return false;
  
  return true;
};


