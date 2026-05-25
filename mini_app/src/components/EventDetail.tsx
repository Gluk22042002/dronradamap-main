import { useEffect } from 'react'
import type { Event } from '../types'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../types'
import type { AppTheme } from '../telegram'
import { showBackButton, hideBackButton, hapticImpact } from '../telegram'

function shareEvent(event: Event) {
  const label = EVENT_TYPE_LABELS[event.event_type] || event.event_type
  const text = `[${label}] ${event.title}${event.region ? ` · ${event.region}` : ''} — BplaScope`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => hapticImpact('light')).catch(() => {})
  }
}

const TYPE_ICONS: Record<string, string> = {
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
}

export default function EventDetail({ event, onBack, theme }: {
  event: Event
  onBack: () => void
  theme: AppTheme
}) {
  useEffect(() => {
    showBackButton(() => { hapticImpact('light'); onBack() })
    return () => hideBackButton()
  }, [onBack])

  const timeStr = new Date(event.created_at).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const typeColor = EVENT_TYPE_COLORS[event.event_type]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      overflow: 'auto',
      background: theme.bg,
      color: theme.text,
    }}>
      {/* Hero section */}
      <div style={{
        padding: '60px 20px 28px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-60%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at 50% 40%, ${typeColor}18 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-30%',
          width: '120%',
          height: '120%',
          background: `radial-gradient(circle at 80% 30%, ${typeColor}08 0%, transparent 50%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 10,
            background: `${typeColor}18`,
            color: typeColor,
            marginBottom: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <span style={{ fontSize: 14 }}>{TYPE_ICONS[event.event_type]}</span>
            <span>{EVENT_TYPE_LABELS[event.event_type]}</span>
          </div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
            color: theme.text,
          }}>{event.title}</h1>
        </div>
      </div>

      {/* Info sections */}
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Description */}
        {event.description && (
          <div style={{
            background: theme.sectionBg,
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.03)',
          }}>
            <div style={{
              fontSize: 10, color: theme.hint, fontWeight: 600, marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Описание
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: theme.text }}>{event.description}</div>
          </div>
        )}

        {/* Info Grid */}
        <div style={{
          background: theme.sectionBg,
          borderRadius: 16,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <InfoItem label="Регион" value={event.region || '—'} theme={theme} />
            <InfoItem
              label="Достоверность"
              value={`${Math.round(event.confidence_score * 100)}%`}
              color={event.confidence_score > 0.7 ? '#22c55e' : event.confidence_score > 0.4 ? '#f59e0b' : '#ef4444'}
              theme={theme}
            />
            <InfoItem label="Время" value={timeStr} small theme={theme} />
          </div>
        </div>

        {/* Coordinates */}
        {event.lat && event.lng && (
          <div style={{
            background: theme.sectionBg,
            borderRadius: 16,
            padding: 14,
            border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 14, opacity: 0.5 }}>📍</span>
            <span style={{
              fontSize: 12, color: theme.hint, fontFamily: 'monospace',
              letterSpacing: '0.02em',
            }}>
              {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { hapticImpact('light'); onBack() }}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.02)',
              color: theme.hint,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ← Назад к списку
          </button>
          <button
            onClick={() => shareEvent(event)}
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(59,130,246,0.06)',
              color: '#60a5fa',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Скопировать
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, theme, color, small }: {
  label: string
  value: string
  theme: AppTheme
  color?: string
  small?: boolean
}) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: theme.hint, fontWeight: 600, marginBottom: 3,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? 12 : 14,
        fontWeight: 500,
        color: color || theme.text,
        lineHeight: 1.3,
      }}>
        {value}
      </div>
    </div>
  )
}
