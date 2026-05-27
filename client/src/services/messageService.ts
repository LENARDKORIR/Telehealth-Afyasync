import api from './api';
import { ENDPOINTS } from '../utils/constants';
import type { Message } from '../types/message';

export const messageService = {
  async getThread(otherUserId: string): Promise<Message[]> {
    const response = await api.get<{ data: Message[] }>(ENDPOINTS.MESSAGES_THREAD(otherUserId));
    return response.data.data || [];
  },

  async getUnreadMessages(): Promise<Message[]> {
    const response = await api.get<{ data: Message[] }>(ENDPOINTS.MESSAGES_UNREAD);
    return response.data.data || [];
  },

  async sendMessage(payload: { recipientId: string; subject: string; body: string }): Promise<Message> {
    const response = await api.post<{ data: Message }>(ENDPOINTS.MESSAGES, payload);
    return response.data.data;
  },
};
