import { motion } from "motion/react";
import { AlertTriangle, Shield, CheckCircle, XCircle, Filter } from "lucide-react";
import { useState } from "react";

interface Violation {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  resource: string;
  description: string;
  fixed?: boolean;
}

const mockViolations: Violation[] = [
  {
    id: "1",
    title: "Unencrypted S3 Bucket",
    severity: "critical",
    resource: "s3://prod-data-bucket",
    description: "S3 bucket does not have server-side encryption enabled",
  },
  {
    id: "2",
    title: "Public Database Access",
    severity: "critical",
    resource: "rds://user-db-prod",
    description: "Database is publicly accessible from 0.0.0.0/0",
  },
  {
    id: "3",
    title: "Missing MFA on Root Account",
    severity: "high",
    resource: "iam://root",
    description: "Root account does not have MFA enabled",
  },
  {
    id: "4",
    title: "Overly Permissive Security Group",
    severity: "high",
    resource: "sg-0a1b2c3d4e5f",
    description: "Security group allows SSH (22) from 0.0.0.0/0",
  },
  {
    id: "5",
    title: "Outdated TLS Version",
    severity: "medium",
    resource: "alb://api-gateway",
    description: "Load balancer accepts TLS 1.0 connections",
  },
  {
    id: "6",
    title: "No Logging Enabled",
    severity: "medium",
    resource: "lambda://payment-processor",
    description: "CloudWatch logs not configured",
  },
  {
    id: "7",
    title: "Missing Resource Tags",
    severity: "low",
    resource: "ec2://i-1234567890",
    description: "Instance missing required compliance tags",
  },
];

export function ViolationPanel({ fixedViolations = [] }: { fixedViolations?: string[] }) {
  const [filter, setFilter] = useState<string>("all");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const filteredViolations = mockViolations
    .map(v => ({ ...v, fixed: fixedViolations.includes(v.id) }))
    .filter((v) => {
      if (filter === "all") return true;
      if (filter === "fixed") return v.fixed;
      return v.severity === filter;
    });

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-gray-800">Security Violations</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 text-sm">
          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
            {mockViolations.filter((v) => v.severity === "critical" && !fixedViolations.includes(v.id)).length} Critical
          </div>
          <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
            {mockViolations.filter((v) => v.severity === "high" && !fixedViolations.includes(v.id)).length} High
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
            {fixedViolations.length} Fixed
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredViolations.map((violation, index) => (
          <motion.div
            key={violation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300 ${
              violation.fixed ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs border ${getSeverityColor(
                      violation.severity
                    )}`}
                  >
                    {violation.severity.toUpperCase()}
                  </span>
                  {violation.fixed && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <h4 className="font-medium text-gray-800 mb-1">{violation.title}</h4>
                <p className="text-sm text-gray-600 mb-1">{violation.description}</p>
                <p className="text-xs text-gray-500 font-mono">{violation.resource}</p>
              </div>
              {!violation.fixed ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
