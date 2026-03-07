// components/ScoreBar.tsx

type Verdict = 'Buy Now' | 'Consider' | 'Wait' | 'Must Watch' | 'Must Avoid';

interface ScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

export function ScoreBar({ label, score, color = 'bg-saffron' }: ScoreBarProps) {
  const pct = (score / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-white/30 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-white/60 w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

interface VerdictBadgeProps {
  verdict: Verdict | string;
  size?: 'sm' | 'md';
}

export function VerdictBadge({ verdict, size = 'sm' }: VerdictBadgeProps) {
  const styles: Record<string, string> = {
    'Buy Now':    'bg-pr-green/10 border-pr-green/30 text-pr-green',
    'Must Watch': 'bg-pr-green/10 border-pr-green/30 text-pr-green',
    'Consider':   'bg-yellow-400/10 border-yellow-400/30 text-yellow-400',
    'Wait':       'bg-red-500/10 border-red-500/30 text-red-400',
    'Must Avoid': 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const cls = styles[verdict] || 'bg-white/5 border-white/10 text-white/50';
  const padding = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm';

  return (
    <span className={`shrink-0 font-mono uppercase tracking-widest border rounded-full ${padding} ${cls}`}>
      {verdict}
    </span>
  );
}

interface BigScoreProps {
  score: number;
  total?: number;
}

export function BigScore({ score, total }: BigScoreProps) {
  const color =
    score >= 4.3 ? 'text-pr-green' :
    score >= 3.5 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="flex flex-col items-center">
      <div className={`font-syne font-black text-5xl tracking-tight ${color}`}>{score.toFixed(1)}</div>
      <div className="text-xs text-white/30 font-mono mt-1">out of 5.0</div>
      {total && <div className="text-xs text-white/25 font-mono">{total.toLocaleString('en-IN')} reviews</div>}
    </div>
  );
}
