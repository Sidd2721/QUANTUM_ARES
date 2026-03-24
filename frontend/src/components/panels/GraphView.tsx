import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, AlertTriangle, Activity } from "lucide-react";

interface Node {
  id: string;
  x: number;
  y: number;
  type: "service" | "database" | "api" | "vulnerable";
  label: string;
  vulnerable?: boolean;
}

interface Edge {
  from: string;
  to: string;
  vulnerable?: boolean;
}

export function GraphView({ data }: { data?: { nodes: Node[]; edges: Edge[] } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animationRef = useRef<number>(undefined); // Add undefined to satisfy TS

  const defaultData: { nodes: Node[]; edges: Edge[] } = {
    nodes: [
      { id: "1", x: 150, y: 150, type: "service", label: "API Gateway" },
      { id: "2", x: 400, y: 100, type: "service", label: "Auth Service" },
      { id: "3", x: 400, y: 200, type: "database", label: "User DB", vulnerable: true },
      { id: "4", x: 650, y: 150, type: "api", label: "Payment API", vulnerable: true },
      { id: "5", x: 150, y: 300, type: "service", label: "Web Server" },
      { id: "6", x: 400, y: 350, type: "database", label: "Cache" },
      { id: "7", x: 650, y: 300, type: "vulnerable", label: "S3 Bucket", vulnerable: true },
    ],
    edges: [
      { from: "1", to: "2" },
      { from: "1", to: "3", vulnerable: true },
      { from: "2", to: "4", vulnerable: true },
      { from: "1", to: "5" },
      { from: "5", to: "6" },
      { from: "6", to: "7", vulnerable: true },
      { from: "4", to: "7" },
    ],
  };

  const graphData = data || defaultData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    
    // Function to calculate dynamic node positions
    const getPos = (node: Node, t: number) => {
      const idNum = parseInt(node.id) || 0;
      const dx = Math.sin(t * 0.5 + idNum * 2) * 8;
      const dy = Math.cos(t * 0.4 + idNum * 2) * 8;
      return { x: node.x + dx, y: node.y + dy };
    };

    const animate = () => {
      time += 0.03;

      // Draw background with slight trail effect for dynamic feel
      ctx.fillStyle = "rgba(10, 15, 30, 0.2)"; // Darker semi-transparent for trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gridSize = 40;
      const offset = (time * 10) % gridSize;
      for(let x = offset; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for(let y = offset; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // Draw edges
      graphData.edges.forEach((edge) => {
        const fromNode = graphData.nodes.find((n) => n.id === edge.from);
        const toNode = graphData.nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const p1 = getPos(fromNode, time);
        const p2 = getPos(toNode, time);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (edge.vulnerable) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(time * 3) * 0.2})`;
          ctx.lineWidth = 2 + Math.sin(time * 4) * 0.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
          ctx.setLineDash([8, 8]);
          ctx.lineDashOffset = -time * 20;
        } else {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 5;
          ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Attack or Data path animation (particles)
        const particleCount = edge.vulnerable ? 3 : 1;
        for (let i = 0; i < particleCount; i++) {
          const speed = edge.vulnerable ? 2 : 1;
          const progress = ((time * speed + i * (2 / particleCount)) % 2) / 2; // 0 to 1
          if (progress >= 0 && progress <= 1) {
            const px = p1.x + (p2.x - p1.x) * progress;
            const py = p1.y + (p2.y - p1.y) * progress;

            ctx.beginPath();
            ctx.arc(px, py, edge.vulnerable ? 3 : 2, 0, Math.PI * 2);
            ctx.fillStyle = edge.vulnerable ? "rgba(252, 165, 165, 0.9)" : "rgba(186, 230, 253, 0.9)";
            ctx.shadowBlur = 10;
            ctx.shadowColor = edge.vulnerable ? "#EF4444" : "#38BDF8";
            ctx.fill();
            ctx.shadowBlur = 0; // Reset
          }
        }
      });

      // Draw nodes
      graphData.nodes.forEach((node) => {
        const isSelected = selectedNode === node.id;
        const isHovered = hoveredNode === node.id;
        const pulse = Math.sin(time * 2 + parseInt(node.id)) * 0.5 + 0.5;
        const pos = getPos(node, time);

        const baseColor = node.vulnerable ? "#EF4444" : "#0EA5E9"; // Cyan for normal, Red for vulnerable
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        
        // Outer rotating dashed ring
        ctx.rotate(time * (parseInt(node.id) % 2 === 0 ? 0.5 : -0.5));
        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 30 : isHovered ? 26 : 24, 0, Math.PI * 2);
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.setLineDash([10, 15]);
        ctx.stroke();
        
        // Inner spinning polygon (hexagon)
        ctx.setLineDash([]);
        ctx.rotate(-time); // Counter rotate
        ctx.beginPath();
        const sides = 6;
        const radius = isSelected ? 22 : isHovered ? 19 : 17;
        for (let i = 0; i < sides; i++) {
          const angle = (i * Math.PI * 2) / sides;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        // Fill and stroke inner shape
        ctx.shadowBlur = isHovered || isSelected ? 20 : 10;
        ctx.shadowColor = baseColor;
        ctx.fillStyle = `rgba(${node.vulnerable ? '30, 10, 10' : '10, 20, 30'}, 0.9)`;
        ctx.fill();
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        ctx.restore();

        // Node Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = isHovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)";
        ctx.font = isHovered ? "bold 13px Inter, system-ui" : "12px Inter, system-ui";
        ctx.textAlign = "center";
        ctx.fillText(node.label, pos.x, pos.y + 45);
        
        // Warning Icon indicator for vulnerable nodes
        if (node.vulnerable) {
          ctx.fillStyle = "#EF4444";
          ctx.font = "bold 14px system-ui";
          ctx.fillText("!", pos.x + 20, pos.y - 20);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphData, selectedNode, hoveredNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // A slightly larger hit radius (30) covers the bobbing animation effectively
    const clickedNode = graphData.nodes.find(
      (node) => Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) < 30
    );

    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = graphData.nodes.find(
      (node) => Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2) < 30
    );

    setHoveredNode(hovered ? hovered.id : null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl overflow-hidden border border-slate-700/50"
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.9))",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      <div className="p-6 border-b border-slate-700/50 backdrop-blur-md bg-slate-900/40 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-slate-200 font-semibold tracking-wide">Threat Topology Map</h3>
              <p className="text-xs text-slate-400">Real-time infrastructure analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
              <span className="text-slate-300">Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              <span className="text-slate-300">Vulnerable</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full cursor-pointer touch-none bg-[#0a0f1e]"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ mixBlendMode: 'screen' }}
        />
        
        {/* Decorative Overlay Gradients */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.1),transparent_50%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_100%_100%,rgba(239,68,68,0.05),transparent_50%)]" />
      </div>

      {selectedNode && (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute top-24 right-6 w-64 rounded-xl shadow-2xl overflow-hidden border border-slate-700/60"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Header based on status */}
            <div className={`p-4 border-b ${
              graphData.nodes.find(n => n.id === selectedNode)?.vulnerable 
                ? 'border-red-500/30 bg-red-500/10' 
                : 'border-sky-500/30 bg-sky-500/10'
            }`}>
              <div className="flex items-center gap-3">
                {graphData.nodes.find(n => n.id === selectedNode)?.vulnerable ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Shield className="w-5 h-5 text-sky-400" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-100">
                    {graphData.nodes.find((n) => n.id === selectedNode)?.label}
                  </h4>
                  <span className="text-xs text-slate-400 capitalize">
                    {graphData.nodes.find((n) => n.id === selectedNode)?.type} Node
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Status</span>
                  {graphData.nodes.find(n => n.id === selectedNode)?.vulnerable ? (
                    <span className="text-red-400 font-medium flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Exposed
                    </span>
                  ) : (
                    <span className="text-sky-400 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                      Protected
                    </span>
                  )}
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Connections</span>
                  <span className="text-slate-200">
                    {graphData.edges.filter(e => e.from === selectedNode || e.to === selectedNode).length} Active
                  </span>
               </div>
            </div>
        </motion.div>
      )}
    </motion.div>
  );
}
