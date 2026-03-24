import { AIOpinionPanel } from "../../components/AIOpinionPanel";

export function AIOpinionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Security Insights</h1>
      <div className="max-w-4xl">
        <AIOpinionPanel />
      </div>
    </div>
  );
}
