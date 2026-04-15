import { api } from './api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Unwrap the backend success_response envelope.
 * Backend returns `{ success: true, data: <payload> }` via success_response().
 * api.get already strips the axios response to `.data`, so we receive the envelope.
 */
function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'success' in response) {
    return (response as Record<string, any>).data as T;
  }
  return response as T;
}

export async function getNotifications(unreadOnly: boolean = false, limit: number = 50): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (unreadOnly) params.set('unread_only', 'true');
  params.set('limit', String(limit));
  const response = await api.get<any>(`/notifications/?${params.toString()}`);
  return unwrap<NotificationsResponse>(response);
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get<any>('/notifications/unread-count');
  const data = unwrap<UnreadCountResponse>(response);
  return data.unread_count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const response = await api.put<any>(`/notifications/${notificationId}/read`);
  return unwrap<void>(response);
}

export async function markAllRead(): Promise<void> {
  const response = await api.put<any>('/notifications/mark-all-read');
  return unwrap<void>(response);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await api.delete<any>(`/notifications/${notificationId}`);
  return unwrap<void>(response);
}

export async function getNotificationPreferences(): Promise<any[]> {
  const response = await api.get<any>('/notifications/preferences');
  return unwrap<any[]>(response);
}

export async function updateNotificationPreferences(preferences: any[]): Promise<void> {
  const response = await api.put<any>('/notifications/preferences', preferences);
  return unwrap<void>(response);
}
