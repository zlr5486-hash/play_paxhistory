export type Lang = 'ru' | 'en'

export type GovernmentType =
  | 'monarchy' | 'empire' | 'republic' | 'democracy' | 'theocracy'
  | 'tribal' | 'federation' | 'communist' | 'junta' | 'oligarchy'

export type Ideology = 'monarchism' | 'fascism' | 'communism' | 'democracy' | 'theocracy'

export type Personality =
  | 'expansionist' | 'diplomat' | 'merchant' | 'militarist'
  | 'isolationist' | 'opportunist' | 'cautious' | 'zealot'

export type TreatyType = 'nap' | 'alliance' | 'trade' | 'guarantee' | 'vassal' | 'peace' | 'sanctions'

export interface Treaty {
  id: number
  type: TreatyType
  parties: [string, string]
  signedMonth: number
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
  occupations: Record<string, string>
  cb?: string
  over: boolean
  // v2: operational layer
  playerControlled?: boolean      // player commands manually vs AI minister
  fronts?: Front[]
  nukesUsed?: number
  directives?: Record<string, Directive>   // per-country stance
  generals?: Record<string, General>       // commanding general per country
  offensives?: Record<string, number>      // months of focused offensive left
}

export type Directive = 'offensive' | 'balanced' | 'defensive'

export type GeneralTrait = 'aggressive' | 'cautious' | 'brilliant' | 'mediocre' | 'logistician'

export interface General { id: number; name: string; skill: number; trait: GeneralTrait }

export interface ChatMsg { from: string; text: string; month: number }

export interface Congress {
  month: number
  resolution: string            // i18n key
  target?: string               // country id targeted by the resolution
  proposedBy: string
  votes: Record<string, 'yes' | 'no' | 'abstain'>
  passed?: boolean
  playerVoted?: boolean
}

export interface Front {
  id: number
  attacker: string
  defender: string
  // regions forming the contact line (defender-side regions under pressure)
  sectors: string[]
  attackerStrength: number
  defenderStrength: number
}

export type TechBranch = 'inf' | 'arm' | 'air' | 'nav' | 'ind' | 'sci'

export interface Resources { grain: number; oil: number; steel: number; rare: number }

export interface Country {
  id: string
  name: string
  color: string
  flag: string
  government: GovernmentType
  ideology: Ideology
  personality: Personality
  leader?: string
  isPlayer: boolean
  alive: boolean
  // stats
  population: number
  industry: number
  tech: number
  treasury: number
  stability: number
  warSupport: number
  divisions: number
  navy: number
  taxRate: number
  investRate: number
  reputation: number
  relations: Record<string, number>
  aiMemory: Record<string, number>
  lastAiActionMonth: number
  // v2 economy
  resources: Resources
  stockpile: Resources
  factoriesCiv: number
  factoriesMil: number
  equipment: number
  // v2 tech tree: level per branch 0..5
  techTree: Record<TechBranch, number>
  science: number
  prestige: number
  // stage B: nuclear program
  nukeProgress: number   // 0..100
  nukes: number
  // stage B2: Millennium-Dawn-style economy
  debt: number          // national debt
  corruption: number    // 0..50, eats revenue
  socialSpend: number   // 0..0.3 share of budget on social programs
}

export type EventKind = 'war' | 'diplomacy' | 'economy' | 'internal' | 'world' | 'player' | 'tech'

export interface GameEvent {
  id: number
  month: number          // fractional month (weeks => month + w/4.33)
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

export type VictoryType = 'domination' | 'economy' | 'science' | 'culture'

export interface GameState {
  lang: Lang
  theme: 'dark' | 'parchment'
  muted: boolean
  startYear: number
  month: number           // fractional absolute month
  monthCount: number
  regionOwner: Record<string, string>
  countries: Record<string, Country>
  treaties: Treaty[]
  wars: War[]
  events: GameEvent[]
  playerId: string
  pendingOrders: PlayerOrder[]
  nextId: number
  gameOver: boolean
  victoryEnabled: boolean
  victory?: { type: VictoryType; winner: string }
  difficulty: number
  lastNarrative?: string
  history: { month: number; industry: number; population: number; regions: number }[]
  tutorialStep: number
  // stage B/C
  chats?: Record<string, ChatMsg[]>          // key: sorted pair "A|B"
  achievements?: string[]
  congress?: Congress
  scenarioId?: string                        // custom scenario marker
  econCycle: 'boom' | 'stable' | 'recession' // global economic cycle
  historicalFired?: string[]                 // ids of scripted historical events
}

export const monthName = (m: number, lang: Lang): string => {
  const year = Math.floor(m / 12)
  const mi = Math.floor(m % 12)
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
