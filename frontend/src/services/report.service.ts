import apiClient from "./api";
export interface ReportMetadata { sha256_hash: string; signed: boolean; message: string; polygon_tx_hash?: string; }
export const reportService = {
  async generate(scanId: string): Promise<ReportMetadata> { const { data } = await apiClient.post<ReportMetadata>(`/api/v1/reports/${scanId}/generate`); return data; },
  async download(scanId: string): Promise<void> {
    const { data } = await apiClient.get(`/api/v1/reports/${scanId}`, { responseType: "blob" });
    const url  = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `quantum_ares_report_${scanId.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
