import { ScoreDashboard } from "../../../components/panels/ScoreDashboard";
import { useOutletContext } from "react-router";
import { DashboardContextType } from "../../../features/scan/ScanDashboard";

export function ScorePage() {
  const { securityScore } = useOutletContext<DashboardContextType>();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Score Overview</h1>
      <div className="max-w-xl">
        <ScoreDashboard score={securityScore} />
      </div>
    </div>
  );
}
