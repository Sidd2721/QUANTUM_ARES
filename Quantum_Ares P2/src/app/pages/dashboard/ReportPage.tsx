import { ReportViewer } from "../../components/ReportViewer";

export function ReportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Executive Security Report</h1>
      <ReportViewer />
    </div>
  );
}
