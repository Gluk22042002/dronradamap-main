import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEvents } from '../hooks/useApi';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type EventType } from '../types';
import Filters from './Filters';
import RadarWidget from './RadarWidget';
import MarkerClusterLayer from './MarkerClusterLayer';

interface Trajectory {
  latOffset: number;
  lngOffset: number;
}

const REGION_TRAJECTORIES: Record<string, Trajectory> = {
  'Краснодарский край': { latOffset: -0.8, lngOffset: -0.3 },
  'Ростовская область': { latOffset: -0.6, lngOffset: -0.2 },
  'Воронежская область': { latOffset: -1.0, lngOffset: -0.5 },
  'Белгородская область': { latOffset: -0.5, lngOffset: -0.3 },
  'Курская область': { latOffset: -1.2, lngOffset: -0.8 },
  'Брянская область': { latOffset: -1.5, lngOffset: -1.0 },
  'Волгоградская область': { latOffset: -1.0, lngOffset: 0.5 },
  'Астраханская область': { latOffset: -0.8, lngOffset: 0.5 },
  'Крым': { latOffset: -0.5, lngOffset: -0.5 },
  'Севастополь': { latOffset: -0.5, lngOffset: -0.5 },
  'Липецкая область': { latOffset: -1.5, lngOffset: -1.0 },
  'Тамбовская область': { latOffset: -1.5, lngOffset: -0.5 },
  'Московская область': { latOffset: -2.5, lngOffset: -2.0 },
  'Москва': { latOffset: -2.5, lngOffset: -2.0 },
  'Калужская область': { latOffset: -2.0, lngOffset: -1.5 },
  'Тульская область': { latOffset: -2.0, lngOffset: -1.5 },
  'Тверская область': { latOffset: -3.0, lngOffset: -2.0 },
  'Ярославская область': { latOffset: -3.0, lngOffset: -2.0 },
  'Владимирская область': { latOffset: -2.5, lngOffset: -1.5 },
  'Рязанская область': { latOffset: -2.0, lngOffset: -1.0 },
  'Смоленская область': { latOffset: -3.0, lngOffset: -2.5 },
  'Псковская область': { latOffset: -3.5, lngOffset: -3.0 },
  'Ленинградская область': { latOffset: -4.0, lngOffset: -3.0 },
  'Санкт-Петербург': { latOffset: -4.0, lngOffset: -3.0 },
  'Новгородская область': { latOffset: -3.5, lngOffset: -2.5 },
  'Нижегородская область': { latOffset: -3.0, lngOffset: -1.0 },
  'Республика Татарстан': { latOffset: -4.0, lngOffset: -1.0 },
  'Самарская область': { latOffset: -4.0, lngOffset: -0.5 },
  'Саратовская область': { latOffset: -2.0, lngOffset: 0.5 },
  'Ульяновская область': { latOffset: -3.5, lngOffset: -0.5 },
  'Кировская область': { latOffset: -4.0, lngOffset: -1.5 },
  'Пермский край': { latOffset: -5.0, lngOffset: -1.0 },
  'Свердловская область': { latOffset: -5.0, lngOffset: 0.0 },
  'Челябинская область': { latOffset: -5.0, lngOffset: 0.5 },
  'Республика Башкортостан': { latOffset: -4.5, lngOffset: -0.5 },
  'Оренбургская область': { latOffset: -4.0, lngOffset: 0.5 },
  'Республика Крым': { latOffset: -0.5, lngOffset: -0.5 },
};

function getLaunchPoint(lat: number, lng: number, region?: string | null): [number, number] {
  if (region && REGION_TRAJECTORIES[region]) {
    const t = REGION_TRAJECTORIES[region];
    return [lat + t.latOffset, lng + t.lngOffset];
  }
  const launchLat = Math.max(44, Math.min(52, lat - 2.5));
  const launchLng = Math.max(28, Math.min(40, lng - 1.5));
  return [launchLat, launchLng];
}

const NATO_COUNTRIES = new Set([
  'United States', 'Canada', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain',
  'Netherlands', 'Turkey', 'Poland', 'Romania', 'Greece', 'Czech Republic', 'Hungary',
  'Portugal', 'Sweden', 'Belgium', 'Denmark', 'Norway', 'Finland', 'Slovakia',
  'Bulgaria', 'Croatia', 'Lithuania', 'Slovenia', 'Latvia', 'Estonia', 'Luxembourg',
  'Albania', 'North Macedonia', 'Montenegro', 'Iceland',
]);

const TIME_OPTIONS = [
  { label: 'Сейчас', hours: 1 },
  { label: '6ч', hours: 6 },
  { label: '12ч', hours: 12 },
  { label: '24ч', hours: 24 },
  { label: '3д', hours: 72 },
  { label: '7д', hours: 168 },
  { label: '30д', hours: 720 },
];

