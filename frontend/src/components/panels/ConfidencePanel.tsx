import { motion } from "motion/react";
import { AlertCircle, TrendingUp } from "lucide-react";

export function ConfidencePanel({ confidence = 94 }: { confidence?: number }) {
  const isLowConfidence = confidence < 80;

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
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-gray-800">Analysis Confidence</h3>
        </div>

        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              confidence >= 90
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : confidence >= 80
                ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                : "bg-gradient-to-r from-yellow-500 to-orange-600"
            }`}
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600">Confidence Score</span>
          <span className="text-2xl font-bold text-gray-800">{confidence}%</span>
        </div>

        {isLowConfidence && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Lower Confidence Detected</h4>
              <p className="text-sm text-yellow-800">
                Some infrastructure components lack sufficient metadata. Consider adding
                resource tags and documentation for improved analysis accuracy.
              </p>
            </div>
          </motion.div>
        )}

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Infrastructure Coverage</span>
            <span className="font-medium text-gray-800">98%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Policy Accuracy</span>
            <span className="font-medium text-gray-800">96%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Threat Intelligence</span>
            <span className="font-medium text-gray-800">92%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
