import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("qa_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("qa_token");
      localStorage.removeItem("qa_org_id");
    }
    return Promise.reject(err);
  }
);
export default apiClient;
