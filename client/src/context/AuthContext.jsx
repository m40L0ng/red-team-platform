import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rt_token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('rt_token');
        localStorage.removeItem('rt_user');
      })
      .finally(() => setLoading(false));
  }, []);

  function login(userData, token) {
    localStorage.setItem('rt_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('rt_token');
    localStorage.removeItem('rt_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
