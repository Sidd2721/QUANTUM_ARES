import apiClient from "./api";
export interface ChatResponse { answer: string; tier: "rule_engine" | "semantic" | "error"; source?: string; match_score?: number; sources?: Array<{ doc_id: string; title: string; passage: string; source: string }>; }
export const chatService = {
  async ask(question: string): Promise<ChatResponse> { const { data } = await apiClient.post<ChatResponse>("/api/v1/chat", { question }); return data; },
};
