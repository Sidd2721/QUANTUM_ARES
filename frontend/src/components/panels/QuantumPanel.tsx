import { motion } from "motion/react";
import { Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const timelineData = [
  { time: "00:00", score: 42 },
  { time: "04:00", score: 41 },
  { time: "08:00", score: 39 },
  { time: "12:00", score: 38 },
  { time: "16:00", score: 42 },
  { time: "20:00", score: 45 },
  { time: "Now", score: 78 },
];

export function QuantumPanel() {
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
          <Activity className="w-6 h-6 text-blue-600" />
          <h3 className="text-gray-800">Security Score Timeline</h3>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="time"
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                backdropFilter: "blur(10px)",
              }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="85%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#scoreGradient)"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#3B82F6" }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-700">+36</div>
            <div className="text-xs text-green-600">Score Improvement</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
            <Activity className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-700">24h</div>
            <div className="text-xs text-blue-600">Monitoring Period</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">5</div>
            <div className="text-xs text-purple-600">Issues Resolved</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
