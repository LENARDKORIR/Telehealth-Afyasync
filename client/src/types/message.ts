export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  senderName?: string | null;
  recipientName?: string | null;
}

export interface MessageContact {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  subtitle?: string;
}
