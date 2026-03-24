import { useState } from "react";
import { authService } from "../services/auth.service";
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [token, setToken] = useState(authService.getToken());
  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setToken(result.access_token);
    setIsAuthenticated(true);
    return result;
  };
  const logout = () => {
    authService.logout();
    setToken(null);
    setIsAuthenticated(false);
  };
  return { isAuthenticated, token, login, logout };
}
