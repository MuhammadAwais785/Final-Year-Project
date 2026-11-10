import React, { createContext, useContext, useState } from 'react';
import { login as loginRequest, register as registerRequest } from '../api/auth';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [guardian, setGuardian] = useState(null);
  const login = async (data) => {
    const response = await loginRequest(data);
    setAuthToken(response.data.token);
    setGuardian(response.data.guardian);
  };
  const register = async (data) => {
    const response = await registerRequest(data);
    setAuthToken(response.data.token);
    setGuardian(response.data.guardian);
  };
  const logout = () => { setAuthToken(null); setGuardian(null); };
  return <AuthContext.Provider value={{ guardian, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
