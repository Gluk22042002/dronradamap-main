import type { Event, Region, Stats } from './types';

export interface TimelineEntry {
  date: string;
  total: number;
  shot_down: number;
  explosions: number;
  sightings: number;
  air_defense: number;
}

const API = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API}${url}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getMapEvents(hours = 72): Promise<Event[]> {
  return fetchJson<Event[]>(`/events/map?hours=${hours}`);
}

export function getEvents(page = 1, limit = 30, filters?: Record<string, string>): Promise<{ events: Event[]; total: number }> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
  return fetchJson(`/events?${q}`);
}

export function getRegions(): Promise<Region[]> {
  return fetchJson<Region[]>('/regions');
}

export function getStats(): Promise<Stats> {
  return fetchJson<Stats>('/events/stats');
}

export function getEvent(id: number): Promise<Event> {
  return fetchJson<Event>(`/events/${id}`);
}

export function getTimeline(days = 7): Promise<TimelineEntry[]> {
  return fetchJson<TimelineEntry[]>(`/events/timeline?days=${days}`);
}
