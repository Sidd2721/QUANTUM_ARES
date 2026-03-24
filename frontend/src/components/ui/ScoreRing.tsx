import { useEffect, useState } from 'react';

interface Props {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 140 }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(score * eased));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = animatedScore >= 70 ? '#10B981' : animatedScore >= 40 ? '#F59E0B' : '#EF4444';
  const glowColor = animatedScore >= 70 ? 'rgba(16,185,129,0.2)' : animatedScore >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1F2937" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease', filter: `drop-shadow(0 0 8px ${glowColor})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{animatedScore}</span>
        <span className="text-[10px] text-[#6B7280] mt-0.5">/ 100</span>
      </div>
    </div>
  );
}
