import { motion } from "motion/react";
import { Shield } from "lucide-react";

export function LandingHero({ onStartScan }: { onStartScan: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-16 h-16 text-blue-600" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            QUANTUM-ARES
          </h1>
        </div>
        <p className="text-xl text-gray-500 mb-12 max-w-2xl text-center">
          Proactive Infrastructure Security Intelligence. Detect, analyze, and neutralize vulnerabilities before they are exploited.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartScan}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center gap-2"
        >
          Start Hospital Demo
        </motion.button>
      </motion.div>
    </div>
  );
}
