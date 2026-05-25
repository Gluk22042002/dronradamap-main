import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

interface ClusterEvent {
  id: number;
  pos: [number, number];
  type: string;
  color: string;
  title: string;
  region?: string | null;
  timeStr: string;
  label: string;
  confidence: number;
  confidenceColor: string;
  onClick: (id: number) => void;
}

interface Props {
  events: ClusterEvent[];
}

export default function MarkerClusterLayer({ events }: Props) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (groupRef.current) {
      map.removeLayer(groupRef.current);
    }
    const mcg = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
        const colors: Record<string, string> = {
          small: 'rgba(59,130,246,0.25)',
          medium: 'rgba(59,130,246,0.35)',
          large: 'rgba(59,130,246,0.45)',
        };
        const borderColors: Record<string, string> = {
          small: 'rgba(59,130,246,0.4)',
          medium: 'rgba(59,130,246,0.5)',
          large: 'rgba(59,130,246,0.6)',
        };
        return L.divIcon({
          html: `<div style="
            width: ${size === 'small' ? 32 : size === 'medium' ? 40 : 48}px;
            height: ${size === 'small' ? 32 : size === 'medium' ? 40 : 48}px;
            border-radius: 50%;
            background: ${colors[size]};
            border: 2px solid ${borderColors[size]};
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #93c5fd;
            font-size: ${size === 'small' ? 10 : size === 'medium' ? 12 : 14}px;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
            box-shadow: 0 0 20px rgba(59,130,246,0.06);
          ">${count}</div>`,
          className: '',
          iconSize: L.point(size === 'small' ? 32 : size === 'medium' ? 40 : 48, size === 'small' ? 32 : size === 'medium' ? 40 : 48),
        });
      },
    });

    events.forEach(ev => {
      const marker = L.marker(ev.pos, {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            width: 16px; height: 16px;
            background: ${ev.color};
            border: 2px solid rgba(255,255,255,0.85);
            border-radius: 50%;
            box-shadow: 0 0 12px ${ev.color}66, 0 0 4px rgba(255,255,255,0.15);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            animation: markerIn 0.4s ease-out both;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      });

      const tooltipContent = `<div style="font-family:'Inter',sans-serif;min-width:130px;max-width:200px">
        <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:2px;line-height:1.3">${ev.title}</div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#94a3b8">${ev.region ? `<span>${ev.region}</span>` : ''}<span>${ev.timeStr}</span></div>
        <div style="display:flex;justify-content:space-between;margin-top:2px;padding-top:2px;border-top:1px solid rgba(255,255,255,0.04)">
          <span style="font-size:8px;font-weight:700;color:${ev.color};text-transform:uppercase">${ev.label}</span>
          <span style="font-size:8px;font-weight:600;color:${ev.confidenceColor}">${ev.confidence}%</span>
        </div>
      </div>`;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -12],
        opacity: 1,
      });

      marker.on('click', () => ev.onClick(ev.id));

      mcg.addLayer(marker);
    });

    map.addLayer(mcg);
    groupRef.current = mcg;

    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current);
        groupRef.current = null;
      }
    };
  }, [events, map]);

  return null;
}
