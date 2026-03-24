import apiClient from "./api";
import type { ScanResult, ScanStatus } from "../types/api.types";
export const scanService = {
  async uploadFile(file: File, evidenceSource = "json"): Promise<{ scan_id: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("name", file.name.replace(".json", ""));
    form.append("evidence_source", evidenceSource);
    const { data } = await apiClient.post("/api/v1/validate", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data;
  },
  async getStatus(scanId: string): Promise<ScanStatus> { const { data } = await apiClient.get(`/api/v1/scans/${scanId}/status`); return data; },
  async getResult(scanId: string): Promise<ScanResult> { const { data } = await apiClient.get(`/api/v1/scans/${scanId}`); return data; },
  async listScans(page = 1, limit = 20): Promise<{ scans: ScanResult[] }> { const { data } = await apiClient.get("/api/v1/scans", { params: { page, limit } }); return data; },
  async getPatches(scanId: string) { const { data } = await apiClient.get(`/api/v1/scans/${scanId}/patches`); return data; },
  downloadPatches(scanId: string): void { window.open(`/api/v1/scans/${scanId}/patches?format=download`, "_blank"); },
  async getOpinion(scanId: string) { const { data } = await apiClient.get(`/api/v1/scans/${scanId}/opinion`); return data; },
};
