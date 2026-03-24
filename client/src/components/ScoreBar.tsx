interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
}

export default function ScoreBar({ label, score, maxScore = 100, color = '#fbbf24' }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#a1a1aa' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{score}</span>
      </div>
      <div style={{
        height: 8,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
}
