import { useState, useRef } from 'react';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type Event, type EventType } from '../types';
import { getTgChannel } from '../tgChannels';

const TYPE_ICONS: Record<string, string> = {
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
};

function copyShare(event: Event) {
  const label = EVENT_TYPE_LABELS[event.event_type as EventType] || event.event_type;
  const text = `[${label}] ${event.title}${event.region ? ` · ${event.region}` : ''} — BplaScope`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

interface Props {
  event: Event;
  index?: number;
  onClick: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч`;
  return `${Math.floor(hours / 24)} д`;
}

export default function EventCard({ event, index = 0, onClick, onHover, onLeave }: Props) {
  const [shared, setShared] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typeColor = EVENT_TYPE_COLORS[event.event_type as EventType] || '#6b7280';
  const confidencePct = Math.round(event.confidence_score * 100);
  const confidenceColor = confidencePct > 70 ? '#22c55e' : confidencePct > 40 ? '#f59e0b' : '#ef4444';
  const tgChannel = event.region ? getTgChannel(event.region) : null;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyShare(event);
    setShared(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShared(false), 1200);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.()}
      onMouseLeave={() => onLeave?.()}
      className="event-card"
      style={{
        padding: 0,
        marginBottom: 7,
        borderRadius: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        animation: `slideUp 0.35s ease-out both`,
        animationDelay: `${Math.min(index * 0.035, 0.4)}s`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Left color stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${typeColor}, ${typeColor}44)`,
        opacity: 0.9,
      }} />

      <div style={{ padding: '12px 14px 12px 17px', position: 'relative', zIndex: 1 }}>
        {/* Top row: type badge + region + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px 3px 6px',
            borderRadius: 6,
            background: `${typeColor}18`,
            border: `1px solid ${typeColor}20`,
            fontSize: 10, fontWeight: 700,
            color: typeColor,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>{TYPE_ICONS[event.event_type] || '•'}</span>
            <span>{EVENT_TYPE_LABELS[event.event_type as EventType]}</span>
          </div>
          {event.region && (
            <span style={{
              fontSize: 9, color: 'var(--text-secondary)',
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.03)',
              fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120,
            }}>
              {event.region}
            </span>
          )}
          <span style={{
            fontSize: 9, color: 'var(--text-muted)',
            marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0, fontWeight: 500,
          }}>
            {timeAgo(event.created_at)}
          </span>
        </div>

        {/* Title - larger, brighter */}
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
          marginBottom: 8, lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {event.title}
        </div>

        {/* Bottom row: confidence + source + share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            flex: 1,
          }}>
            <div style={{
              flex: 1, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.04)',
              overflow: 'hidden',
              maxWidth: 70,
            }}>
              <div style={{
                width: `${confidencePct}%`, height: '100%', borderRadius: 2,
                background: confidenceColor,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 8px ${confidenceColor}44`,
              }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, color: confidenceColor,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {confidencePct}%
            </span>
          </div>

          {tgChannel && event.region && (
            <a
              href={`https://t.me/${tgChannel.slice(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: 9, color: '#60a5fa',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100,
                textDecoration: 'none', fontWeight: 600,
                opacity: 0.6, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              title={`${event.region} — ${tgChannel}`}
            >
              {tgChannel}
            </a>
          )}

          <button
            onClick={handleShare}
            style={{
              border: 'none', background: shared ? `${typeColor}20` : 'transparent',
              color: shared ? typeColor : 'var(--text-muted)',
              cursor: 'pointer', padding: '3px 6px',
              borderRadius: 5, fontSize: 11,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 3,
            }}
            title="Копировать"
          >
            {shared ? (
              <span style={{ fontSize: 11, fontWeight: 600 }}>✓</span>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Corner gradient glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 120, height: 120,
        background: `radial-gradient(circle at 100% 0%, ${typeColor}0C, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />
    </div>
  );
}
