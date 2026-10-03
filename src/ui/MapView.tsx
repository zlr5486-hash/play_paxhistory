import { useMemo, useRef, useState, useCallback } from 'react'
import type { GameState } from '../sim/types'
import { regionName } from '../sim/setup'
import geo from '../data/world.geo.json'

interface Feature {
  id: string
  properties: { name: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
}
const FEATURES = (geo as { features: Feature[] }).features

const W = 1000, H = 500
const proj = (lon: number, lat: number): [number, number] => [(lon + 180) * (W / 360), (90 - lat) * (H / 180)]

function ringPath(ring: number[][]): string {
  let d = ''
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = proj(ring[i][0], ring[i][1])
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d + 'Z'
}

const PATHS: Record<string, string> = {}
for (const f of FEATURES) {
  let d = ''
  if (f.geometry.type === 'Polygon') {
    for (const ring of f.geometry.coordinates as number[][][]) d += ringPath(ring)
  } else {
    for (const poly of f.geometry.coordinates as number[][][][]) for (const ring of poly) d += ringPath(ring)
  }
  PATHS[f.id] = d
}

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

  const atWarRegions: Record<string, boolean> = useMemo(() => {
    const m: Record<string, boolean> = {}
    for (const w of state.wars) if (!w.over) for (const r of Object.keys(w.occupations)) m[r] = true
    return m
  }, [state.wars])

  const colorOf = useCallback((regionId: string): string => {
    const occ = occupiedBy[regionId]
    const owner = occ ?? state.regionOwner[regionId]
    const c = state.countries[owner]
    if (!c) return '#333'
    if (!c.alive) return '#2a2a2a'
    return c.color
  }, [state.regionOwner, state.countries, occupiedBy])

  const onWheel = useCallback((e: React.WheelEvent) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const my = ((e.clientY - rect.top) / rect.height) * H
    setView(v => {
      const nk = Math.max(1, Math.min(14, v.k * (e.deltaY < 0 ? 1.25 : 0.8)))
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
          <pattern id="occ" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" />
          </pattern>
        </defs>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#0b1626" />
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {FEATURES.map(f => {
            const owner = state.regionOwner[f.id]
            const isSel = owner && selected === owner
            const isPlayer = owner === state.playerId
            return (
              <path
                key={f.id}
                d={PATHS[f.id]}
                fill={colorOf(f.id)}
                stroke={isPlayer ? '#f5d76e' : isSel ? '#fff' : '#0b1626'}
                strokeWidth={(isPlayer || isSel ? 1.6 : 0.6) / Math.sqrt(view.k)}
                className="region"
                onClick={() => clickRegion(f.id)}
                onMouseEnter={(e) => setHover({ region: f.id, cx: e.clientX, cy: e.clientY })}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
          {Object.keys(atWarRegions).map(r => PATHS[r] ? (
            <path key={'occ-' + r} d={PATHS[r]} fill="url(#occ)" stroke="none" pointerEvents="none" />
          ) : null)}
        </g>
      </svg>
      {hoverInfo && hover && (
        <div className="map-tip" style={{ left: Math.min(hover.cx + 14, window.innerWidth - 240), top: hover.cy + 10 }}>
          <b>{regionName(hoverInfo.region, state.lang, Math.floor(state.month / 12))}</b>
          {hoverInfo.country && (
            <div>
              <span className="tip-flag">{hoverInfo.country.flag}</span>
              {' '}{hoverInfo.country.name}
              {hoverInfo.occ && <em className="tip-occ"> ⚔ оккупирован</em>}
              {hoverInfo.country.isPlayer && <em className="tip-you"> — вы</em>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
