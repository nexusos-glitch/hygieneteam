import { useState } from 'react';

export function useNotifications() {
  return {
    notifications: [],
    markAsRead: () => {},
    markAllAsRead: () => {},
    unreadCount: 0
  };
}
