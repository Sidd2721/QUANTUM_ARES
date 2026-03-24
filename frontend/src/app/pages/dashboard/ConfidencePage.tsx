import { ConfidencePanel } from "../../../components/panels/ConfidencePanel";

export function ConfidencePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Confidence Scoring</h1>
      <div className="max-w-xl">
        <ConfidencePanel />
      </div>
    </div>
  );
}
