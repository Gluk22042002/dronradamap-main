import { useState } from 'react';
import { useRegions } from '../hooks/useApi';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type EventType } from '../types';

const TYPE_ICONS: Record<string, string> = {
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
};

interface Props {
  region: string;
  eventType: string;
  onRegionChange: (v: string) => void;
  onEventTypeChange: (v: string) => void;
}

export default function Filters({ region, eventType, onRegionChange, onEventTypeChange }: Props) {
  const regions = useRegions();
  const [regionSearch, setRegionSearch] = useState('');

  const types: Array<{ key: string; label: string; color: string }> = [
    { key: '', label: 'Все', color: '#3b82f6' },
    ...(['drone_sighting', 'explosion', 'air_defense', 'missile_danger', 'missile_danger_cleared', 'unconfirmed'] as const).map(t => ({
      key: t,
      label: EVENT_TYPE_LABELS[t as EventType],
      color: EVENT_TYPE_COLORS[t as EventType],
    })),
  ];

  const filteredRegions = regions.filter(r => {
    if (!regionSearch) return true;
    return r.name.toLowerCase().includes(regionSearch.toLowerCase());
  });

  const infoRegions = filteredRegions.filter(r => r.name !== 'Без категории');
  const nocat = filteredRegions.find(r => r.name === 'Без категории');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Event type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{
          fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Тип события
        </span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {types.map(t => {
            const isActive = t.key === '' ? !eventType : eventType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onEventTypeChange(t.key)}
                style={{
                  padding: '6px 10px', borderRadius: 7,
                  background: isActive ? `${t.color}1A` : 'transparent',
                  color: isActive ? t.color : 'var(--text-secondary)',
                  fontSize: 11, cursor: 'pointer', fontWeight: 600,
                  fontFamily: 'inherit',
                  transition: 'all var(--transition-fast)',
                  border: isActive ? `1px solid ${t.color}28` : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {t.key && <span style={{ fontSize: 14 }}>{TYPE_ICONS[t.key]}</span>}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Region */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{
          fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Регион
        </span>
        {/* Region search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          marginBottom: 4,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Поиск региона..."
            value={regionSearch}
            onChange={e => setRegionSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text)', fontSize: 11, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {regionSearch && (
            <button
              onClick={() => setRegionSearch('')}
              style={{
                border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: 9, padding: 0, fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Region list */}
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* "Все регионы" */}
          <button
            onClick={() => { onRegionChange(''); setRegionSearch(''); }}
            style={{
              padding: '6px 10px', borderRadius: 7,
              background: !region ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
              textAlign: 'left', width: '100%',
              transition: 'background 0.15s',
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: 4,
              background: !region ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: !region ? '#60a5fa' : 'var(--text-muted)',
              flexShrink: 0,
            }}>
              *
            </span>
            <span style={{
              fontSize: 11, fontWeight: !region ? 600 : 400,
              color: !region ? '#60a5fa' : 'var(--text)',
              flex: 1,
            }}>
              Все регионы
            </span>
            <span style={{
              fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {regions.reduce((s, r) => s + r.event_count, 0).toLocaleString()}
            </span>
          </button>

          {infoRegions.map(r => {
            const isActive = region === r.name;
            return (
              <button
                key={r.name}
                onClick={() => { onRegionChange(r.name); setRegionSearch(''); }}
                style={{
                  padding: '5px 10px', borderRadius: 7,
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit',
                  textAlign: 'left', width: '100%',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: '#60a5fa',
                  flexShrink: 0,
                }}>
                  *
                </span>
                <span style={{
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#60a5fa' : 'var(--text)',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.name}
                </span>
                <span style={{
                  fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {r.event_count.toLocaleString()}
                </span>
              </button>
            );
          })}

          {nocat && (
            <button
              onClick={() => { onRegionChange(nocat.name); setRegionSearch(''); }}
              style={{
                padding: '5px 10px', borderRadius: 7,
                background: region === nocat.name ? 'var(--bg-active)' : 'transparent',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'inherit',
                textAlign: 'left', width: '100%',
                transition: 'background 0.15s', opacity: 0.5,
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: 'rgba(100,116,139,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, color: 'var(--text-muted)',
                flexShrink: 0,
              }}>
                -
              </span>
              <span style={{
                fontSize: 11, fontWeight: 400,
                color: 'var(--text-muted)',
                flex: 1,
              }}>
                {nocat.name}
              </span>
              <span style={{
                fontSize: 9, color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {nocat.event_count.toLocaleString()}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
