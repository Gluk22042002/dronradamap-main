import { useEffect, useState } from 'react'
import { getStats, getMapEvents, getTimeline } from '../api'
import type { Stats, Event, EventType, TimelineEntry } from '../types'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../types'
import type { AppTheme } from '../telegram'

const TYPE_ICONS: Record<string, string> = {
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
}

function MiniSparkline({ data, color = '#3b82f6' }: { data: TimelineEntry[]; color?: string }) {
  if (data.length < 2) return null
  const values = data.map(d => d.total)
  const max = Math.max(...values, 1)
  const h = 28, w = 80, pad = 0
  const cw = w - pad * 2, ch = h - pad * 2
  const step = cw / (data.length - 1)
  const pts = values.map((v, i) => `${pad + i * step},${pad + ch - (v / max) * ch}`).join(' ')
  const area = `${pad},${pad + ch} ${pts} ${pad + (data.length - 1) * step},${pad + ch}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function StatsView({ theme }: {
  theme: AppTheme
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Event[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getMapEvents(24).then(setRecent).catch(() => {})
    getTimeline(7).then(setTimeline).catch(() => {})
  }, [])

  const typeData = stats ? Object.entries(stats.events_by_type) : []

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: 16,
      background: theme.bg,
    }}>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))',
          borderRadius: 16,
          padding: '16px 18px',
          border: '1px solid rgba(59,130,246,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 80, height: 80,
            background: 'radial-gradient(circle at 100% 0%, rgba(59,130,246,0.06), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, position: 'relative' }}>
            Всего событий
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: theme.text, fontFamily: 'monospace', position: 'relative' }}>
            {stats?.total_events?.toLocaleString() ?? '...'}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
          borderRadius: 16,
          padding: '16px 18px',
          border: '1px solid rgba(34,197,94,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 80, height: 80,
            background: 'radial-gradient(circle at 100% 0%, rgba(34,197,94,0.05), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22c55e', position: 'relative' }}>
            За сегодня
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e', fontFamily: 'monospace', position: 'relative' }}>
            {stats?.events_today ?? '...'}
          </div>
        </div>
      </div>

      {/* Timeline sparkline */}
      {timeline.length > 0 && (
        <div style={{
          background: theme.sectionBg,
          borderRadius: 16,
          padding: '12px 14px',
          border: '1px solid rgba(255,255,255,0.03)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: theme.hint, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Активность за 7 дней
            </div>
            <MiniSparkline data={[...timeline].reverse()} color="#60a5fa" />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, fontFamily: 'monospace' }}>
              {timeline.reduce((s, t) => s + t.total, 0)}
            </div>
            <div style={{ fontSize: 8, color: theme.hint, marginTop: 1 }}>
              всего
            </div>
          </div>
        </div>
      )}

      {/* By type */}
      <div style={{
        background: theme.sectionBg,
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.03)',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📊</span>
          <span>По типам событий</span>
        </div>
        {typeData.map(([type, count]) => {
          const total = stats?.total_events || 1
          const pct = Math.round((count / total) * 100)
          const color = EVENT_TYPE_COLORS[type as EventType] || '#64748b'
          const label = EVENT_TYPE_LABELS[type as EventType] || type
          return (
            <div key={type} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 12 }}>{TYPE_ICONS[type]}</span>
                  <span style={{ color, fontWeight: 600 }}>{label}</span>
                </div>
                <span style={{ color: theme.hint, fontFamily: 'monospace', fontSize: 12 }}>{count}</span>
              </div>
              <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  borderRadius: 3,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent 24h */}
      <div style={{
        background: theme.sectionBg,
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⏱️</span>
          <span>Последние 24 часа</span>
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.hint, textAlign: 'center', padding: 16 }}>
            Нет данных
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.slice(0, 5).map(e => (
              <div key={e.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: theme.text,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.02)',
              }}>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginRight: 8,
                  fontSize: 12,
                }}>
                  {e.title}
                </span>
                <span style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 600,
                  color: EVENT_TYPE_COLORS[e.event_type],
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: `${EVENT_TYPE_COLORS[e.event_type]}12`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <span style={{ fontSize: 10 }}>{TYPE_ICONS[e.event_type]}</span>
                  <span>{EVENT_TYPE_LABELS[e.event_type]}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
