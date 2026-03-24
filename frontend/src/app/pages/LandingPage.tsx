import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { LandingHero } from "../components/LandingHero";
import { LoadingScreen } from "../../features/scan/LoadingScreen";

export function LandingPage() {
  const [appState, setAppState] = useState<"landing" | "loading">("landing");
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();

  const handleStartScan = () => {
    setAppState("loading");
    setLoadingStep(0);
  };

  useEffect(() => {
    if (appState === "loading") {
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= 5) {
            clearInterval(interval);
            setTimeout(() => navigate("/dashboard"), 500);
            return prev;
          }
          return prev + 1;
        });
      }, 600);

      return () => clearInterval(interval);
    }
  }, [appState, navigate]);

  return (
    <AnimatePresence mode="wait">
      {appState === "landing" && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LandingHero onStartScan={handleStartScan} />
        </motion.div>
      )}

      {appState === "loading" && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingScreen currentStep={loadingStep} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