const TYPE_ICONS: Record<string, string> = {
  drone_sighting: '🛸',
  explosion: '💥',
  air_defense: '⚡',
  missile_danger: '🚀',
  missile_danger_cleared: '✅',
  unconfirmed: '❓',
};

function jitterCoord(id: number, base: number, intensity = 0.04): number {
  const seed = (id * 9301 + 49297) % 233280;
  const ratio = seed / 233280;
  return base + (ratio - 0.5) * intensity;
}

function createIconSvg(type: EventType, color: string): string {
  switch (type) {
    case 'drone_sighting':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="34" height="34">
        <g transform="rotate(35 24 24)">
          <ellipse cx="24" cy="24" rx="13" ry="5" fill="${color}" opacity="0.9"/>
          <rect x="11" y="23" width="4" height="2" rx="1" fill="${color}" opacity="0.9"/>
          <rect x="33" y="23" width="4" height="2" rx="1" fill="${color}" opacity="0.9"/>
          <circle cx="24" cy="24" r="2.5" fill="#fff" opacity="0.5"/>
          <rect x="9" y="18" width="3" height="7" rx="0.5" fill="${color}" opacity="0.5"/>
          <rect x="36" y="18" width="3" height="7" rx="0.5" fill="${color}" opacity="0.5"/>
          <rect x="13" y="11" width="22" height="2.5" rx="1" fill="${color}" opacity="0.35"/>
        </g>
      </svg>`;
    case 'explosion':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
        <polygon points="24,5 28,16 40,16 30,24 34,36 24,28 14,36 18,24 8,16 20,16" fill="${color}" opacity="0.9"/>
        <circle cx="24" cy="20" r="3.5" fill="#fff" opacity="0.35"/>
      </svg>`;
    case 'air_defense':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
        <circle cx="24" cy="24" r="10" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.9"/>
        <circle cx="24" cy="24" r="4" fill="${color}" opacity="0.9"/>
        <line x1="24" y1="14" x2="24" y2="34" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
        <line x1="14" y1="24" x2="34" y2="24" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
        <circle cx="24" cy="24" r="2" fill="#fff" opacity="0.5"/>
      </svg>`;
    case 'missile_danger_cleared':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30" height="30">
        <circle cx="24" cy="24" r="12" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>
        <polyline points="16,24 21,29 32,18" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
        <circle cx="24" cy="24" r="3" fill="${color}" opacity="0.3"/>
      </svg>`;
    case 'missile_danger':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="34" height="34">
        <g transform="rotate(-45 24 24)">
          <ellipse cx="24" cy="12" rx="4" ry="10" fill="${color}" opacity="0.9"/>
          <polygon points="24,2 20,8 28,8" fill="${color}" opacity="0.9"/>
          <rect x="21" y="20" width="6" height="3" rx="1" fill="${color}" opacity="0.7"/>
          <rect x="19" y="24" width="10" height="2" rx="1" fill="${color}" opacity="0.5"/>
          <line x1="24" y1="0" x2="24" y2="-2" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
          <circle cx="24" cy="10" r="2" fill="#fff" opacity="0.4"/>
        </g>
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="28" height="28">
        <circle cx="24" cy="24" r="11" fill="none" stroke="${color}" stroke-width="2" opacity="0.7" stroke-dasharray="4 3"/>
        <text x="24" y="28" text-anchor="middle" font-size="15" fill="${color}" opacity="0.8" font-weight="bold">?</text>
      </svg>`;
  }
}

function createIcon(type: EventType, color: string) {
  return L.divIcon({
    className: '',
    html: createIconSvg(type, color),
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

function ArrowMarker({ from, to, color }: { from: [number, number]; to: [number, number]; color: string }) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * (180 / Math.PI);
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const arrowIcon = L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${angle}deg)"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 16,5 0,10" fill="${color}" opacity="0.7"/></svg></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 5],
  });
  return <Marker position={mid} icon={arrowIcon} interactive={false} />;
}

function BorderLayer() {
  const map = useMap();
  const [borders, setBorders] = useState<any>(null);
  const [regions, setRegions] = useState<any>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(data => {
        const filtered = {
          type: 'FeatureCollection',
          features: data.features.filter((f: any) => {
            const name = f.properties?.NAME || f.properties?.ADMIN || '';
            return name === 'Russia' || name === 'Ukraine' || name === 'Belarus' || NATO_COUNTRIES.has(name);
          }),
        };
        setBorders(filtered);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kronverger/russian-regions-geojson/master/regions.geojson')
      .then(r => r.json())
      .then(data => setRegions(data))
      .catch(() => {});
  }, []);

  const countryStyle = useCallback((feature: any) => {
    const name = feature.properties?.NAME || feature.properties?.ADMIN || '';
    if (name === 'Russia') return { color: '#60a5fa', weight: 2.5, fillOpacity: 0.04, fillColor: '#1e3a5f' };
    if (name === 'Ukraine') return { color: '#fbbf24', weight: 2, fillOpacity: 0.04, fillColor: '#5f4a1e' };
    if (name === 'Belarus') return { color: '#a78bfa', weight: 2, fillOpacity: 0.04, fillColor: '#3b2f5f' };
    return { color: '#475569', weight: 1.5, fillOpacity: 0.02, fillColor: '#1e293b' };
  }, []);

  const regionStyle = useCallback(() => ({
    color: '#334155',
    weight: 0.8,
    fillOpacity: 0,
  }), []);

  return (
    <>
      {borders && <GeoJSON key="countries" data={borders} style={countryStyle} />}
      {regions && <GeoJSON key="regions" data={regions} style={regionStyle} />}
    </>
  );
}

function MapController({ selectedEvent, events, region }: {
  selectedEvent: number | null;
  events: any[];
  region: string;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (selectedEvent) {
      const ev = events.find(e => e.id === selectedEvent);
      if (ev?.lat && ev?.lng) {
        map.setView([jitterCoord(ev.id, ev.lat!), jitterCoord(ev.id + 1000, ev.lng!)], 9, { animate: true, duration: 0.5 });
      }
    }
  }, [selectedEvent, map, events]);

  useEffect(() => {
    if (fitted.current) return;
    if (events.length > 0 && !region && !selectedEvent) {
      const bounds = L.latLngBounds(events.map(e => [jitterCoord(e.id, e.lat!), jitterCoord(e.id + 1000, e.lng!)] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });
      fitted.current = true;
    }
  }, [events, region, selectedEvent, map]);

  return null;
}

// === Legend Component ===
function MapLegend() {
  const types: { key: EventType; label: string; color: string }[] = [
    { key: 'drone_sighting', label: 'БПЛА', color: '#f59e0b' },
    { key: 'explosion', label: 'Взрыв', color: '#ef4444' },
    { key: 'air_defense', label: 'ПВО', color: '#3b82f6' },
    { key: 'missile_danger', label: 'Ракеты', color: '#e11d48' },
    { key: 'missile_danger_cleared', label: 'Отбой', color: '#22c55e' },
    { key: 'unconfirmed', label: 'Неизв.', color: '#64748b' },
  ];
  return (
    <div className="animate-in" style={{
      position: 'absolute', bottom: 56, right: 12, zIndex: 1000,
      background: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 9, padding: '7px 9px',
      border: '1px solid rgba(255,255,255,0.04)',
      fontSize: 8, color: 'var(--text-muted)',
      display: 'flex', flexDirection: 'column', gap: 2,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      {types.map(t => (
        <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0, boxShadow: `0 0 6px ${t.color}44` }} />
          <span style={{ fontWeight: 500 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

interface MapViewProps {
  region: string;
  eventType: string;
  selectedEvent: number | null;
  onSelectEvent: (id: number | null) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onRegionChange: (v: string) => void;
  onEventTypeChange: (v: string) => void;
}

export default function MapView({ region, eventType, selectedEvent, onSelectEvent, filtersOpen, onToggleFilters, onRegionChange, onEventTypeChange }: MapViewProps) {
  const [hours, setHours] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [satellite, setSatellite] = useState(false);
  const { events, loading, refetch } = useEvents({ region, event_type: eventType, hours });
  const [clickedId, setClickedId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newEventFlash, setNewEventFlash] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval>>();
  const prevCount = useRef(0);

  const handleSelect = useCallback((id: number) => {
    setClickedId(id);
    onSelectEvent(id);
  }, [onSelectEvent]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
    }, 30000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [refetch]);

  // Flash on new events
  useEffect(() => {
    if (loading) return;
    if (events.length > prevCount.current && prevCount.current > 0) {
      setNewEventFlash(true);
      setTimeout(() => setNewEventFlash(false), 2000);
    }
    prevCount.current = events.length;
  }, [events, loading]);

  // Update lastUpdate when events load
  const prevEventsLen = useRef(0);
  useEffect(() => {
    if (events.length !== prevEventsLen.current) {
      setLastUpdate(new Date());
      prevEventsLen.current = events.length;
    }
  }, [events]);

  const validEvents = events.filter(e => e.lat && e.lng);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[55.7558, 37.6173]}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={satellite ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'} maxZoom={19} />
        {!satellite && <TileLayer url='https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png' maxZoom={19} opacity={0.6} />}
        <BorderLayer />
        <MapController selectedEvent={selectedEvent || clickedId} events={validEvents} region={region} />
        <MarkerClusterLayer
          events={validEvents.map(event => {
            const color = EVENT_TYPE_COLORS[event.event_type as EventType] || '#6b7280';
            const confidencePct = Math.round(event.confidence_score * 100);
            const confidenceColor = confidencePct > 70 ? '#22c55e' : confidencePct > 40 ? '#f59e0b' : '#ef4444';
            return {
              id: event.id,
              pos: [jitterCoord(event.id, event.lat!), jitterCoord(event.id + 1000, event.lng!)] as [number, number],
              type: event.event_type,
              color,
              title: event.title,
              region: event.region,
              timeStr: new Date(event.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              label: EVENT_TYPE_LABELS[event.event_type as EventType] || event.event_type,
              confidence: confidencePct,
              confidenceColor,
              onClick: handleSelect,
            };
          })}
        />
      </MapContainer>

      {/* Centered top bar: filters + time range */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {/* Filters button */}
        <button
          onClick={onToggleFilters}
          className="btn-icon"
          style={{
            padding: '5px 10px', borderRadius: 8,
            fontSize: 10, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          Фильтры
          {(region || eventType) && (
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
          )}
        </button>

        {/* Time range pills */}
        <div style={{
          display: 'flex', gap: 2,
          background: 'rgba(15,15,26,0.75)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 8, padding: 2,
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt.hours}
              onClick={() => setHours(opt.hours)}
              style={{
                padding: '4px 7px', borderRadius: 5,
                border: 'none',
                background: hours === opt.hours ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: hours === opt.hours ? '#60a5fa' : 'var(--text-muted)',
                fontSize: 9, fontWeight: hours === opt.hours ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all var(--transition-fast)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter dropdown */}
        {filtersOpen && (
          <div className="animate-down" style={{
            position: 'absolute', top: 38, left: 0, zIndex: 1000,
            padding: 14, borderRadius: 12,
            background: 'rgba(15,15,26,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border)',
            minWidth: 210,
            boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(59,130,246,0.04)',
          }}>
            <Filters
              region={region}
              eventType={eventType}
              onRegionChange={onRegionChange}
              onEventTypeChange={onEventTypeChange}
            />
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute', bottom: 20, right: 16, zIndex: 1000,
          background: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '7px 12px', borderRadius: 9, fontSize: 10, color: '#94a3b8',
          border: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: 'var(--shadow-sm)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.04)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Загрузка...
        </div>
      )}

      {/* Radar + event count + last update */}
      <div style={{
        position: 'absolute', bottom: 20, left: 16, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', gap: 8,
      }}>
        <RadarWidget
          flash={newEventFlash}
          quiet={!loading && validEvents.length === 0 && hours === 1}
        />
        {!loading && validEvents.length === 0 && hours === 1 ? (
          <div style={{
            background: 'rgba(15,15,26,0.65)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '6px 12px', borderRadius: 8, fontSize: 10,
            color: 'rgba(34,197,94,0.45)',
            border: '1px solid rgba(34,197,94,0.06)',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" opacity="0.4"/>
              <path d="M12 6v6l4 2" opacity="0.4"/>
            </svg>
            ВСЕ ТИХО
          </div>
        ) : !loading && validEvents.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              background: 'rgba(15,15,26,0.7)', backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '5px 10px', borderRadius: 7, fontSize: 9,
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.03)',
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#22c55e', display: 'inline-block',
                animation: 'breathe 2s ease-in-out infinite',
              }} />
              {validEvents.length}
            </div>
            <div style={{
              background: 'rgba(15,15,26,0.5)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '3px 8px', borderRadius: 5, fontSize: 7,
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.02)',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.5,
            }}>
              {lastUpdate.toLocaleTimeString('ru-RU')}
            </div>
          </div>
        ) : null}
      </div>

      {/* Layer toggle - compact group */}
      <div style={{
        position: 'absolute', top: 56, right: 12, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <button
          onClick={() => setSatellite(!satellite)}
          className="btn-icon"
          style={{
            width: 30, height: 28, borderRadius: 7,
            fontSize: 12, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={satellite ? 'Карта' : 'Спутник'}
        >
          {satellite ? '🗺' : '🛰'}
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="btn-icon"
          style={{
            width: 30, height: 28, borderRadius: 7,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          title="Легенда"
        >
          {showLegend ? '✕' : '?'}
        </button>
      </div>

      {showLegend && <MapLegend />}

      {/* Selected event close badge */}
      {selectedEvent && (
        <div onClick={() => onSelectEvent(null)} style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '7px 18px', borderRadius: 10,
          background: 'rgba(15,15,26,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border)',
          fontSize: 10, color: 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Закрыть событие
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
