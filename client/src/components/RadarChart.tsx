interface RadarChartProps {
  scores: {
    overall_score?: number;
    technical_depth?: number;
    communication?: number;
    project_experience?: number;
    adaptability?: number;
  };
}

const AXES = [
  { key: 'technical_depth', label: '技术深度', angle: -90 },
  { key: 'communication', label: '沟通表达', angle: -18 },
  { key: 'project_experience', label: '项目经验', angle: 54 },
  { key: 'adaptability', label: '适应能力', angle: 126 },
  { key: 'overall_score', label: '综合评分', angle: 198 },
];

export default function RadarChart({ scores }: RadarChartProps) {
  const size = 220;
  const center = size / 2;
  const maxRadius = 85;
  const getPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const getLabelPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const gridPoints = (radius: number) =>
    AXES.map((axis) => getPoint(axis.angle, radius));

  const dataPoints = AXES.map((axis) => {
    const value = scores[axis.key as keyof typeof scores] ?? 0;
    return getPoint(axis.angle, (value / 100) * maxRadius);
  });

  const gridPath = (radius: number) => {
    const points = gridPoints(radius);
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  const dataPath = () => {
    return dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid polygons */}
      {[1, 0.66, 0.33].map((level) => (
        <path
          key={level}
          d={gridPath(maxRadius * level)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {AXES.map((axis) => {
        const end = getPoint(axis.angle, maxRadius);
        return (
          <line
            key={axis.key}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <path
        d={dataPath()}
        fill="rgba(251,191,36,0.15)"
        stroke="#fbbf24"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#fbbf24"
        />
      ))}

      {/* Labels */}
      {AXES.map((axis) => {
        const labelPos = getLabelPoint(axis.angle, maxRadius + 18);
        return (
          <text
            key={axis.key}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#a1a1aa"
            fontSize={11}
            fontFamily="Inter, sans-serif"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
