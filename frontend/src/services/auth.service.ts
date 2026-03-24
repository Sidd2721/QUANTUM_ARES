import apiClient from "./api";
export interface LoginResponse { access_token: string; token_type: string; expires_in: number; }
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/api/v1/auth/login", { email, password });
    localStorage.setItem("qa_token", data.access_token);
    return data;
  },
  logout(): void {
    localStorage.removeItem("qa_token");
    localStorage.removeItem("qa_org_id");
  },
  getToken(): string | null { return localStorage.getItem("qa_token"); },
  isAuthenticated(): boolean { return !!localStorage.getItem("qa_token"); },
};
