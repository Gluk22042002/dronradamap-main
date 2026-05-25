import { useState } from 'react';
import { useEventList } from '../hooks/useApi';
import EventCard from './EventCard';
import SkeletonCard from './SkeletonCard';

interface Props {
  region: string;
  eventType: string;
  onSelectEvent: (id: number) => void;
  onHoverEvent?: (id: number | null) => void;
}

export default function EventList({ region, eventType, onSelectEvent, onHoverEvent }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const filters: Record<string, string> = {};
  if (region) filters.region = region;
  if (eventType) filters.event_type = eventType;
  if (search) filters.search = search;

  const { events, total, loading } = useEventList(page, filters, 30000);
  const totalPages = Math.ceil(total / 50);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ padding: '10px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--bg-surface)',
          borderRadius: 9, padding: '8px 12px',
          border: '1px solid var(--border)',
          transition: 'border-color 0.2s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.35, marginRight: 8, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Поиск событий..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text)', fontSize: 13, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                border: 'none', background: 'rgba(59,130,246,0.12)',
                color: '#60a5fa', cursor: 'pointer',
                fontSize: 9, padding: '3px 8px', borderRadius: 5,
                fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && search && (
        <div style={{
          padding: '6px 14px', fontSize: 10, color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
        }}>
          Найдено: {total}
        </div>
      )}

      {/* Event cards */}
      <div className="scrollable" style={{ flex: 1, padding: '8px 10px 10px' }}>
        {loading && events.length === 0 ? (
          <SkeletonCard count={8} />
        ) : events.length === 0 ? (
          <div style={{
            padding: '60px 20px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, opacity: 0.4,
              border: '1px solid var(--border)',
            }}>
              {search ? '🔍' : '📭'}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 600, color: 'var(--text-muted)',
            }}>
              {search ? 'Ничего не найдено' : 'Нет событий'}
            </div>
            {(region || eventType || search) && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.6, maxWidth: 240, lineHeight: 1.5 }}>
                Попробуйте изменить фильтры
              </div>
            )}
          </div>
        ) : (
          events.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              index={i}
              onClick={() => onSelectEvent(event.id)}
              onHover={onHoverEvent ? () => onHoverEvent(event.id) : undefined}
              onLeave={onHoverEvent ? () => onHoverEvent(null) : undefined}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0,
          background: 'rgba(0,0,0,0.08)',
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: page <= 1 ? 'transparent' : 'rgba(255,255,255,0.02)',
              color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: page <= 1 ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              opacity: page <= 1 ? 0.3 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >← Назад</button>
          <span style={{
            color: 'var(--text)', fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            minWidth: 48, textAlign: 'center',
            padding: '4px 10px',
            background: 'rgba(59,130,246,0.08)',
            borderRadius: 6,
            border: '1px solid rgba(59,130,246,0.1)',
            fontWeight: 600,
          }}>
            {page}/{totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: page >= totalPages ? 'transparent' : 'rgba(255,255,255,0.02)',
              color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: page >= totalPages ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              opacity: page >= totalPages ? 0.3 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >Вперед →</button>
        </div>
      )}
    </div>
  );
}
