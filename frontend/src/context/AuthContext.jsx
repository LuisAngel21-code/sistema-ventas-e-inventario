import { createContext, useContext, useState, useEffect } from 'react';

const CREDENTIALS = { username: 'admin', password: 'Cams2024' };
const AUTH_KEY = 'muebleria_cams_auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setUser(data.user);
        setToken(data.token);
      } catch { localStorage.removeItem(AUTH_KEY); }
    }
    setLoading(false);
  }, []);

  function login(username, password) {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      const tk = btoa(`${username}:${password}`);
      const userData = { username, role: 'admin' };
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: userData, token: tk }));
      setUser(userData);
      setToken(tk);
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
