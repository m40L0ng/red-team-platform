import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rt_user');
    return stored ? JSON.parse(stored) : null;
  });

  function login(userData, token) {
    localStorage.setItem('rt_user', JSON.stringify(userData));
    localStorage.setItem('rt_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('rt_user');
    localStorage.removeItem('rt_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
