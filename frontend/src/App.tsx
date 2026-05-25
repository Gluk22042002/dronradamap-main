import { useState, useEffect, useCallback } from 'react';
import MapView from './components/Map';
import EventList from './components/EventList';
import RegionOverview from './components/RegionOverview';
import Filters from './components/Filters';
import StatsBar from './components/StatsBar';
import Header from './components/Header';
import EventDetail from './components/EventDetail';
import TelegramBanner from './components/TelegramBanner';
import { useEvents } from './hooks/useApi';

type PanelTab = 'events' | 'regions';

export default function App() {
  const [region, setRegion] = useState('');
  const [eventType, setEventType] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<boolean>(false);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('events');
  const [light, setLight] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', light);
  }, [light]);

  const { events: allEvents } = useEvents({ region, event_type: eventType, hours: 720 });
  const fullEvent = selectedEvent ? allEvents.find(e => e.id === selectedEvent) ?? null : null;

  const handleSelectEvent = useCallback((id: number) => {
    setSelectedEvent(id);
    setSelectedEventDetail(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEventDetail(false);
    setSelectedEvent(null);
  }, []);

  const handleMapSelectEvent = useCallback((id: number | null) => {
    if (id === null) {
      handleCloseDetail();
      return;
    }
    handleSelectEvent(id);
  }, [handleCloseDetail, handleSelectEvent]);

  const panelWidth = panelOpen ? 340 : 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      width: '100vw', overflow: 'hidden', position: 'relative',
    }}>
      <div className="mesh-bg" />
      <div className="grid-overlay" />
      <Header light={light} onToggleTheme={() => setLight(!light)} />
      <StatsBar />
      <TelegramBanner />

      <div className="app-layout" style={{
        display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1,
      }}>
        {/* Map container */}
        <div className="map-area" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <MapView
            region={region}
            eventType={eventType}
            selectedEvent={selectedEvent}
            onSelectEvent={handleMapSelectEvent}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen(!filtersOpen)}
            onRegionChange={setRegion}
            onEventTypeChange={setEventType}
          />

          {/* Panel toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="btn-icon"
            style={{
              position: 'absolute', right: 12, top: 12, zIndex: 1000,
              width: 34, height: 34, borderRadius: 8,
              fontSize: 14,
            }}
          >
            {panelOpen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        </div>

        {/* Side panel */}
        <div className="side-panel" style={{
          width: panelWidth,
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(9,9,18,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}>
          {panelOpen && (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <button
                  onClick={() => setPanelTab('events')}
                  style={{
                    flex: 1, padding: '9px 12px', border: 'none',
                    borderBottom: panelTab === 'events' ? '2px solid #60a5fa' : '2px solid transparent',
                    background: 'transparent',
                    color: panelTab === 'events' ? '#60a5fa' : 'var(--text-muted)',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    fontFamily: 'inherit',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  События
                </button>
                <button
                  onClick={() => setPanelTab('regions')}
                  style={{
                    flex: 1, padding: '9px 12px', border: 'none',
                    borderBottom: panelTab === 'regions' ? '2px solid #60a5fa' : '2px solid transparent',
                    background: 'transparent',
                    color: panelTab === 'regions' ? '#60a5fa' : 'var(--text-muted)',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    fontFamily: 'inherit',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  Регионы
                </button>
              </div>

              {/* Content */}
              {panelTab === 'events' && (
                <EventList
                  key={`${region}-${eventType}`}
                  region={region}
                  eventType={eventType}
                  onSelectEvent={handleSelectEvent}
                  onHoverEvent={setHoveredEvent}
                />
              )}

              {panelTab === 'regions' && (
                <RegionOverview
                  region={region}
                  onRegionChange={(r) => { setRegion(r); if (r) setPanelTab('events'); }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEventDetail && fullEvent && (
        <EventDetail event={fullEvent} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
