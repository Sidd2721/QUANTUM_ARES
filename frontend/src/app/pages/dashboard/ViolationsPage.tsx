import { ViolationPanel } from "../../../components/panels/ViolationPanel";
import { useOutletContext } from "react-router";
import { DashboardContextType } from "../../../features/scan/ScanDashboard";

export function ViolationsPage() {
  const { fixedViolations } = useOutletContext<DashboardContextType>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Active Violations</h1>
      <div className="max-w-4xl">
        <ViolationPanel fixedViolations={fixedViolations} />
      </div>
    </div>
  );
}
