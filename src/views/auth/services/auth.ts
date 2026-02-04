import { LoginDto, RegisterRequest, AuthResponse } from '@/views/auth/types';
import Cookies from 'js-cookie';

const API_URL = '/api/proxy';

export const authService = {
  async login(data: LoginDto): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Ошибка входа. Проверьте данные.');
    
    const json = await res.json();
    this.saveTokens(json.access_token, json.refresh_token);
    return json;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Registration error details:', errorData);
      
      if (res.status === 409) throw new Error('Email или домен уже заняты');
      throw new Error(errorData.message || 'Ошибка регистрации');
    }

    const json = await res.json();
    this.saveTokens(json.access_token, json.refresh_token);
    return json;
  },

  saveTokens(access: string, refresh: string) {
    Cookies.set('accessToken', access, { expires: 1 });
    Cookies.set('refreshToken', refresh, { expires: 7 });
  },

  logout() {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    window.location.href = '/auth';
  }
};