import { useMemo, useRef, useState, useCallback } from 'react'
import type { GameState } from '../sim/types'
import { regionName, CENTROIDS } from '../sim/setup'
import { t } from '../i18n'
import geo from '../data/world.geo.json'
import antGeo from '../data/antarctica.geo.json'

interface Feature {
  id: string
  properties: { name: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
}
const FEATURES = (geo as { features: Feature[] }).features
const ANT_FEATURES = (antGeo as unknown as { features: Feature[] }).features

const W = 1000, H = 500
const proj = (lon: number, lat: number): [number, number] => [(lon + 180) * (W / 360), (90 - lat) * (H / 180)]

function ringPath(ring: number[][]): string {
  let d = ''
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = proj(ring[i][0], ring[i][1])
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2)
  }
  return d + 'Z'
}

const PATHS: Record<string, string> = {}
let LAND_PATH = ''
for (const f of FEATURES) {
  let d = ''
  if (f.geometry.type === 'Polygon') {
    for (const ring of f.geometry.coordinates as number[][][]) d += ringPath(ring)
  } else {
    for (const poly of f.geometry.coordinates as number[][][][]) for (const ring of poly) d += ringPath(ring)
  }
  PATHS[f.id] = d
  LAND_PATH += d
}
let ANT_PATH = ''
for (const f of ANT_FEATURES) {
  if (f.geometry.type === 'Polygon') for (const ring of f.geometry.coordinates as number[][][]) ANT_PATH += ringPath(ring)
  else for (const poly of f.geometry.coordinates as number[][][][]) for (const ring of poly) ANT_PATH += ringPath(ring)
}

// graticule every 30 degrees
const GRATICULE = (() => {
  let d = ''
  for (let lon = -150; lon <= 150; lon += 30) {
    const [x] = proj(lon, 0)
    d += `M${x.toFixed(1)} 0V${H}`
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = proj(0, lat)
    d += `M0 ${y.toFixed(1)}H${W}`
  }
  return d
})()

interface Props {
  state: GameState
  selected: string | null
  onSelect: (countryId: string | null, regionId?: string) => void
  className?: string
}

