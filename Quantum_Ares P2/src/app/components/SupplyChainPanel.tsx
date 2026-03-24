import { motion } from "motion/react";
import { Package, AlertTriangle } from "lucide-react";

const cveData = [
  {
    id: "CVE-2024-1234",
    package: "log4j",
    version: "2.14.0",
    severity: "critical",
    cvss: 9.8,
    description: "Remote code execution vulnerability",
  },
  {
    id: "CVE-2024-5678",
    package: "openssl",
    version: "1.1.1k",
    severity: "high",
    cvss: 7.5,
    description: "Memory corruption in TLS handshake",
  },
  {
    id: "CVE-2024-9012",
    package: "axios",
    version: "0.21.1",
    severity: "medium",
    cvss: 5.3,
    description: "Server-side request forgery (SSRF)",
  },
];

export function SupplyChainPanel() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-purple-600" />
          <h3 className="text-gray-800">Supply Chain Vulnerabilities</h3>
        </div>

        <div className="space-y-3">
          {cveData.map((cve, index) => (
            <motion.div
              key={cve.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-all duration-300 hover:shadow-lg"
              style={{ background: "rgba(255,255,255,0.5)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-mono text-sm font-medium text-gray-800">{cve.id}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs border ${getSeverityColor(cve.severity)}`}
                >
                  {cve.severity.toUpperCase()}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">{cve.description}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-mono">
                  {cve.package}@{cve.version}
                </span>
                <span className="font-medium">CVSS: {cve.cvss}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-900">
            <strong>Recommendation:</strong> Update dependencies to latest secure versions.
            Automated patch available.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
