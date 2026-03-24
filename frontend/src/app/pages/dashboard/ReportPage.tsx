import { ReportViewer } from "../../../components/panels/ReportViewer";
import { useOutletContext } from "react-router";
import { DashboardContextType } from "../../../features/scan/ScanDashboard";

export function ReportPage() {
  const { scanId } = useOutletContext<DashboardContextType>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Security Report</h1>
      <ReportViewer scanId={scanId} />
    </div>
  );
}
