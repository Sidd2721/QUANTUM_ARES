import { motion } from "motion/react";
import { Wand2, Loader2, CheckCircle, Code } from "lucide-react";
import { useState } from "react";

interface AutoFixPanelProps {
  onFix: () => void;
}

export function AutoFixPanel({ onFix }: AutoFixPanelProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixedItems, setFixedItems] = useState<string[]>([]);

  const handleAutoFix = async () => {
    setIsFixing(true);
    setFixedItems([]);

    const fixes = [
      "Enabling S3 bucket encryption...",
      "Configuring VPC isolation for RDS...",
      "Updating security group rules...",
      "Enabling MFA on root account...",
      "Applying TLS 1.2+ policy...",
    ];

    for (let i = 0; i < fixes.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFixedItems((prev) => [...prev, fixes[i]]);
    }

    setIsFixing(false);
    onFix();
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
          <Wand2 className="w-6 h-6 text-purple-600" />
          <h3 className="text-gray-800">Automated Remediation</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-900 mb-3">
              AI-powered automatic fixes available for <span className="font-bold">5 critical issues</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAutoFix}
                disabled={isFixing || fixedItems.length > 0}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isFixing || fixedItems.length > 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105"
                }`}
              >
                {isFixing ? (
                  <>
                    <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />
                    Applying Fixes...
                  </>
                ) : fixedItems.length > 0 ? (
                  <>
                    <CheckCircle className="inline-block w-4 h-4 mr-2" />
                    Fixes Applied
                  </>
                ) : (
                  <>
                    <Wand2 className="inline-block w-4 h-4 mr-2" />
                    Apply Automated Fixes
                  </>
                )}
              </button>
            </div>
          </div>

          {fixedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Applied Changes
              </h4>
              {fixedItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> Automated fixes will generate Infrastructure as Code (IaC)
              patches. Review changes before deploying to production.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
