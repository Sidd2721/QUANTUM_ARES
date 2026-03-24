import { motion } from "motion/react";
import { Brain, Sparkles, TrendingUp } from "lucide-react";

const aiInsights = [
  {
    type: "critical",
    title: "Attack Surface Analysis",
    content:
      "Your S3 bucket and RDS database are both publicly exposed, creating a high-risk attack vector. This combination increases breach probability by 340%.",
    confidence: 94,
  },
  {
    type: "recommendation",
    title: "Immediate Action Required",
    content:
      "Enable encryption at rest for all storage services. Implement VPC isolation for the database. These two changes will increase your security score by approximately 28 points.",
    confidence: 89,
  },
  {
    type: "insight",
    title: "Lateral Movement Risk",
    content:
      "Detected overly permissive IAM roles that could enable lateral movement. An attacker gaining access to one service could compromise 67% of your infrastructure.",
    confidence: 91,
  },
  {
    type: "prediction",
    title: "Compliance Impact",
    content:
      "Current violations will likely result in SOC 2 audit failure. Estimated remediation time: 4-6 hours with automated fixes enabled.",
    confidence: 87,
  },
];

export function AIOpinionPanel() {
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-purple-600" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-purple-400 rounded-full blur-md"
            />
          </div>
          <h3 className="text-gray-800">AI Security Analysis</h3>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>
      </div>

      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {aiInsights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative group"
          >
            <div
              className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg"
              style={{
                background: "rgba(255,255,255,0.5)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800">{insight.title}</h4>
                <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {insight.confidence}% confident
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{insight.content}</p>

              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI Recommendation</span>
          </div>
          <p className="text-sm text-purple-800">
            Prioritize fixing the S3 encryption and database access issues. These account for 65%
            of your current risk exposure.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
