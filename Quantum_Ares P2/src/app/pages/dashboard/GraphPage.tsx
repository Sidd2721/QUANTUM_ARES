import { GraphView } from "../../components/GraphView";

export function GraphPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Network Graph</h1>
      <GraphView />
    </div>
  );
}
