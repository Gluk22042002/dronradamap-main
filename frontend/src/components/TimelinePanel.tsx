import { useState } from 'react';
import { useTimeline, useEventList } from '../hooks/useApi';
import EventCard from './EventCard';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function TimelinePanel({ onSelectEvent, onHoverEvent }: {
  onSelectEvent: (id: number) => void;
  onHoverEvent?: (id: number | null) => void;
}) {
  const { timeline, loading } = useTimeline(30);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const filters: Record<string, string> = {};
  if (expandedDate) {
    filters.date_from = expandedDate + 'T00:00:00';
    filters.date_to = expandedDate + 'T23:59:59';
  }

  const { events: dayEvents, total: dayTotal, loading: eventsLoading } = useEventList(
    expandedDate ? page : 0,
    expandedDate ? filters : undefined
  );

  const toggleDay = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
      setPage(1);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            height: 52, marginBottom: 8, borderRadius: 10,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
        ))}
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
      }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📅 Хронология
        </h2>
        <span style={{ fontSize: 10, color: '#475569' }}>последние 30 дней</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {timeline.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 12 }}>
            Нет данных за этот период
          </div>
        ) : (
          timeline.map(entry => {
            const isExpanded = expandedDate === entry.date;
            const dayPct = entry.shot_down > 0 ? Math.round(entry.shot_down / entry.total * 100) : 0;
            return (
              <div key={entry.date} style={{ marginBottom: 6 }}>
                <div
                  onClick={() => toggleDay(entry.date)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: isExpanded ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isExpanded ? '1px solid rgba(59,130,246,0.15)' : '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                      {fmtDate(entry.date)}
                    </span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
                        🔥 {entry.total}
                      </span>
                      {entry.shot_down > 0 && (
                        <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                          ✕ {entry.shot_down}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#64748b' }}>
                    <span>🚁 {entry.sightings}</span>
                    <span>💥 {entry.explosions}</span>
                    <span>📡 {entry.air_defense}</span>
                    {dayPct > 0 && (
                      <span style={{ marginLeft: 'auto', color: '#34d399' }}>
                        {dayPct}% сбито
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '6px 0 0 8px', borderLeft: '2px solid rgba(59,130,246,0.15)', marginLeft: 6 }}>
                    {eventsLoading ? (
                      <div style={{ padding: '12px 14px', textAlign: 'center', color: '#475569', fontSize: 11 }}>
                        Загрузка...
                      </div>
                    ) : dayEvents.length === 0 ? (
                      <div style={{ padding: '12px 14px', textAlign: 'center', color: '#475569', fontSize: 11 }}>
                        Нет событий
                      </div>
                    ) : (
                      dayEvents.map((ev, idx) => (
                        <div key={ev.id} style={{ animationDelay: `${idx * 30}ms` }}>
                          <EventCard
                            event={ev}
                            onClick={() => onSelectEvent(ev.id)}
                            onHover={onHoverEvent ? () => onHoverEvent(ev.id) : undefined}
                            onLeave={onHoverEvent ? () => onHoverEvent(null) : undefined}
                          />
                        </div>
                      ))
                    )}
                    {Math.ceil(dayTotal / 50) > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '6px 0' }}>
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: 10,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)', color: page <= 1 ? '#334155' : '#94a3b8',
                            cursor: page <= 1 ? 'default' : 'pointer',
                          }}
                        >←</button>
                        <span style={{ fontSize: 10, color: '#475569', padding: '3px 0' }}>
                          {page} / {Math.ceil(dayTotal / 50)}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(Math.ceil(dayTotal / 50), p + 1))}
                          disabled={page >= Math.ceil(dayTotal / 50)}
                          style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: 10,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)', color: page >= Math.ceil(dayTotal / 50) ? '#334155' : '#94a3b8',
                            cursor: page >= Math.ceil(dayTotal / 50) ? 'default' : 'pointer',
                          }}
                        >→</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}