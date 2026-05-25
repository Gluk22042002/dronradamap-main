import { useState, useEffect, useCallback } from 'react'
import { getTheme, hideBackButton, hapticImpact } from './telegram'
import type { AppTheme } from './telegram'
import MapView from './components/MapView'
import EventList from './components/EventList'
import StatsView from './components/StatsView'
import RegionsView from './components/RegionsView'
import SafetyView from './components/SafetyView'
import EventDetail from './components/EventDetail'
import type { Event } from './types'

type Tab = 'map' | 'events' | 'stats' | 'regions' | 'safety'

const TABS: { key: Tab; label: string; icon: string; activeIcon: string }[] = [
  { key: 'map', label: 'Карта', icon: '🗺️', activeIcon: '🌍' },
  { key: 'events', label: 'События', icon: '📋', activeIcon: '📝' },
  { key: 'stats', label: 'Статистика', icon: '📊', activeIcon: '📈' },
  { key: 'regions', label: 'Регионы', icon: '🏛️', activeIcon: '🏗️' },
  { key: 'safety', label: 'Безопасность', icon: '⚠️', activeIcon: '🛡️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('map')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [theme, setTheme] = useState<AppTheme>(getTheme)

  useEffect(() => {
    const handleTheme = () => setTheme(getTheme())
    window.addEventListener('resize', handleTheme)
    return () => window.removeEventListener('resize', handleTheme)
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      hideBackButton()
    }
  }, [selectedEvent])

  const handleSelectEvent = useCallback((e: Event) => {
    hapticImpact('medium')
    setSelectedEvent(e)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  const handleTabChange = useCallback((t: Tab) => {
    hapticImpact('light')
    setTab(t)
    setSelectedEvent(null)
  }, [])

  if (selectedEvent) {
    return <EventDetail event={selectedEvent} onBack={handleBack} theme={theme} />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100%',
      overflow: 'hidden',
      background: theme.bg,
      color: theme.text,
      position: 'relative',
    }}>
      {/* Premium mesh background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 0% 10%, rgba(59,130,246,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 100% 90%, rgba(139,92,246,0.03) 0%, transparent 60%)
        `,
      }} />

      {/* Header */}
      <header style={{
        padding: '8px 16px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.headerBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.1))',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" stroke="rgba(96,165,250,0.12)" strokeWidth="0.6"/>
              <circle cx="16" cy="16" r="8" stroke="rgba(96,165,250,0.08)" strokeWidth="0.5"/>
              <circle cx="16" cy="16" r="4" stroke="rgba(96,165,250,0.1)" strokeWidth="0.5"/>
              <path d="M16 4 A12 12 0 0 1 27 14" stroke="rgba(96,165,250,0.25)" strokeWidth="1" strokeLinecap="round"/>
              <path d="M16 4 A12 12 0 0 1 27 14 L24 12" stroke="rgba(96,165,250,0.1)" strokeWidth="0.4" fill="rgba(96,165,250,0.03)"/>
              <ellipse cx="16" cy="18" rx="4.5" ry="1.8" stroke="rgba(96,165,250,0.4)" strokeWidth="0.6" fill="rgba(96,165,250,0.05)"/>
              <rect x="12.5" y="17.5" width="1.3" height="0.6" rx="0.3" fill="rgba(96,165,250,0.3)"/>
              <rect x="18.2" y="17.5" width="1.3" height="0.6" rx="0.3" fill="rgba(96,165,250,0.3)"/>
              <line x1="13.5" y1="15.5" x2="18.5" y2="15.5" stroke="rgba(96,165,250,0.15)" strokeWidth="0.4"/>
              <circle cx="16" cy="18" r="0.9" fill="rgba(96,165,250,0.35)"/>
              <text x="16" y="6.5" textAnchor="middle" fontSize="4.5" fill="rgba(96,165,250,0.35)" fontWeight="700" fontFamily="Inter, sans-serif">B</text>
            </svg>
          </div>
          <div>
            <span style={{
              fontSize: 16, fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #eeeff6 30%, #8b8b9e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              BplaScope
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 8px 2px 6px', borderRadius: 20,
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.08)',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px rgba(34,197,94,0.5)',
          }} />
          <span style={{ fontSize: 8, color: '#4ade80', fontWeight: 700, letterSpacing: '0.06em' }}>
            LIVE
          </span>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {tab === 'map' && <MapView onSelectEvent={handleSelectEvent} theme={theme} />}
        {tab === 'events' && <EventList onSelectEvent={handleSelectEvent} theme={theme} />}
        {tab === 'stats' && <StatsView theme={theme} />}
        {tab === 'regions' && <RegionsView onSelectRegion={(r) => { setTab('map') }} theme={theme} />}
        {tab === 'safety' && <SafetyView theme={theme} />}
      </main>

      {/* Premium bottom tab bar */}
      <nav style={{
        display: 'flex',
        background: theme.headerBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        {TABS.map(t => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                padding: '6px 0 4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? theme.accent : theme.hint,
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0,
                  width: 24, height: 2,
                  background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}88)`,
                  borderRadius: '0 0 2px 2px',
                }} />
              )}
              <span style={{
                fontSize: 20,
                lineHeight: 1.2,
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.15s',
              }}>
                {isActive ? t.activeIcon : t.icon}
              </span>
              <span style={{
                fontSize: 9,
                letterSpacing: '0.02em',
              }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
