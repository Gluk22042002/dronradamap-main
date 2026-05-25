import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getMapEvents } from '../api'
import type { Event, EventType } from '../types'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../types'
import type { AppTheme } from '../telegram'
import { hapticImpact } from '../telegram'
import MarkerClusterLayer from './MarkerClusterLayer'

function jitterCoord(id: number, base: number, intensity = 0.04): number {
  const seed = (id * 9301 + 49297) % 233280;
  const ratio = seed / 233280;
  return base + (ratio - 0.5) * intensity;
}

function createIcon(type: EventType): L.DivIcon {
  const colors: Record<string, string> = {
    drone_sighting: '#f59e0b',
    explosion: '#ef4444',
    air_defense: '#3b82f6',
    missile_danger: '#e11d48',
    missile_danger_cleared: '#22c55e',
    unconfirmed: '#64748b',
  }
  const color = colors[type] || '#6b7280'
  const glowColors: Record<string, string> = {
    drone_sighting: '#f59e0b88',
    explosion: '#ef444488',
    air_defense: '#3b82f688',
    missile_danger: '#e11d4888',
    missile_danger_cleared: '#22c55e88',
    unconfirmed: '#64748b44',
  }
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px; height: 16px;
      background: ${color};
      border: 2.5px solid rgba(255,255,255,0.9);
      border-radius: 50%;
      box-shadow: 0 0 16px ${glowColors[type] || '#64748b44'}, 0 0 4px rgba(255,255,255,0.2);
      transition: transform 0.2s;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  })
}

function MapUpdater({ events }: { events: Event[] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (events.length === 0 || fitted.current) return
    const valid = events.filter(e => e.lat && e.lng)
    if (valid.length === 0) return
    const bounds = L.latLngBounds(valid.map(e => {
      return [jitterCoord(e.id, e.lat!), jitterCoord(e.id + 1000, e.lng!)] as [number, number]
    }))
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 })
      fitted.current = true
    }
  }, [events, map])
  return null
}

const darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const darkAttribution = '&copy; OSM &copy; CARTO'

const TYPE_ICONS: Record<string, string> = {
  all: '🔍',
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
}

const TIME_OPTIONS = [
  { label: 'Сейчас', hours: 1 },
  { label: '6ч', hours: 6 },
  { label: '12ч', hours: 12 },
  { label: '24ч', hours: 24 },
  { label: '3д', hours: 72 },
  { label: '7д', hours: 168 },
  { label: '30д', hours: 720 },
]

const FILTER_TYPES = ['all', 'drone_sighting', 'explosion', 'air_defense', 'missile_danger', 'missile_danger_cleared', 'unconfirmed'] as const

