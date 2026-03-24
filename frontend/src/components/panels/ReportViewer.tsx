import { motion } from "motion/react";
import { FileText, Download, Share2, Loader2 } from "lucide-react";
import { useState } from "react";
import { generateAndDownloadReport } from "../../lib/api";

export function ReportViewer({ scanId }: { scanId: string | null }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!scanId) {
      alert("Please upload an architecture scan first.");
      return;
    }
    setDownloading(true);
    try {
      await generateAndDownloadReport(scanId);
    } catch (e) {
      console.error(e);
      alert("Failed to download PDF report");
    } finally {
      setDownloading(false);
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
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-gray-800">Executive Report</h3>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleDownload} disabled={downloading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {downloading ? <Loader2 className="w-4 h-4 text-gray-600 animate-spin" /> : <Download className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Executive Summary</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Security assessment completed for infrastructure deployment on March 22, 2026.
            Analysis identified 3 critical vulnerabilities requiring immediate attention.
            Overall security posture improved from 42/100 to 78/100 following automated
            remediation.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 mb-3">Key Findings</h4>
          <div className="space-y-2">
            {[
              "Unencrypted data at rest in production S3 bucket",
              "Database exposed to public internet (0.0.0.0/0)",
              "Missing multi-factor authentication on privileged accounts",
              "Overly permissive security group configurations",
              "Outdated TLS versions in load balancer",
            ].map((finding, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span className="text-gray-700">{finding}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 mb-3">Remediation Actions</h4>
          <div className="space-y-2">
            {[
              "Enabled AES-256 encryption for all S3 buckets",
              "Configured VPC isolation for RDS instances",
              "Implemented least-privilege IAM policies",
              "Updated security groups to restrict access",
              "Enforced TLS 1.2+ across all endpoints",
            ].map((action, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Compliance Status</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-600 mb-1">PASSED</div>
              <div className="text-sm font-medium text-green-900">ISO 27001</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-600 mb-1">PASSED</div>
              <div className="text-sm font-medium text-green-900">PCI-DSS</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-600 mb-1">PARTIAL</div>
              <div className="text-sm font-medium text-yellow-900">SOC 2</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-600 mb-1">PARTIAL</div>
              <div className="text-sm font-medium text-yellow-900">GDPR</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
