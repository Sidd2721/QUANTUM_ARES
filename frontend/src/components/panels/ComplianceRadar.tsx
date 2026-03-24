import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const complianceData = [
  { framework: "SOC 2", score: 78, fullMark: 100 },
  { framework: "GDPR", score: 65, fullMark: 100 },
  { framework: "PCI-DSS", score: 82, fullMark: 100 },
  { framework: "HIPAA", score: 71, fullMark: 100 },
  { framework: "ISO 27001", score: 88, fullMark: 100 },
  { framework: "NIST", score: 75, fullMark: 100 },
];

export function ComplianceRadar() {
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
          <Shield className="w-6 h-6 text-green-600" />
          <h3 className="text-gray-800">Compliance Status</h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={complianceData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="framework" tick={{ fill: "#6B7280", fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6B7280", fontSize: 10 }} />
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Radar
              name="Compliance"
              dataKey="score"
              stroke="#3B82F6"
              fill="url(#radarGradient)"
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {complianceData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-white/50 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{item.framework}</span>
                <span className="text-sm font-bold text-gray-900">{item.score}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    item.score >= 80
                      ? "bg-gradient-to-r from-green-500 to-emerald-600"
                      : item.score >= 70
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                      : "bg-gradient-to-r from-yellow-500 to-orange-600"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