// Mini radar widget component
function MiniRadar({ quiet, flash }: { quiet?: boolean; flash?: boolean }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      background: quiet ? 'rgba(100,116,139,0.1)' : 'rgba(0,20,0,0.2)',
      border: `1px solid ${quiet ? 'rgba(100,116,139,0.08)' : 'rgba(34,197,94,0.12)'}`,
      boxShadow: flash ? '0 0 20px rgba(34,197,94,0.15)' : quiet ? '0 0 16px rgba(100,116,139,0.02)' : '0 0 16px rgba(34,197,94,0.04)',
      transition: 'all 0.5s ease',
      animation: flash ? 'mini-flash 0.6s ease-out' : 'none',
    }}>
      {/* Rings */}
      {[14, 24, 34].map(r => (
        <div key={r} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: r, height: r,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `0.5px solid ${quiet ? 'rgba(100,116,139,0.05)' : 'rgba(34,197,94,0.07)'}`,
        }} />
      ))}
      {/* Sweep cone */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '100%', height: '100%',
        transform: 'translate(-50%, -50%)',
        background: `conic-gradient(from 0deg, ${quiet ? 'rgba(100,116,139,0.04)' : 'rgba(34,197,94,0.08)'} 0deg, transparent 30deg, transparent 360deg)`,
        borderRadius: '50%',
        animation: quiet ? 'none' : 'mini-sweep 3s linear infinite',
        opacity: quiet ? 0.2 : 1,
        transition: 'opacity 0.5s ease',
      }} />
      {/* Sweep line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        width: 1, height: '50%', marginLeft: -0.5,
        background: `linear-gradient(to bottom, ${quiet ? 'rgba(100,116,139,0.2)' : 'rgba(34,197,94,0.5)'}, transparent)`,
        transformOrigin: 'bottom center',
        animation: quiet ? 'none' : 'mini-sweep 3s linear infinite',
        opacity: quiet ? 0.15 : 1,
        transition: 'opacity 0.5s ease',
      }} />
      {/* Center dot */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 1.5, height: 1.5, transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: quiet ? 'rgba(100,116,139,0.3)' : 'rgba(34,197,94,0.5)',
        transition: 'background 0.5s ease',
      }} />
      <style>{`
        @keyframes mini-sweep {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes mini-flash {
          0% { box-shadow: 0 0 16px rgba(34,197,94,0.04), 0 0 0 0 rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 20px rgba(34,197,94,0.04), 0 0 24px 6px rgba(34,197,94,0.12); }
          100% { box-shadow: 0 0 16px rgba(34,197,94,0.04), 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  )
}

export default function MapView({ onSelectEvent, theme }: {
  onSelectEvent: (e: Event) => void
  theme: AppTheme
}) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<string>('all')
  const [hours, setHours] = useState(1)
  const [satellite, setSatellite] = useState(false)
  const [newEventFlash, setNewEventFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const prevCount = useRef(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMapEvents(hours)
        if (data.length > prevCount.current && prevCount.current > 0) {
          setNewEventFlash(true)
          setTimeout(() => setNewEventFlash(false), 2000)
        }
        prevCount.current = data.length
        setEvents(data)
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetch()
    intervalRef.current = setInterval(fetch, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [hours])

  const filtered = activeType === 'all'
    ? events
    : events.filter(e => e.event_type === activeType)

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} мин`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч`
    return `${Math.floor(hours / 24)} д`
  }

  const isQuiet = !loading && filtered.length === 0 && hours === 1

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: theme.bg, zIndex: 1000,
        }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(255,255,255,0.04)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'mapSpin 0.8s linear infinite',
          }} />
        </div>
      )}

      <MapContainer
        center={[55.76, 37.64]}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={satellite ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : darkTile} attribution={darkAttribution} />
        {!satellite && <TileLayer url='https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png' maxZoom={19} opacity={0.5} />}
        <MapUpdater events={filtered} />
        <MarkerClusterLayer
          events={filtered.filter(e => e.lat && e.lng).map(e => {
            const color = EVENT_TYPE_COLORS[e.event_type] || '#6b7280'
            const confidencePct = Math.round(e.confidence_score * 100)
            return {
              id: e.id,
              pos: [jitterCoord(e.id, e.lat!), jitterCoord(e.id + 1000, e.lng!)] as [number, number],
              color,
              title: e.title,
              region: e.region,
              timeStr: timeAgo(e.created_at),
              label: EVENT_TYPE_LABELS[e.event_type] || e.event_type,
              confidence: confidencePct,
              confidenceColor: confidencePct > 70 ? '#22c55e' : '#f59e0b',
              onClick: (raw: any) => { hapticImpact('medium'); onSelectEvent(raw) },
              rawEvent: e,
            }
          })}
        />
      </MapContainer>

      {/* Top: time range pills + event count */}
      <div style={{
        position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000,
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {/* Time range pills (scrollable) */}
        <div style={{
          display: 'flex', gap: 2, overflowX: 'auto', flex: 1,
          background: 'rgba(15,15,26,0.75)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 8, padding: 2,
          border: '1px solid rgba(255,255,255,0.04)',
          scrollbarWidth: 'none',
        }}>
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt.hours}
              onClick={() => { setHours(opt.hours); hapticImpact('light') }}
              style={{
                flexShrink: 0,
                padding: '4px 8px', borderRadius: 5,
                border: 'none',
                background: hours === opt.hours ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: hours === opt.hours ? '#60a5fa' : theme.hint,
                fontSize: 9, fontWeight: hours === opt.hours ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Event count badge */}
        {!loading && filtered.length > 0 && (
          <div style={{
            flexShrink: 0,
            background: 'rgba(15,15,26,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '4px 9px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.04)',
            fontSize: 9, color: theme.hint,
            fontFamily: 'monospace',
          }}>
            {filtered.length}
          </div>
        )}
        {/* Layer toggle */}
        <button
          onClick={() => setSatellite(!satellite)}
          style={{
            flexShrink: 0,
            width: 30, height: 28, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(15,15,26,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: theme.hint, cursor: 'pointer',
            fontSize: 12, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {satellite ? '🗺️' : '🛰️'}
        </button>
      </div>

      {/* Bottom: radar + quiet/event count */}
      <div style={{
        position: 'absolute', bottom: 68, left: 12, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', gap: 8,
      }}>
        <MiniRadar quiet={isQuiet} flash={newEventFlash} />
        {isQuiet ? (
          <div style={{
            background: 'rgba(15,15,26,0.6)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '5px 10px', borderRadius: 8, fontSize: 9,
            color: 'rgba(34,197,94,0.5)',
            border: '1px solid rgba(34,197,94,0.06)',
            fontFamily: 'monospace', letterSpacing: '0.04em',
          }}>
            ВСЕ ТИХО
          </div>
        ) : null}
      </div>

      {/* Type filter chips */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, right: 12,
        display: 'flex', gap: 5, overflowX: 'auto',
        WebkitOverflowScrolling: 'touch', zIndex: 1000,
        paddingBottom: 4, scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {FILTER_TYPES.map(t => {
          const isActive = t === 'all' ? activeType === 'all' : activeType === t
          const typeColor = t === 'all' ? '#3b82f6' : EVENT_TYPE_COLORS[t as EventType] || '#6b7280'
          return (
            <button
              key={t}
              onClick={() => { setActiveType(t); hapticImpact('light') }}
              style={{
                flexShrink: 0,
                padding: '5px 11px', borderRadius: 16,
                border: isActive ? `1px solid ${typeColor}44` : '1px solid rgba(255,255,255,0.04)',
                fontSize: 10, fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? `${typeColor}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? typeColor : theme.hint,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <span style={{ fontSize: 10 }}>{TYPE_ICONS[t]}</span>
              <span>{t === 'all' ? 'Все' : EVENT_TYPE_LABELS[t as EventType] || t}</span>
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes mapSpin { to { transform: rotate(360deg) } }
        .leaflet-container { background: ${theme.bg} !important; }
        .leaflet-tooltip {
          background: rgba(15,15,26,0.95) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          border-radius: 10px !important;
          color: ${theme.text} !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
          padding: 7px 9px !important;
          font-size: 10px !important;
          font-family: 'Inter', sans-serif !important;
          line-height: 1.3 !important;
        }
        .leaflet-tooltip-top::before { border-top-color: rgba(15,15,26,0.95) !important; }
        .leaflet-control-zoom { margin: 8px !important; }
        .leaflet-control-zoom a {
          background: rgba(15,15,26,0.85) !important;
          color: ${theme.text} !important;
          border-color: rgba(255,255,255,0.04) !important;
          border-radius: 8px !important;
          width: 32px !important; height: 32px !important;
          line-height: 32px !important;
        }
      `}</style>
    </div>
  )
}
