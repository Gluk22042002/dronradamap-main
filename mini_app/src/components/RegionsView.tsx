import { useEffect, useState, useMemo } from 'react'
import { getRegions } from '../api'
import type { Region } from '../types'
import type { AppTheme } from '../telegram'
import { hapticImpact } from '../telegram'
import { getTgChannel } from '../tgChannels'

function getChannel(name: string): string | null {
  return getTgChannel(name)
}

export default function RegionsView({ onSelectRegion, theme }: {
  onSelectRegion: (region: string) => void
  theme: AppTheme
}) {
  const [regions, setRegions] = useState<Region[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRegions().then(data => { setRegions(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    const list = [...regions]
    const nocatIdx = list.findIndex(r => r.name === 'Без категории')
    if (nocatIdx >= 0) {
      const nocat = list.splice(nocatIdx, 1)[0]
      list.unshift(nocat)
    }
    return list
  }, [regions])

  const filtered = search
    ? sorted.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : sorted

  const maxCount = Math.max(...sorted.map(r => r.event_count), 1)
  const totalEvents = sorted.reduce((s, r) => s + r.event_count, 0)

  function handleSelect(name: string) {
    const next = selected === name ? '' : name
    setSelected(next)
    onSelectRegion(next)
    hapticImpact('medium')
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
    }}>
      {/* Search */}
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: theme.sectionBg,
          borderRadius: 10, padding: '8px 12px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.hint} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4, marginRight: 6, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Поиск региона..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: theme.text, fontSize: 13, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                border: 'none', background: 'transparent',
                color: theme.hint, cursor: 'pointer',
                fontSize: 13, padding: '0 2px',
                WebkitTapHighlightColor: 'transparent',
                fontFamily: 'inherit',
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{
        padding: '2px 14px 8px', flexShrink: 0,
      }}>
        <div style={{
          fontSize: 9, color: theme.hint, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {sorted.length} регионов · {totalEvents} событий
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 12px' }}>
        {filtered.map((r, i) => {
          const isActive = selected === r.name
          const channel = r.name !== 'Без категории' ? getChannel(r.name) : null
          const isNocat = r.name === 'Без категории'
          const pct = (r.event_count / maxCount) * 100

          return (
            <div
              key={r.name}
              onClick={() => handleSelect(r.name)}
              style={{
                padding: '7px 10px',
                marginBottom: 2,
                borderRadius: 10,
                background: isActive ? 'rgba(59,130,246,0.06)' : 'transparent',
                border: isActive ? '1px solid rgba(59,130,246,0.12)' : '1px solid transparent',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s',
                opacity: isNocat ? 0.55 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isNocat || (!channel && !isNocat) ? 0 : 1 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 700,
                  color: isNocat ? theme.hint : '#60a5fa',
                  background: isNocat ? 'rgba(100,116,139,0.08)' : 'rgba(59,130,246,0.1)',
                  fontFamily: 'monospace',
                }}>
                  {i + 1}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: isNocat ? 400 : 600,
                  color: isActive ? '#60a5fa' : (isNocat ? theme.hint : theme.text),
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.name}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isNocat ? theme.hint : theme.text,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}>
                  {r.event_count}
                </span>
              </div>
              {channel && (
                <div style={{
                  fontSize: 8, color: theme.hint,
                  paddingLeft: 22, lineHeight: 1.2, marginBottom: 2,
                  opacity: 0.6,
                }}>
                  {channel}
                </div>
              )}
              <div style={{
                height: 2, borderRadius: 1,
                background: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
                marginTop: channel ? 0 : 2,
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 1,
                  background: isNocat
                    ? theme.hint
                    : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: 0.7,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
