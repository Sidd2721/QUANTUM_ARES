import { AutoFixPanel } from "../../../components/panels/AutoFixPanel";
import { useOutletContext } from "react-router";
import { DashboardContextType } from "../../../features/scan/ScanDashboard";

export function AutoFixPage() {
  const { handleAutoFix, scanId } = useOutletContext<DashboardContextType>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Automated Remediation</h1>
      <div className="max-w-xl">
        <AutoFixPanel onFix={handleAutoFix} scanId={scanId} />
      </div>
    </div>
  );
}
