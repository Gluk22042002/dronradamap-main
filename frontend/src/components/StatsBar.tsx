import { useStats, useTimeline } from '../hooks/useApi';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type EventType } from '../types';
import Sparkline from './Sparkline';

const typeIcons: Record<string, string> = {
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  unconfirmed: '❓',
};

const typeGradients: Record<string, string> = {
  drone_sighting: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
  explosion: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
  air_defense: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
  unconfirmed: 'linear-gradient(135deg, rgba(100,116,139,0.12), rgba(100,116,139,0.04))',
};

function AnimatedNumber({ value }: { value: number }) {
  return (
    <span style={{
      fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 2,
      color: 'var(--text)',
      fontFamily: "'JetBrains Mono', monospace",
      animation: 'countUp 0.5s ease-out both',
    }}>
      {value.toLocaleString()}
    </span>
  );
}

export default function StatsBar() {
  const { stats } = useStats(30000);

  const { timeline } = useTimeline(7, 60000);
  if (!stats) return (
    <div style={{
      height: 60, flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-base)',
    }} />
  );

  const types = Object.entries(stats.events_by_type);
  const total = stats.total_events;

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '8px 20px',
      flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      background: 'var(--bg-base)',
      position: 'relative',
      zIndex: 2,
    }}>
      {/* Total card */}
      <div style={{
        flexShrink: 0,
        padding: '8px 14px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))',
        border: '1px solid rgba(59,130,246,0.12)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 76,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 60, height: 60,
          background: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', position: 'relative' }}>
          Всего
        </span>
        <AnimatedNumber value={total} />
      </div>

      {/* Today card */}
      <div style={{
        flexShrink: 0,
        padding: '8px 14px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
        border: '1px solid rgba(34,197,94,0.08)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 76,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 60, height: 60,
          background: 'radial-gradient(circle at 100% 0%, rgba(34,197,94,0.06), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', position: 'relative' }}>
          За день
        </span>
        <span style={{
          fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 2,
          color: '#22c55e',
          fontFamily: "'JetBrains Mono', monospace",
          animation: 'countUp 0.5s ease-out both 0.1s',
          position: 'relative',
        }}>
          {stats.events_today}
        </span>
      </div>

      {/* Timeline sparkline */}
      {timeline.length > 0 && (
        <div style={{
          flexShrink: 0,
          padding: '6px 12px',
          borderRadius: 10,
          background: 'rgba(59,130,246,0.04)',
          border: '1px solid rgba(59,130,246,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            7 дней
          </span>
          <Sparkline
            data={[...timeline].reverse().map(t => ({ date: t.date, value: t.total }))}
            color="#60a5fa"
            height={24}
            width={90}
          />
        </div>
      )}

      {/* Type cards */}
      {types.map(([type, count]) => {
        const color = EVENT_TYPE_COLORS[type as EventType] || '#6b7280';
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={type} style={{
            flexShrink: 0,
            padding: '8px 12px',
            borderRadius: 10,
            background: typeGradients[type] || 'var(--bg-card)',
            border: `1px solid ${color}10`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 68,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, height: 2,
              width: `${pct}%`, background: color,
              borderRadius: '0 1px 0 0',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.6,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 10, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>{typeIcons[type] || '•'}</span>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {EVENT_TYPE_LABELS[type as EventType]}
              </span>
            </div>
            <span style={{
              fontSize: 16, fontWeight: 700, color: color, lineHeight: 1.2,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
