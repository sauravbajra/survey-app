import { createContext, useState, useContext, type ReactNode } from 'react';
import { api } from '../api/apiClient';

interface AuthContextType {
  token: string | null;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));

  const login = async (username: string, password: string) => {
    const response = await api.login(username, password);
    const newToken = response.data.access_token;
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    return newToken;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
  };

  const value = { token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
