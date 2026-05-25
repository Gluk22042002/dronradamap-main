import { useEffect, useState, useCallback } from 'react'
import { getEvents } from '../api'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../types'
import type { Event } from '../types'
import type { AppTheme } from '../telegram'
import { hapticImpact } from '../telegram'
import { getTgChannel } from '../tgChannels'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `${days} д назад`
}

function shareEvent(event: Event) {
  const label = EVENT_TYPE_LABELS[event.event_type] || event.event_type
  const text = `[${label}] ${event.title}${event.region ? ` · ${event.region}` : ''} — BplaScope`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
}

const TYPE_EMOJI: Record<string, string> = {
  all: '🔍',
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
}

export default function EventList({ onSelectEvent, theme }: {
  onSelectEvent: (e: Event) => void
  theme: AppTheme
}) {
  const [events, setEvents] = useState<Event[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (typeFilter) filters.event_type = typeFilter
      if (search) filters.search = search
      const data = await getEvents(page, 30, filters)
      setEvents(data.events)
      setTotal(data.total)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, typeFilter, search])

  useEffect(() => { fetchList() }, [fetchList])

  const totalPages = Math.ceil(total / 30)

  const filterTypes = ['all', 'drone_sighting', 'explosion', 'air_defense', 'missile_danger', 'missile_danger_cleared', 'unconfirmed'] as const

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
    }}>
      {/* Search bar */}
      <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: theme.sectionBg,
          borderRadius: 10, padding: '6px 10px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.hint} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4, marginRight: 6, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Поиск событий..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: theme.text, fontSize: 12, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                border: 'none', background: 'transparent',
                color: theme.hint, cursor: 'pointer',
                fontSize: 12, padding: '0 2px',
                fontFamily: 'inherit',
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
          padding: '4px 14px', fontSize: 10, color: theme.hint,
          flexShrink: 0,
        }}>
          Найдено: {total}
        </div>
      )}

      {/* Type filter pills */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 12px',
        overflowX: 'auto', flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {filterTypes.map(t => {
          const isActive = t === 'all' ? !typeFilter : typeFilter === t
          const typeColor = t === 'all' ? '#3b82f6' : EVENT_TYPE_COLORS[t]
          return (
            <button
              key={t}
              onClick={() => { setTypeFilter(t === 'all' ? '' : t); setPage(1); hapticImpact('light') }}
              style={{
                flexShrink: 0, padding: '5px 10px', borderRadius: 16,
                border: 'none', fontSize: 10, fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? `${typeColor}22` : 'rgba(255,255,255,0.04)',
                color: isActive ? typeColor : theme.text,
                WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', gap: 3,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 10 }}>{TYPE_EMOJI[t]}</span>
              <span>{t === 'all' ? 'Все' : EVENT_TYPE_LABELS[t]}</span>
            </button>
          )
        })}
      </div>

      {/* Event cards */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 24, height: 24, margin: '0 auto 10px',
              border: '2px solid rgba(255,255,255,0.04)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'evSpin 0.8s linear infinite',
            }} />
            <div style={{ color: theme.hint, fontSize: 12 }}>Загрузка...</div>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: theme.hint, fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📭</div>
            {search ? 'Ничего не найдено' : 'Нет событий'}
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>
              {search ? 'Попробуйте изменить запрос' : 'Измените фильтры'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
            {events.map(e => {
                    const typeColor = EVENT_TYPE_COLORS[e.event_type] || '#6b7280'
                    const tgChannel = e.region ? getTgChannel(e.region) : null
              return (
                <div
                  key={e.id}
                  onClick={() => { onSelectEvent(e); hapticImpact('medium') }}
                  style={{
                    background: theme.sectionBg,
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.03)',
                    borderLeft: `3px solid ${typeColor}`,
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, right: 0, width: 60, height: 60,
                    background: `radial-gradient(circle at 100% 0%, ${typeColor}08, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 2, color: theme.text }}>
                        {e.title}
                      </div>
                      {e.region && (
                        <div style={{
                          fontSize: 11, color: theme.hint, marginBottom: 2,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          {e.region}
                        </div>
                      )}
                      {/* TG Channel */}
                      {tgChannel && (
                        <div style={{
                          fontSize: 9, color: '#60a5fa', opacity: 0.6,
                          display: 'flex', alignItems: 'center', gap: 2,
                          marginBottom: 1,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                        }}>
                          {tgChannel}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: theme.hint, opacity: 0.6 }}>
                        {timeAgo(e.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: `${typeColor}18`,
                        color: typeColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        <span style={{ fontSize: 11 }}>{TYPE_EMOJI[e.event_type] || '❓'}</span>
                        <span>{EVENT_TYPE_LABELS[e.event_type] || e.event_type}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          fontSize: 10,
                          color: e.confidence_score > 0.7 ? '#22c55e' : '#f59e0b',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}>
                          {Math.round(e.confidence_score * 100)}%
                        </span>
                        <button
                          onClick={ev => { ev.stopPropagation(); shareEvent(e); hapticImpact('light') }}
                          style={{
                            border: 'none', background: 'transparent',
                            color: theme.hint, cursor: 'pointer',
                            padding: 0, fontSize: 11, lineHeight: 1,
                            opacity: 0.3,
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8,
          padding: '8px 12px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          flexShrink: 0,
        }}>
          <button
            disabled={page <= 1}
            onClick={() => { setPage(p => p - 1); hapticImpact('light') }}
            style={{
              padding: '6px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.04)',
              fontSize: 12, fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              background: 'rgba(255,255,255,0.02)',
              color: page <= 1 ? theme.hint : theme.text,
              opacity: page <= 1 ? 0.3 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >← Назад</button>
          <span style={{
            fontSize: 11, color: theme.hint,
            display: 'flex', alignItems: 'center',
            fontFamily: 'monospace',
          }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => { setPage(p => p + 1); hapticImpact('light') }}
            style={{
              padding: '6px 16px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.04)',
              fontSize: 12, fontWeight: 600,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              background: 'rgba(255,255,255,0.02)',
              color: page >= totalPages ? theme.hint : theme.text,
              opacity: page >= totalPages ? 0.3 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >Вперед →</button>
        </div>
      )}

      <style>{`@keyframes evSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
