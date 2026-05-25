export interface Event {
  id: number;
  title: string;
  description: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  event_type: EventType;
  confidence_score: number;
  source_name: string | null;
  source_url: string | null;
  created_at: string;
  is_active: boolean;
}

export type EventType = 'drone_sighting' | 'explosion' | 'air_defense' | 'missile_danger' | 'missile_danger_cleared' | 'unconfirmed';

export interface Region {
  name: string;
  event_count: number;
  lat: number;
  lng: number;
}

export interface Stats {
  total_events: number;
  events_by_type: Record<string, number>;
  events_today: number;
}

export interface TimelineEntry {
  date: string;
  total: number;
  shot_down: number;
  explosions: number;
  sightings: number;
  air_defense: number;
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  drone_sighting: '#f59e0b',
  explosion: '#ef4444',
  air_defense: '#3b82f6',
  missile_danger: '#e11d48',
  missile_danger_cleared: '#22c55e',
  unconfirmed: '#64748b',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  drone_sighting: 'БПЛА',
  explosion: 'Взрыв',
  air_defense: 'ПВО',
  missile_danger: 'Ракеты',
  missile_danger_cleared: 'Отбой',
  unconfirmed: 'Неизв.',
};
