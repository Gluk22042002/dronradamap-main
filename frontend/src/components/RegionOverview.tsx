import { useMemo, useState } from 'react';
import { useRegions } from '../hooks/useApi';
import { getTgChannel } from '../tgChannels';

interface Props {
  region: string;
  onRegionChange: (v: string) => void;
}

export default function RegionOverview({ region, onRegionChange }: Props) {
  const regions = useRegions();
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    const list = [...regions];
    const nocatIdx = list.findIndex(r => r.name === 'Без категории');
    if (nocatIdx >= 0) {
      const nocat = list.splice(nocatIdx, 1)[0];
      list.unshift(nocat);
    }
    return list;
  }, [regions]);

  const filtered = useMemo(() => {
    if (!search) return sorted;
    return sorted.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [sorted, search]);

  const maxCount = Math.max(...filtered.map(r => r.event_count), 1);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with search */}
      <div style={{
        padding: '10px 12px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{
          fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {sorted.length} регионов · {sorted.reduce((s, r) => s + r.event_count, 0).toLocaleString()} событий
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px', borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Поиск региона..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text)', fontSize: 12, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: 9, padding: 0, fontFamily: 'inherit', opacity: 0.6,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="scrollable" style={{ flex: 1, padding: '6px 10px 10px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Ничего не найдено
          </div>
        ) : filtered.map((r, i) => {
          const isActive = region === r.name;
          const channel = r.name !== 'Без категории' ? getTgChannel(r.name) : null;
          const pct = (r.event_count / maxCount) * 100;
          const isNocat = r.name === 'Без категории';

          return (
            <div
              key={r.name}
              onClick={() => onRegionChange(isActive ? '' : r.name)}
              className="region-item"
              style={{
                padding: '8px 10px',
                marginBottom: 3,
                borderRadius: 9,
                background: isActive ? 'var(--bg-active)' : 'transparent',
                border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                opacity: isNocat ? 0.5 : 1,
                animation: `slideUp 0.25s ease-out both`,
                animationDelay: `${Math.min(i * 0.025, 0.5)}s`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isNocat ? 0 : 3 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 5,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700,
                  color: isNocat ? 'var(--text-muted)' : '#60a5fa',
                  background: isNocat ? 'rgba(100,116,139,0.08)' : 'rgba(59,130,246,0.1)',
                  flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {i + 1}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: isNocat ? 400 : 600,
                  color: isActive ? '#60a5fa' : (isNocat ? 'var(--text-muted)' : 'var(--text)'),
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.name}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: isNocat ? 'var(--text-muted)' : 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                }}>
                  {r.event_count.toLocaleString()}
                </span>
              </div>
              {channel && (
                <div style={{
                  fontSize: 8, color: 'var(--text-muted)',
                  paddingLeft: 28, lineHeight: 1.4, marginBottom: 2,
                  opacity: 0.6,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                }}>
                  {channel}
                </div>
              )}
              <div style={{
                height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
                marginTop: channel ? 0 : 2,
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 2,
                  background: isNocat
                    ? '#475569'
                    : `linear-gradient(90deg, #3b82f6, ${pct > 50 ? '#8b5cf6' : '#60a5fa'})`,
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: 0.6,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
