/**
 * Authentication service
 */

import api from './api';
import { ENDPOINTS, STORES, TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY } from '../utils/constants';
import type { AuthCredentials, RegisterData, AuthResponse, User } from '../types/auth';
import { db } from '../database/indexedDB';

interface LocalAuthUser extends User {
  passwordHash: string;
}

const buildOfflineToken = (user: User) => `offline-${user.id}-${Date.now()}`;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const hashPassword = async (password: string): Promise<string> => {
  if (globalThis.crypto?.subtle) {
    const encoded = new TextEncoder().encode(password);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    return toHex(new Uint8Array(digest));
  }

  return btoa(password);
};

const isNetworkFailure = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return !(error as { response?: unknown }).response;
};

const persistSession = (user: User, token: string, refreshToken?: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const saveLocalUser = async (user: User, password: string): Promise<void> => {
  const passwordHash = await hashPassword(password);
  const localUser: LocalAuthUser = {
    ...user,
    passwordHash,
  };

  await db.put(STORES.USERS, localUser);
};

const getLocalUserByEmail = async (email: string): Promise<LocalAuthUser | undefined> => {
  const localUsers = await db.getAll<LocalAuthUser>(STORES.USERS);
  return localUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

const buildResponse = (user: User, message: string, token = buildOfflineToken(user)): AuthResponse => ({
  success: true,
  token,
  refreshToken: token,
  user,
  message,
});

export const authService = {
  /**
   * Login user
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(ENDPOINTS.LOGIN, credentials);
      const { token, refreshToken, user } = response.data;

      // Store token and user
      persistSession(user, token, refreshToken);
      await saveLocalUser(user, credentials.password);

      return response.data;
    } catch (error) {
      if (!isNetworkFailure(error)) {
        throw error;
      }

      const localUser = await getLocalUserByEmail(credentials.email);

      if (!localUser) {
        throw new Error('No offline account found for this email. Connect once to sign in online or register locally.');
      }

      const passwordHash = await hashPassword(credentials.password);

      if (localUser.passwordHash !== passwordHash) {
        throw new Error('Invalid offline credentials');
      }

      const { passwordHash: _passwordHash, ...user } = localUser;
      const offlineResponse = buildResponse(user, 'Logged in offline');
      persistSession(user, offlineResponse.token);
      return offlineResponse;
    }
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.post<AuthResponse>(ENDPOINTS.REGISTER, registerData);
      const { token, refreshToken, user } = response.data;

      // Store token and user
      persistSession(user, token, refreshToken);
      await saveLocalUser(user, registerData.password);

      return response.data;
    } catch (error) {
      if (!isNetworkFailure(error)) {
        throw error;
      }

      const existingUser = await getLocalUserByEmail(data.email);

      if (existingUser) {
        throw new Error('An offline account already exists for this email. Use login instead.');
      }

      const user: User = {
        id: `offline-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveLocalUser(user, data.password);
      const offlineResponse = buildResponse(user, 'Registered offline');
      persistSession(user, offlineResponse.token);
      return offlineResponse;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post(ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      // Clear IndexedDB
      await db.clear('patients');
      await db.clear('appointments');
      await db.clear('medicalRecords');
      await db.clear('prescriptions');
    }
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
