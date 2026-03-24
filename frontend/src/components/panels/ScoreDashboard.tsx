import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface ScoreDashboardProps {
  score: number;
  previousScore?: number;
}

export function ScoreDashboard({ score, previousScore = 35 }: ScoreDashboardProps) {
  const [displayScore, setDisplayScore] = useState(previousScore);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = (score - displayScore) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore((prev) => prev + increment);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (s: number) => {
    if (s >= 80) return "from-green-500 to-emerald-600";
    if (s >= 60) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const trend = score > previousScore;
  const difference = Math.abs(score - previousScore);

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
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-gray-800">Security Score</h3>
        </div>

        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* Outer glow ring */}
          <motion.div
            animate={{
              boxShadow: [
                `0 0 40px ${score >= 80 ? "rgba(34, 197, 94, 0.3)" : score >= 60 ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                `0 0 60px ${score >= 80 ? "rgba(34, 197, 94, 0.5)" : score >= 60 ? "rgba(234, 179, 8, 0.5)" : "rgba(239, 68, 68, 0.5)"}`,
                `0 0 40px ${score >= 80 ? "rgba(34, 197, 94, 0.3)" : score >= 60 ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          />

          {/* SVG Circle */}
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="100"
              fill="none"
              stroke="rgba(229, 231, 235, 0.5)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="128"
              cy="128"
              r="100"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 100}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 100 * (1 - displayScore / 100) }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={score >= 80 ? "#22C55E" : score >= 60 ? "#EAB308" : "#EF4444"}
                />
                <stop
                  offset="100%"
                  stopColor={score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#DC2626"}
                />
              </linearGradient>
            </defs>
          </svg>

          {/* Score display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={displayScore}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-6xl font-bold ${getScoreColor(displayScore)}`}
            >
              {Math.round(displayScore)}
            </motion.div>
            <div className="text-gray-500 mt-2">out of 100</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          {trend ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+{difference} from previous scan</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600">-{difference} from previous scan</span>
            </>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Critical Issues</span>
            <span className="text-sm font-medium text-red-600">{score < 60 ? 3 : 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">High Priority</span>
            <span className="text-sm font-medium text-orange-600">{score < 80 ? 5 : 1}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Medium Priority</span>
            <span className="text-sm font-medium text-yellow-600">8</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
