import { createContext, useContext, useState, useEffect } from 'react';

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

  async function login(username, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) return false;

      localStorage.setItem(AUTH_KEY, JSON.stringify({
        user: data.user,
        token: data.token,
      }));
      setUser(data.user);
      setToken(data.token);
      return true;
    } catch (err) {
      console.error('Error de login:', err);
      return false;
    }
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
