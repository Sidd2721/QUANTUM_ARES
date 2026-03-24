import { motion, useScroll, useTransform } from "motion/react";
import { Shield, ArrowRight, Zap, Target, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LandingHeroProps {
  onStartScan: () => void;
}

export function LandingHero({ onStartScan }: LandingHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // 3D Nodes
    const nodes: { x: number; y: number; z: number; vx: number; vy: number; vz: number; baseZ: number }[] = [];
    const numNodes = 60;
    
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 1000,
        baseZ: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 1.5,
      });
    }

    let time = 0;
    let animationFrameId: number;
    const focalLength = 800;

    const animate = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Center offset based on mouse (parallax)
      const mouseOffsetX = (mousePos.x - width / 2) * 0.1;
      const mouseOffsetY = (mousePos.y - height / 2) * 0.1;

      // Update positions
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Keep bounds
        if (Math.abs(node.x) > 1500) node.vx *= -1;
        if (Math.abs(node.y) > 1500) node.vy *= -1;
        if (node.z < 100 || node.z > 1500) node.vz *= -1;
      });

      // Sort by depth (Z) to render back-to-front
      const projectedNodes = nodes.map((node, i) => {
        // Perspective projection
        const scale = focalLength / (focalLength + node.z);
        const projX = width / 2 + (node.x - mouseOffsetX) * scale;
        const projY = height / 2 + (node.y - mouseOffsetY) * scale;
        return { ...node, projX, projY, scale, originalIndex: i };
      });

      projectedNodes.sort((a, b) => b.z - a.z);

      // Draw connections
      ctx.lineWidth = 1;
      for (let i = 0; i < projectedNodes.length; i++) {
        const nodeA = projectedNodes[i];
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const nodeB = projectedNodes[j];
          
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dz = nodeA.z - nodeB.z;
          const dist3d = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3d < 300) {
            ctx.beginPath();
            ctx.moveTo(nodeA.projX, nodeA.projY);
            ctx.lineTo(nodeB.projX, nodeB.projY);
            
            const opacity = (1 - dist3d / 300) * nodeA.scale * 0.8;
            
            // Vulnerability / Attack Path simulation
            if (nodeA.originalIndex % 7 === 0 || nodeB.originalIndex % 7 === 0) {
              ctx.strokeStyle = `rgba(239, 68, 68, ${opacity * (Math.sin(time * 5) * 0.5 + 0.5)})`;
              ctx.lineWidth = 1.5 * nodeA.scale;
            } else {
              ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.5})`;
              ctx.lineWidth = 1 * nodeA.scale;
            }
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      projectedNodes.forEach((node) => {
        const isVulnerable = node.originalIndex % 7 === 0;
        const radius = (isVulnerable ? 8 : 4) * node.scale;
        
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, radius, 0, Math.PI * 2);

        if (isVulnerable) {
          const pulse = Math.sin(time * 10 + node.originalIndex) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
          ctx.shadowBlur = 20 * node.scale;
          ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
        } else {
          ctx.fillStyle = `rgba(59, 130, 246, ${0.8 * node.scale})`;
          ctx.shadowBlur = 10 * node.scale;
          ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePos]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC]">
      {/* 3D Animated background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
      />

      {/* Decorative ambient gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />

      {/* Content wrapper with perspective */}
      <div 
        className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 min-h-screen flex flex-col justify-center"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          initial={{ opacity: 0, rotateX: 20, y: 50, z: -200 }}
          animate={{ opacity: 1, rotateX: 0, y: 0, z: 0 }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
          className="text-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Logo/Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-2xl rounded-full border border-white/50 shadow-[0_8px_32px_rgba(59,130,246,0.15)] mb-10 transform hover:translate-z-10 transition-transform duration-300"
          >
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800 tracking-tight">Quantum-Ares v7.75</span>
            <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold tracking-wider rounded-full uppercase shadow-inner">
              Enterprise
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6 tracking-tight drop-shadow-sm"
          >
            The CIBIL Score for
            <br />
            <span className="relative inline-block mt-2">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Infrastructure Security
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-sm rounded-full"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-600 mb-14 max-w-3xl mx-auto font-light leading-relaxed"
          >
            AI-powered security scoring for cloud infrastructure. Get instant visibility into your
            attack surface with automated remediation and compliance monitoring.
          </motion.p>

          {/* Stats Cards (3D style) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12 mb-16"
          >
            {[
              { value: "127", label: "Nodes Analyzed", color: "text-blue-600" },
              { value: "3", label: "Critical Issues", color: "text-red-600" },
              { value: "94%", label: "AI Confidence", color: "text-green-600" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10, rotateX: 10, rotateY: 5, scale: 1.05 }}
                className="w-48 p-6 bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-[0_20px_40px_rgba(0,0,0,0.05)] transform transition-all duration-300"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  className={`text-5xl font-black ${stat.color} mb-3 translate-z-[20px] drop-shadow-sm`}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-widest translate-z-[10px]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.1, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartScan}
            className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl font-bold text-xl shadow-[0_15px_30px_-5px_rgba(59,130,246,0.4)] overflow-hidden transform transition-all duration-300"
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            <span className="relative z-10 flex items-center gap-3">
              <Zap className="w-6 h-6 animate-pulse" />
              <span>Start Security Scan</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
            
            {/* Glowing edge effect */}
            <div className="absolute -inset-[1px] rounded-3xl z-[-1] bg-gradient-to-r from-blue-400 to-purple-400 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.button>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mt-20 flex flex-wrap justify-center gap-4 md:gap-8"
          >
            {[
              { icon: Target, text: "Real-time Threat Detection" },
              { icon: Zap, text: "Auto-remediation" },
              { icon: TrendingUp, text: "Predictive Analytics" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5, scale: 1.05 }}
                className="flex items-center gap-3 px-6 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-[0_8px_16px_rgba(0,0,0,0.03)]"
              >
                <div className="p-2 bg-blue-50 rounded-xl">
                  <feature.icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
