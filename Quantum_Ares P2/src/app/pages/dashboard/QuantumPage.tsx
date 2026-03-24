import { QuantumPanel } from "../../components/QuantumPanel";

export function QuantumPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quantum Analytics Scan</h1>
      <div className="max-w-4xl">
        <QuantumPanel />
      </div>
    </div>
  );
}
