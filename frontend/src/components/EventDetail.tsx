import { useEffect, useRef, useState } from 'react';
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
  onClose: () => void;
}

export default function EventDetail({ event, onClose }: Props) {
  const [shared, setShared] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typeColor = EVENT_TYPE_COLORS[event.event_type as EventType] || '#6b7280';
  const confidencePct = Math.round(event.confidence_score * 100);
  const confidenceColor = confidencePct > 70 ? '#22c55e' : confidencePct > 40 ? '#f59e0b' : '#ef4444';
  const tgChannel = event.region ? getTgChannel(event.region) : null;

  const timeStr = new Date(event.created_at).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const handleShare = () => {
    copyShare(event);
    setShared(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShared(false), 1500);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.15s ease-out both',
        }}
      />

      {/* Modal */}
      <div className="animate-up" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
        maxHeight: '82vh',
        background: 'var(--bg-base)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Handle bar */}
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '10px 0 4px',
          position: 'sticky', top: 0, zIndex: 1,
          background: 'var(--bg-base)',
        }}>
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.12)',
          }} />
        </div>

        {/* Hero section */}
        <div style={{
          padding: '16px 20px 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-80%', left: '-50%',
            width: '200%', height: '200%',
            background: `radial-gradient(circle at 50% 40%, ${typeColor}15 0%, transparent 60%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700,
              padding: '5px 14px', borderRadius: 10,
              background: `${typeColor}1A`,
              color: typeColor,
              marginBottom: 14,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              border: `1px solid ${typeColor}18`,
            }}>
              <span style={{ fontSize: 16 }}>{TYPE_ICONS[event.event_type]}</span>
              <span>{EVENT_TYPE_LABELS[event.event_type as EventType]}</span>
            </div>
            <h2 style={{
              fontSize: 20, fontWeight: 700,
              lineHeight: 1.4, margin: 0,
              color: 'var(--text)',
            }}>{event.title}</h2>
          </div>
        </div>

        {/* Info sections */}
        <div style={{ padding: '0 18px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Description */}
          {event.description && (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 14,
              padding: 16,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Описание
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 14,
            padding: 16,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Регион
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {event.region || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Достоверность
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: confidenceColor,
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 44, height: 5, borderRadius: 2,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${confidencePct}%`, height: '100%', borderRadius: 2,
                      background: confidenceColor,
                      boxShadow: `0 0 8px ${confidenceColor}44`,
                    }} />
                  </div>
                  {confidencePct}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Время
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  {timeStr}
                </div>
              </div>
            </div>
          </div>

          {/* TG Channel */}
          {tgChannel && event.region && (
            <a
              href={`https://t.me/${tgChannel.slice(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 14,
                padding: 14,
                border: '1px solid rgba(59,130,246,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = ''; }}
            >
              <span style={{ fontSize: 13 }}>📢</span>
              <span style={{ fontSize: 13, color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                {tgChannel}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                → {event.region}
              </span>
            </a>
          )}

          {/* Coordinates */}
          {event.lat && event.lng && (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 14,
              padding: 14,
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14, opacity: 0.45 }}>📍</span>
              <span style={{
                fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.02em', fontWeight: 500,
              }}>
                {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 6 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '13px 20px', borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-muted)',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              ← Назад
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: '13px 20px', borderRadius: 12,
                border: '1px solid rgba(59,130,246,0.15)',
                background: shared ? `${typeColor}15` : 'rgba(59,130,246,0.06)',
                color: shared ? typeColor : '#60a5fa',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {shared ? (
                <span style={{ fontSize: 13 }}>✓ Скопировано</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Копировать
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
