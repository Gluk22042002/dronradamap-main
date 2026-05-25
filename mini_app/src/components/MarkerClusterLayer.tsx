import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'

interface ClusterEvent {
  id: number
  pos: [number, number]
  color: string
  title: string
  region?: string | null
  timeStr: string
  label: string
  confidence: number
  confidenceColor: string
  onClick: (event: any) => void
  rawEvent: any
}

interface Props {
  events: ClusterEvent[]
}

export default function MarkerClusterLayer({ events }: Props) {
  const map = useMap()
  const groupRef = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    if (groupRef.current) map.removeLayer(groupRef.current)

    const mcg = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large'
        const colors: Record<string, string> = {
          small: 'rgba(59,130,246,0.2)', medium: 'rgba(59,130,246,0.3)', large: 'rgba(59,130,246,0.4)',
        }
        const borders: Record<string, string> = {
          small: 'rgba(59,130,246,0.35)', medium: 'rgba(59,130,246,0.45)', large: 'rgba(59,130,246,0.55)',
        }
        const sizes: Record<string, number> = { small: 28, medium: 36, large: 44 }
        const s = sizes[size]
        return L.divIcon({
          html: `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${colors[size]};border:2px solid ${borders[size]};backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;color:#93c5fd;font-size:${size === 'small' ? 9 : size === 'medium' ? 11 : 13}px;font-weight:700;font-family:monospace;box-shadow:0 0 16px rgba(59,130,246,0.05)">${count}</div>`,
          className: '',
          iconSize: L.point(s, s),
        })
      },
    })

    events.forEach(ev => {
      const marker = L.marker(ev.pos, {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:${ev.color};border:2.5px solid rgba(255,255,255,0.85);border-radius:50%;box-shadow:0 0 12px ${ev.color}66,0 0 4px rgba(255,255,255,0.15);animation:markerPop 0.35s ease-out both"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      })

      const tooltipContent = `<div style="font-family:'Inter',sans-serif;min-width:120px;max-width:180px">
        <div style="font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:1px;line-height:1.3">${ev.title}</div>
        <div style="display:flex;justify-content:space-between;font-size:8px;color:#94a3b8">${ev.region ? `<span>${ev.region}</span>` : ''}<span>${ev.timeStr}</span></div>
        <div style="display:flex;justify-content:space-between;margin-top:1px;padding-top:1px;border-top:1px solid rgba(255,255,255,0.04)">
          <span style="font-size:7px;font-weight:700;color:${ev.color};text-transform:uppercase">${ev.label}</span>
          <span style="font-size:7px;font-weight:600;color:${ev.confidenceColor}">${ev.confidence}%</span>
        </div>
      </div>`

      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -10], opacity: 1 })
      marker.on('click', () => ev.onClick(ev.rawEvent))
      mcg.addLayer(marker)
    })

    map.addLayer(mcg)
    groupRef.current = mcg

    return () => {
      if (groupRef.current) map.removeLayer(groupRef.current)
    }
  }, [events, map])

  return null
}
