import { ComplianceRadar } from "../../../components/panels/ComplianceRadar";

export function CompliancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Compliance Radar</h1>
      <div className="max-w-4xl">
        <ComplianceRadar />
      </div>
    </div>
  );
}
