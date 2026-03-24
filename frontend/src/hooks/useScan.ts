import { useState, useCallback } from "react";
import { scanService } from "../services/scan.service";
import type { ScanResult } from "../types/api.types";
export function useScan() {
  const [scan, setScan]           = useState<ScanResult | null>(null);
  const [scanId, setScanId]       = useState<string | null>(null);
  const [isScanning, setScanning] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const startScan = useCallback(async (file: File, evidenceSource = "json") => {
    setScanning(true); setError(null); setScan(null);
    try {
      const { scan_id } = await scanService.uploadFile(file, evidenceSource);
      setScanId(scan_id); return scan_id;
    } catch (e: any) {
      setError(e.message || "Upload failed"); setScanning(false);
    }
  }, []);
  const onScanComplete = useCallback((fullScan: ScanResult) => { setScan(fullScan); setScanning(false); }, []);
  const reset = useCallback(() => { setScan(null); setScanId(null); setScanning(false); setError(null); }, []);
  return { scan, scanId, isScanning, error, startScan, onScanComplete, reset };
}
