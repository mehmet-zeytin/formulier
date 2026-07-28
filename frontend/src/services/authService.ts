import { api } from './api';

export const login = async (email: string, password: string): Promise<string> => {
  const response = await api.post('/auth/login', { email, password });
  const token = response.data.token;
  localStorage.setItem('token', token);
  return token;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};