import { AutoFixPanel } from "../../components/AutoFixPanel";
import { useOutletContext } from "react-router";
import { DashboardContextType } from "../../layouts/DashboardLayout";

export function AutoFixPage() {
  const { handleAutoFix } = useOutletContext<DashboardContextType>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Automated Remediation</h1>
      <div className="max-w-xl">
        <AutoFixPanel onFix={handleAutoFix} />
      </div>
    </div>
  );
}
