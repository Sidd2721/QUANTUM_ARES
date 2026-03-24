import { SupplyChainPanel } from "../../components/SupplyChainPanel";

export function SupplyChainPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Supply Chain Tracking</h1>
      <div className="max-w-xl">
        <SupplyChainPanel />
      </div>
    </div>
  );
}
