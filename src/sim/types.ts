export type Lang = 'ru' | 'en'

export type GovernmentType =
  | 'monarchy' | 'empire' | 'republic' | 'democracy' | 'theocracy'
  | 'tribal' | 'federation' | 'communist' | 'junta' | 'oligarchy'

export type Personality =
  | 'expansionist' | 'diplomat' | 'merchant' | 'militarist'
  | 'isolationist' | 'opportunist' | 'cautious' | 'zealot'

export type TreatyType = 'nap' | 'alliance' | 'trade' | 'guarantee' | 'vassal' | 'peace'

export interface Treaty {
  id: number
  type: TreatyType
  parties: [string, string]
  signedMonth: number      // absolute month (year*12 + monthIndex)
  expiresMonth?: number
  status: 'active' | 'broken' | 'expired' | 'superseded'
  brokenBy?: string
  note?: string
}

export interface War {
  id: number
  attackers: string[]
  defenders: string[]
  startedMonth: number
  occupations: Record<string, string>   // regionId -> occupier country id
  cb?: string
  over: boolean
}

export interface Country {
  id: string
  name: string
  color: string
  flag: string
  government: GovernmentType
  personality: Personality
  isPlayer: boolean
  alive: boolean
  // core stats
  population: number      // millions
  industry: number        // industrial capacity points
  tech: number            // 1..12
  treasury: number        // currency units (millions)
  stability: number       // 0..100
  warSupport: number      // 0..100
  divisions: number
  navy: number
  taxRate: number         // 0.10..0.50
  investRate: number      // 0..0.6 share of income reinvested
  reputation: number      // 0..100, treaty-keeping record
  relations: Record<string, number>   // other id -> -100..100
  aiMemory: Record<string, number>    // grievances etc.
  lastAiActionMonth: number
}

export type EventKind = 'war' | 'diplomacy' | 'economy' | 'internal' | 'world' | 'player' | 'tech'

export interface GameEvent {
  id: number
  month: number
  kind: EventKind
  key: string
  params: Record<string, string | number>
  major?: boolean
}

export interface PlayerOrder {
  type: string
  target?: string
  amount?: number
  text?: string
}

export interface GameState {
  lang: Lang
  // time
  startYear: number
  month: number           // absolute month since year 0
  monthCount: number      // months since start
  // world
  regionOwner: Record<string, string>     // regionId -> country id
  countries: Record<string, Country>
  treaties: Treaty[]
  wars: War[]
  events: GameEvent[]
  // player
  playerId: string
  pendingOrders: PlayerOrder[]
  nextId: number
  gameOver: boolean
  difficulty: number      // 0..4
  // optional AI narrative from LLM
  lastNarrative?: string
}

export const monthName = (m: number, lang: Lang): string => {
  const year = Math.floor(m / 12)
  const mi = m % 12
  const ru = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return (lang === 'ru' ? ru[mi] : en[mi]) + ' ' + year
}

export const fmtNum = (n: number): string => {
  const abs = Math.abs(n)
  if (abs >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (abs >= 1000) return (n / 1000).toFixed(1) + 'k'
  return Math.round(n).toString()
}
