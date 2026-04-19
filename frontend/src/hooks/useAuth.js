import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fsds_user')); } catch { return null; }
  });

  const login = useCallback(async (username, password, totpCode = '') => {
    const payload = { username, password };
    if (totpCode) payload.totp_code = totpCode;
    const res = await api.post('/auth/login', payload);
    if (res.data.requires_2fa) return { requires2fa: true };
    localStorage.setItem('fsds_token', res.data.access_token);
    localStorage.setItem('fsds_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('fsds_token');
    localStorage.removeItem('fsds_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    localStorage.setItem('fsds_user', JSON.stringify(res.data));
    setUser(res.data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
