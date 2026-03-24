const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW:      'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${style}`}>
      {severity}
    </span>
  );
}
