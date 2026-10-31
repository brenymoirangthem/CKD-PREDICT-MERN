import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (body) => setUser((await api.post('/auth/login', body)).data);
  const signup = async (body) => setUser((await api.post('/auth/signup', body)).data);
  const logout = async () => { await api.post('/auth/logout'); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}