export default function MapView({ state, selected, onSelect, className }: Props) {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [hover, setHover] = useState<{ region: string; cx: number; cy: number } | null>(null)
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const occupiedBy: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {}
    for (const w of state.wars) if (!w.over) for (const [r, occ] of Object.entries(w.occupations)) m[r] = occ
    return m
  }, [state.wars])

  const occRegions = useMemo(() => {
    const m = new Set<string>()
    for (const w of state.wars) if (!w.over) for (const r of Object.keys(w.occupations)) m.add(r)
    return m
  }, [state.wars])

  const colorOf = useCallback((regionId: string): string => {
    const occ = occupiedBy[regionId]
    const owner = occ ?? state.regionOwner[regionId]
    const c = state.countries[owner]
    if (!c) return '#2c3a4d'
    if (!c.alive) return '#252f3d'
    return c.color
  }, [state.regionOwner, state.countries, occupiedBy])

  const zoomBy = (factor: number) => {
    setView(v => {
      const nk = Math.max(1, Math.min(16, v.k * factor))
      const cx = W / 2, cy = H / 2
      const wx = (cx - v.x) / v.k
      const wy = (cy - v.y) / v.k
      return { k: nk, x: cx - wx * nk, y: cy - wy * nk }
    })
  }

  const onWheel = useCallback((e: React.WheelEvent) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const my = ((e.clientY - rect.top) / rect.height) * H
    setView(v => {
      const nk = Math.max(1, Math.min(16, v.k * (e.deltaY < 0 ? 1.25 : 0.8)))
      const wx = (mx - v.x) / v.k
      const wy = (my - v.y) / v.k
      return { k: nk, x: mx - wx * nk, y: my - wy * nk }
    })
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [view])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
    if (drag.current.moved && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      setView(v => ({ ...v, x: drag.current!.vx + dx * (W / rect.width), y: drag.current!.vy + dy * (H / rect.height) }))
    }
  }, [])

  const onPointerUp = useCallback(() => { setTimeout(() => { drag.current = null }, 0) }, [])

  const clickRegion = (regionId: string) => {
    if (drag.current?.moved) return
    const occ = occupiedBy[regionId]
    const owner = occ ?? state.regionOwner[regionId]
    onSelect(owner || null, regionId)
  }

  const hoverInfo = useMemo(() => {
    if (!hover) return null
    const region = hover.region
    const occ = occupiedBy[region]
    const owner = occ ?? state.regionOwner[region]
    const country = owner ? state.countries[owner] : null
    return { region, occ, country }
  }, [hover, occupiedBy, state.regionOwner, state.countries])

  // country labels: shown when the country's screen area is big enough
  const labels = useMemo(() => {
    const byCountry: Record<string, { area: number; lon: number; lat: number }> = {}
    for (const [region, meta] of Object.entries(CENTROIDS)) {
      const owner = state.regionOwner[region]
      if (!owner) continue
      const cur = byCountry[owner]
      const a = (meta as { area?: number }).area ?? 0
      if (!cur) byCountry[owner] = { area: a, lon: meta.lon, lat: meta.lat }
      else {
        cur.area += a
        if (a > 0 && cur.area === a) { cur.lon = meta.lon; cur.lat = meta.lat }
        if (a > (CENTROIDS[Object.keys(byCountry).find(k => k === owner) ?? '']?.lon ? 0 : -1)) { /* keep biggest */ }
      }
    }
    // fix centroid of biggest region
    const biggest: Record<string, { area: number; lon: number; lat: number }> = {}
    for (const [region, meta] of Object.entries(CENTROIDS)) {
      const owner = state.regionOwner[region]
      if (!owner) continue
      const a = (meta as { area?: number }).area ?? 0
      if (!biggest[owner] || a > biggest[owner].area) biggest[owner] = { area: a, lon: meta.lon, lat: meta.lat }
    }
    for (const [owner, b] of Object.entries(biggest)) {
      if (byCountry[owner]) { byCountry[owner].lon = b.lon; byCountry[owner].lat = b.lat }
    }
    const out: { x: number; y: number; name: string; size: number }[] = []
    for (const [owner, info] of Object.entries(byCountry)) {
      const c = state.countries[owner]
      if (!c || !c.alive) continue
      const screenArea = info.area * view.k * view.k
      if (screenArea < 900) continue
      const [x, y] = proj(info.lon, info.lat)
      out.push({ x, y, name: c.name, size: Math.max(3, Math.min(11, 3 + screenArea / 9000)) / view.k })
    }
    return out
  }, [state.regionOwner, state.countries, view.k])

  return (
    <div className={'map-wrap ' + (className ?? '')}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="map-svg"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#12233c" />
            <stop offset="0.5" stopColor="#0c1a2e" />
            <stop offset="1" stopColor="#081221" />
          </linearGradient>
          <pattern id="occ" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" />
          </pattern>
          <filter id="landShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.55" />
          </filter>
          <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.4)" />
          </radialGradient>
        </defs>
        <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="url(#ocean)" />
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          <path d={GRATICULE} stroke="rgba(140,170,210,0.07)" strokeWidth={0.5 / view.k} fill="none" />
          {/* antarctica decorative */}
          <path d={ANT_PATH} fill="#33445c" stroke="#0a1420" strokeWidth={0.6 / Math.sqrt(view.k)} opacity={0.75} />
          {/* land shadow silhouette */}
          <path d={LAND_PATH} fill="#0a1526" stroke="#04101e" strokeWidth={2.2 / view.k} filter="url(#landShadow)" />
          {FEATURES.map(f => {
            const owner = state.regionOwner[f.id]
            const isSel = owner && selected === owner
            const isPlayer = owner === state.playerId
            return (
              <path
                key={f.id}
                d={PATHS[f.id]}
                fill={colorOf(f.id)}
                stroke={isPlayer ? '#f5d76e' : isSel ? '#ffffff' : '#0a1420'}
                strokeWidth={(isPlayer ? 1.8 : isSel ? 1.5 : 0.55) / Math.sqrt(view.k)}
                className="region"
                style={isPlayer ? { filter: 'drop-shadow(0 0 3px rgba(245,215,110,0.7))' } : undefined}
                onClick={() => clickRegion(f.id)}
                onMouseEnter={(e) => setHover({ region: f.id, cx: e.clientX, cy: e.clientY })}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
          {[...occRegions].map(r => PATHS[r] ? (
            <path key={'occ-' + r} d={PATHS[r]} fill="url(#occ)" stroke="none" pointerEvents="none" />
          ) : null)}
          {labels.map((l, i) => (
            <text
              key={i}
              x={l.x} y={l.y}
              textAnchor="middle"
              fontSize={l.size}
              fill="rgba(240,244,252,0.82)"
              stroke="rgba(5,10,20,0.75)"
              strokeWidth={l.size / 9}
              paintOrder="stroke"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.08em', textTransform: 'uppercase', pointerEvents: 'none' }}
            >{l.name}</text>
          ))}
        </g>
        <rect x={0} y={0} width={W} height={H} fill="url(#vignette)" pointerEvents="none" />
      </svg>

      <div className="map-zoom">
        <button onClick={() => zoomBy(1.5)} title="+">＋</button>
        <button onClick={() => zoomBy(1 / 1.5)} title="-">－</button>
        <button onClick={() => setView({ x: 0, y: 0, k: 1 })} title="reset">⌂</button>
      </div>
      <div className="map-hint">{t(state.lang, 'zoom_hint')}</div>

      {hoverInfo && hover && (
        <div className="map-tip" style={{ left: Math.min(hover.cx + 14, window.innerWidth - 250), top: hover.cy + 10 }}>
          <b>{regionName(hoverInfo.region, state.lang, Math.floor(state.month / 12))}</b>
          {hoverInfo.country && (
            <div>
              <span className="tip-flag">{hoverInfo.country.flag}</span>
              {' '}{hoverInfo.country.name}
              {hoverInfo.occ && <em className="tip-occ"> ⚔ {state.lang === 'ru' ? 'оккупирован' : 'occupied'}</em>}
              {hoverInfo.country.isPlayer && <em className="tip-you"> — {state.lang === 'ru' ? 'вы' : 'you'}</em>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
