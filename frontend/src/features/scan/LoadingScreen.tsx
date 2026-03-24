import { motion } from "motion/react";
import { Shield, Loader2 } from "lucide-react";

const loadingSteps = [
  "Parsing infrastructure configuration...",
  "Building dependency graph...",
  "Analyzing attack surface...",
  "Running security checks...",
  "Calculating risk score...",
  "Generating AI insights...",
];

export function LoadingScreen({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#F8FAFC" }}>
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity },
          }}
          className="relative inline-block mb-8"
        >
          <Shield className="w-24 h-24 text-blue-600" />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-blue-400 rounded-full blur-2xl"
          />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Analyzing Infrastructure</h2>

        <div className="w-96 space-y-3">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= currentStep ? 1 : 0.3,
                x: 0,
              }}
              transition={{ delay: index * 0.3 }}
              className="flex items-center gap-3 text-left"
            >
              {index < currentStep ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : index === currentStep ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${index <= currentStep ? "text-gray-800" : "text-gray-400"}`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
          className="mt-8 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto"
          style={{ maxWidth: "384px" }}
        />

        <p className="mt-4 text-sm text-gray-500">
          {Math.round(((currentStep + 1) / loadingSteps.length) * 100)}% Complete
        </p>
      </div>
    </div>
  );
}
