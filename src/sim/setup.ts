import type { Country, GameState, Lang, GovernmentType, Personality, Ideology } from './types'
import { SNAPSHOTS, SNAPSHOT_POLITIES, snapshotForYear } from '../data/snapshots'
import { MODERN, ANCIENT_NAMES } from '../data/polities'
import { POP, DEV, LANDLOCKED } from '../data/regionMeta'
import { leaderFor } from '../data/leaders'
import adjacencyRaw from '../data/adjacency.json'
import centroidsRaw from '../data/centroids.json'

export const ADJACENCY: [string, string][] = adjacencyRaw as [string, string][]
export const CENTROIDS: Record<string, { lon: number; lat: number; coastal: boolean }> = centroidsRaw as never

export const adjMap: Record<string, Set<string>> = {}
for (const [a, b] of ADJACENCY) {
  ;(adjMap[a] ||= new Set()).add(b)
  ;(adjMap[b] ||= new Set()).add(a)
}

export const isCoastal = (region: string): boolean => CENTROIDS[region]?.coastal && !LANDLOCKED.has(region)

// ---------- deterministic RNG ----------
export function hashCode(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const PALETTE = [
  '#a2654e', '#6e8f6a', '#b09a5a', '#5f7d9c', '#96688a', '#7c9a86', '#b08356', '#7d7ab0',
  '#5d9393', '#b37e68', '#8ba065', '#9a6464', '#6585a5', '#a89763', '#849b74', '#a98fae',
  '#c08552', '#6a907f', '#937f5c', '#708899', '#9d6f7e', '#7f956d', '#a68a64', '#6d86a0',
  '#8f9f67', '#a37a70', '#64938a', '#98865f', '#7c7f9d', '#a5795c', '#6f9473', '#8d76a0',
]

const ERA_POP: Record<number, number> = { 117: 0.06, 1100: 0.1, 1700: 0.18, 1914: 0.55, 1936: 0.75, 1946: 0.8, 1991: 0.95, 2025: 1 }
const ERA_IND: Record<number, number> = { 117: 1, 1100: 1, 1700: 1.3, 1914: 4, 1936: 6, 1946: 7, 1991: 12, 2025: 16 }
const ERA_TECH: Record<number, number> = { 117: 2, 1100: 2.5, 1700: 3.5, 1914: 5, 1936: 5.5, 1946: 6, 1991: 7, 2025: 8 }
const ERA_MIL: Record<number, number> = { 117: 0.3, 1100: 0.25, 1700: 0.2, 1914: 0.35, 1936: 0.35, 1946: 0.3, 1991: 0.12, 2025: 0.1 }

// Regions industrialized early; others count as agrarian until later eras.
const EARLY_INDUSTRIAL = new Set(['USA', 'GBR', 'DEU', 'FRA', 'NLD', 'BEL', 'CHE', 'AUT', 'CZE', 'SVK', 'ITA',
  'SVN', 'HRV', 'SWE', 'NOR', 'DNK', 'FIN', 'JPN', 'RUS', 'UKR', 'POL', 'EST', 'LVA', 'LTU', 'BLR', 'IRL', 'ISL',
  'LUX', 'ESP', 'PRT', 'GRC', 'ROU', 'BGR', 'HUN', 'CAN', 'AUS', 'NZL', 'ARG', 'CHL', 'URY'])

export function devForEra(region: string, year: number): number {
  const base = DEV[region] ?? 0.7
  const early = EARLY_INDUSTRIAL.has(region)
  if (year < 1950) return early ? base : Math.min(base, 0.35)
  if (year < 2000) return early ? base : Math.min(base, 1.1)
  return base
}

export function eraFactor(table: Record<number, number>, year: number): number {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  let lo = keys[0], hi = keys[keys.length - 1]
  for (const k of keys) { if (k <= year) lo = k; if (k >= year) { hi = k; break } }
  if (lo === hi) return table[lo]
  const t = (year - lo) / (hi - lo)
  return table[lo] + (table[hi] - table[lo]) * t
}

const GOVS: GovernmentType[] = ['monarchy', 'republic', 'oligarchy', 'theocracy']
const PERS: Personality[] = ['cautious', 'merchant', 'diplomat', 'expansionist', 'opportunist', 'militarist', 'isolationist']

export interface SetupOptions {
  year: number
  playerId: string
  difficulty: number
  lang: Lang
  victoryEnabled?: boolean
}

export function regionName(regionId: string, lang: Lang, year: number): string {
  const mod = MODERN[regionId]
  if (year <= 200 && ANCIENT_NAMES[regionId]) return ANCIENT_NAMES[regionId][lang]
  if (mod) return mod[lang]
  return regionId
}

export function createGame(opts: SetupOptions): GameState {
  const snap = snapshotForYear(opts.year)
  const popF = eraFactor(ERA_POP, opts.year)
  const indF = eraFactor(ERA_IND, opts.year)
  const techBase = eraFactor(ERA_TECH, opts.year)
  const milF = eraFactor(ERA_MIL, opts.year)

  // region -> owner
  const regionOwner: Record<string, string> = {}
  const allRegions = Object.keys(POP)
  for (const r of allRegions) regionOwner[r] = snap.owners[r] ?? r

  // countries: unique owners
  const countryIds = [...new Set(Object.values(regionOwner))]
  const countries: Record<string, Country> = {}
  const rng = mulberry32(hashCode('pax-mundi-' + opts.year))

  let colorIdx = 0
  for (const id of countryIds) {
    const regions = allRegions.filter(r => regionOwner[r] === id)
    const snapDef = SNAPSHOT_POLITIES[id]
    const modern = MODERN[id]
    const seed = mulberry32(hashCode(id + opts.year))

    let name: string, color: string, flag: string, government: GovernmentType, personality: Personality
    if (snapDef) {
      name = opts.lang === 'ru' ? snapDef.ru : snapDef.en
      color = snapDef.color
      flag = snapDef.flag
      government = snapDef.government as GovernmentType
      personality = snapDef.personality as Personality
    } else {
      name = modern ? modern[opts.lang] : (regions[0] ? regionName(regions[0], opts.lang, opts.year) : id)
      flag = modern?.flag ?? '🏳️'
      color = PALETTE[(hashCode(id) + colorIdx) % PALETTE.length]
      colorIdx++
      government = opts.year < 1800 ? GOVS[Math.floor(seed() * GOVS.length)] : (seed() < 0.55 ? 'republic' : seed() < 0.5 ? 'monarchy' : 'democracy')
      personality = PERS[Math.floor(seed() * PERS.length)]
    }

    let population = 0, industry = 0, coastal = false
    for (const r of regions) {
      population += (POP[r] || 0.5) * popF
      industry += (POP[r] || 0.5) * devForEra(r, opts.year) * indF
      if (isCoastal(r)) coastal = true
    }
    // historical overrides
    const polityDef = SNAPSHOT_POLITIES[id]
    if (polityDef) {
      // find nearest override year
      const ov = nearestOverride(id, opts.year)
      if (ov) population = ov
    }
    population = Math.max(population, 0.05)
    industry = Math.max(industry, 5)

    const tech = Math.min(12, techBase + (DEV[regions[0]] ? 0.6 : -0.4) + seed() * 0.4)
    const divisions = Math.max(1, Math.round(population * milF * 0.65 * (0.5 + tech / 12) * (personality === 'militarist' ? 1.3 : 1)))
    const navy = coastal ? Math.round(industry / 60) + 1 : 0

    const ideology = ideologyFromGov(government)
    const lead = leaderFor(id, snap.year, personality)

    countries[id] = {
      id, name, color, flag, government, personality,
      ideology,
      leader: lead.name || undefined,
      isPlayer: id === opts.playerId, alive: true,
      population, industry, tech,
      treasury: Math.round(industry * 12),
      stability: 55 + Math.round(seed() * 25),
      warSupport: 30 + Math.round(seed() * 20),
      divisions, navy,
      taxRate: 0.2, investRate: 0.25,
      reputation: 55 + Math.round(seed() * 30),
      relations: {}, aiMemory: {}, lastAiActionMonth: -99,
      resources: { grain: 0, oil: 0, steel: 0, rare: 0 },
      stockpile: { grain: 20, oil: 5, steel: 20, rare: 2 },
      factoriesCiv: Math.max(1, Math.round(industry / 300)),
      factoriesMil: Math.max(0, Math.round(industry / 600)),
      equipment: Math.round(divisions * 0.5),
      techTree: {
        inf: Math.min(4, Math.floor(techBase / 2)),
        arm: techBase > 4.5 ? 1 : 0,
        air: techBase > 5 ? 1 : 0,
        nav: coastal && techBase > 4 ? 1 : 0,
        ind: Math.min(3, Math.floor(techBase / 3)),
        sci: 0,
      },
      science: 0,
      prestige: 40 + Math.round(seed() * 30),
      nukeProgress: 0,
      nukes: 0,
      debt: Math.round(industry * (3 + Math.max(0, (snap.year - 1800) / 60))),
      corruption: { democracy: 6, republic: 9, federation: 9, monarchy: 14, empire: 14, theocracy: 18, junta: 20, oligarchy: 24, tribal: 26, communist: 16 }[government] ?? 14,
      socialSpend: government === 'democracy' || government === 'republic' || government === 'federation' ? 0.18 : 0.1,
    }
  }

  // seed relations: neighbors slightly wary
  for (const [a, b] of ADJACENCY) {
    const ca = countries[regionOwner[a]], cb = countries[regionOwner[b]]
    if (ca && cb && ca.id !== cb.id) {
      if (ca.relations[cb.id] === undefined) ca.relations[cb.id] = -5
      if (cb.relations[ca.id] === undefined) cb.relations[ca.id] = -5
    }
  }

  const startMonth = opts.year * 12
  return {
    lang: opts.lang,
    theme: 'dark',
    muted: false,
    startYear: opts.year,
    month: startMonth,
    monthCount: 0,
    regionOwner,
    countries,
    treaties: [],
    wars: [],
    events: [{
      id: 1, month: startMonth, kind: 'world', key: 'ev_game_start',
      params: { year: snap.year }, major: true,
    }],
    playerId: opts.playerId,
    pendingOrders: [],
    nextId: 2,
    gameOver: false,
    victoryEnabled: opts.victoryEnabled ?? false,
    victory: undefined,
    difficulty: opts.difficulty,
    history: [],
    tutorialStep: 0,
    econCycle: 'stable',
    historicalFired: [],
  }
}

export function ideologyFromGov(g: GovernmentType): Ideology {
  switch (g) {
    case 'communist': return 'communism'
    case 'junta': case 'oligarchy': return 'fascism'
    case 'monarchy': case 'empire': return 'monarchism'
    case 'theocracy': return 'theocracy'
    default: return 'democracy'
  }
}

// Historical population overrides for snapshot polities
import { POLITIES } from '../data/polities'
function nearestOverride(id: string, year: number): number | null {
  const p = POLITIES[id]
  if (!p?.pop) return null
  const years = Object.keys(p.pop).map(Number).sort((a, b) => a - b)
  let best: number | null = null
  for (const y of years) if (Math.abs(y - year) < 60) best = p.pop[y]
  return best
}

export function listPlayableCountries(state: Pick<GameState, 'countries'>): Country[] {
  return Object.values(state.countries).sort((a, b) => b.industry - a.industry)
}

export function regionsOf(state: Pick<GameState, 'regionOwner'>, countryId: string): string[] {
  return Object.keys(state.regionOwner).filter(r => state.regionOwner[r] === countryId)
}

export function power(c: Country): number {
  return c.industry * (1 + c.tech / 6) + Math.sqrt(Math.max(0, c.divisions)) * 40 + c.navy * 5
}

export function relOf(state: GameState, a: string, b: string): number {
  return state.countries[a]?.relations[b] ?? 0
}

export function atWarWith(state: GameState, a: string, b: string): boolean {
  return state.wars.some(w => !w.over &&
    ((w.attackers.includes(a) && w.defenders.includes(b)) || (w.attackers.includes(b) && w.defenders.includes(a))))
}

export function hasTreaty(state: GameState, a: string, b: string, type?: string): boolean {
  return state.treaties.some(t => t.status === 'active' && (!type || t.type === type) &&
    ((t.parties[0] === a && t.parties[1] === b) || (t.parties[0] === b && t.parties[1] === a)))
}
