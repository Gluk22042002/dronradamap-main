import { useState, useEffect, useCallback, useRef } from 'react';
import { Event, Region, Stats, TimelineEntry } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useEvents(params?: {
  region?: string;
  event_type?: string;
  hours?: number;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (params?.region) q.set('region', params.region);
      if (params?.event_type) q.set('event_type', params.event_type);
      if (params?.hours) q.set('hours', String(params.hours));
      const data = await fetchJson<Event[]>(`/events/map?${q}`);
      setEvents(data);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setLoading(false);
    }
  }, [params?.region, params?.event_type, params?.hours]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
}

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    fetchJson<Region[]>('/regions').then(setRegions).catch(console.error);
  }, []);

  return regions;
}

export function useStats(refreshMs = 0) {
  const [stats, setStats] = useState<Stats | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchJson<Stats>('/events/stats');
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (refreshMs <= 0) return;
    const id = setInterval(refetch, refreshMs);
    return () => clearInterval(id);
  }, [refetch, refreshMs]);

  return { stats, refetch };
}

export function useEventList(page = 1, filters?: Record<string, string>, refreshMs = 0) {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '50' });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
      }
      const data = await fetchJson<{ events: Event[]; total: number }>(`/events?${q}`);
      setEvents(data.events);
      setTotal(data.total);
    } catch (e) {
      console.error('Failed to fetch event list:', e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (refreshMs <= 0) return;
    const id = setInterval(fetchList, refreshMs);
    return () => clearInterval(id);
  }, [fetchList, refreshMs]);

  return { events, total, loading, refetch: fetchList };
}

export function useTimeline(days = 30, refreshMs = 0) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<TimelineEntry[]>(`/events/timeline?days=${days}`);
      setTimeline(data);
    } catch (e) {
      console.error('Failed to fetch timeline:', e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  useEffect(() => {
    if (refreshMs <= 0) return;
    const id = setInterval(fetchTimeline, refreshMs);
    return () => clearInterval(id);
  }, [fetchTimeline, refreshMs]);

  return { timeline, loading, refetch: fetchTimeline };
}
