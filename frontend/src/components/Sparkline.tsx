interface Point { date: string; value: number }

interface Props {
  data: Point[];
  color?: string;
  height?: number;
  width?: number;
}

export default function Sparkline({ data, color = '#3b82f6', height = 28, width = 100 }: Props) {
  if (data.length < 2) return null;

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const padding = 0;
  const chartH = height - padding * 2;
  const chartW = width - padding * 2;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const points = values.map((v, i) =>
    `${padding + i * xStep},${padding + chartH - ((v - min) / range) * chartH}`
  ).join(' ');

  const areaPoints = `${padding},${padding + chartH} ${points} ${padding + (data.length - 1) * xStep},${padding + chartH}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-fill-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
