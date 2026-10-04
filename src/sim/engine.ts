import type { Country, GameState, GameEvent, PlayerOrder, TreatyType, War, Ideology, TechBranch, Directive } from './types'
import { genGeneral, generalBonus } from '../data/generals'
import {
  ADJACENCY, adjMap, regionsOf, power, relOf, hasTreaty, atWarWith, isCoastal, mulberry32, hashCode, PALETTE,
} from './setup'
import { POP, LANDLOCKED } from '../data/regionMeta'
import { MODERN } from '../data/polities'
import { depositOf } from '../data/resources'
import { cultureOf } from '../data/cultures'
import { techMods, researchCost, canResearch, MAX_TIER, BRANCHES, branchName } from './tech'
import { HISTORICAL, type HistApi } from '../data/historical'

const rnd = Math.random
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]

export function ev(state: GameState, kind: GameEvent['kind'], key: string, params: Record<string, string | number>, major = false): void {
  state.events.push({ id: state.nextId++, month: state.month, kind, key, params, major })
  // trim, but preserve major events (wars, historical moments)
  while (state.events.length > 600) {
    const idx = state.events.findIndex(e => !e.major)
    if (idx === -1) state.events.splice(0, state.events.length - 600)
    else state.events.splice(idx, 1)
  }
}

export function changeRel(state: GameState, a: string, b: string, delta: number): void {
  const ca = state.countries[a], cb = state.countries[b]
  if (!ca || !cb || a === b) return
  ca.relations[b] = Math.max(-100, Math.min(100, (ca.relations[b] ?? 0) + delta))
  cb.relations[a] = Math.max(-100, Math.min(100, (cb.relations[a] ?? 0) + delta * 0.8))
}

// ---------------- ideology ----------------
const AFFINITY: Record<Ideology, Partial<Record<Ideology, number>>> = {
  democracy: { democracy: 15, communism: -10, fascism: -25, monarchism: 0, theocracy: -10 },
  communism: { communism: 15, democracy: -10, fascism: -30, monarchism: -15, theocracy: -10 },
  fascism: { fascism: 10, democracy: -25, communism: -30, monarchism: 5, theocracy: 0 },
  monarchism: { monarchism: 12, democracy: 0, communism: -15, fascism: 5, theocracy: 5 },
  theocracy: { theocracy: 12, democracy: -10, communism: -10, monarchism: 5, fascism: 0 },
}
export function ideologyAffinity(a: Ideology, b: Ideology): number {
  return AFFINITY[a]?.[b] ?? 0
}

// ---------------- player orders ----------------
export function applyOrder(state: GameState, o: PlayerOrder, silent = false): boolean {
  const p = state.countries[state.playerId]
  if (!p || !p.alive) return false
  const year = Math.floor(state.month / 12)
  const cost = (n: number) => {
    if (p.treasury < n) { if (!silent) ev(state, 'player', 'ev_no_funds', { need: Math.round(n) }); return false }
    p.treasury -= n
    return true
  }
  switch (o.type) {
    case 'invest': {
      const amt = o.amount ?? Math.round(p.treasury * 0.15)
      if (!cost(amt)) return false
      p.industry += amt * 0.08 * (13 - p.tech) / 8 * techMods(p).industryGrowth
      if (!silent) ev(state, 'player', 'ev_invest', { country: p.name, amount: Math.round(amt) })
      return true
    }
    case 'research': {
      const c = Math.round(120 * p.tech)
      if (!cost(c)) return false
      p.tech = Math.min(12, p.tech + 0.15)
      if (!silent) ev(state, 'tech', 'ev_research', { country: p.name, tech: p.tech.toFixed(1) })
      return true
    }
    case 'research_branch': {
      const branch = o.target as TechBranch
      const reason = canResearch(p, branch, year)
      if (reason) { if (!silent) ev(state, 'tech', reason === 'era' ? 'ev_tech_era' : 'ev_tech_max', {}); return false }
      const c = researchCost(p, branch)
      if (!cost(c)) return false
      p.techTree[branch] = (p.techTree[branch] ?? 0) + 1
      p.science += 10
      if (!silent) ev(state, 'tech', 'ev_tech_advance', { country: p.name, branch: branchName(branch, state.lang), tier: p.techTree[branch] })
      return true
    }
    case 'propaganda': {
      if (!cost(80)) return false
      p.warSupport = Math.min(100, p.warSupport + 8)
      p.stability = Math.min(100, p.stability + 4)
      if (!silent) ev(state, 'player', 'ev_propaganda', { country: p.name })
      return true
    }
    case 'army': {
      const n = o.amount ?? 5
      const c = n * 18
      if (!cost(c)) return false
      const cap = Math.round(p.population * 1.6)
      p.divisions = Math.min(cap, p.divisions + n)
      if (!silent) ev(state, 'player', 'ev_army', { country: p.name, n, div: p.divisions })
      return true
    }
    case 'navy': {
      const n = o.amount ?? 2
      const c = n * 90
      if (!cost(c)) return false
      p.navy += n
      if (!silent) ev(state, 'player', 'ev_navy', { country: p.name, n, navy: p.navy })
      return true
    }
    case 'stabilize': {
      if (!cost(100)) return false
      p.stability = Math.min(100, p.stability + 10)
      if (!silent) ev(state, 'player', 'ev_stabilize', { country: p.name })
      return true
    }
    case 'build_civ': {
      const c = Math.round(150 + p.factoriesCiv * 8)
      if (!cost(c)) return false
      p.factoriesCiv++
      if (!silent) ev(state, 'player', 'ev_build_civ', { country: p.name, n: p.factoriesCiv })
      return true
    }
    case 'build_mil': {
      const c = Math.round(200 + p.factoriesMil * 10)
      if (!cost(c)) return false
      p.factoriesMil++
      if (!silent) ev(state, 'player', 'ev_build_mil', { country: p.name, n: p.factoriesMil })
      return true
    }
    case 'set_directive': {
      const w = state.wars.find(x => x.id === Number(o.target) && !x.over)
      if (!w || !w.directives) return false
      const d = o.text as Directive
      if (!['offensive', 'balanced', 'defensive'].includes(d)) return false
      w.directives[state.playerId] = d
      if (!silent) {
        const dirLabel = ({ offensive: ['Наступление', 'Offensive'], balanced: ['Баланс', 'Balanced'], defensive: ['Оборона', 'Defensive'] })[d][state.lang === 'ru' ? 0 : 1]
        ev(state, 'war', 'ev_directive_set', { dir: dirLabel })
      }
      return true
    }
    case 'offensive': {
      const w = state.wars.find(x => x.id === Number(o.target) && !x.over)
      if (!w || !w.offensives) return false
      if (!cost(120)) return false
      w.offensives[state.playerId] = 3
      p.warSupport = Math.min(100, p.warSupport + 4)
      if (!silent) ev(state, 'war', 'ev_offensive', { country: p.name })
      return true
    }
    case 'nuke_program': {
      if (year < 1935) { if (!silent) ev(state, 'tech', 'ev_tech_era', {}); return false }
      if ((p.techTree.sci ?? 0) < 2) { if (!silent) ev(state, 'tech', 'ev_nuke_need_sci', {}); return false }
      if (p.nukeProgress >= 100) { if (!silent) ev(state, 'tech', 'ev_nuke_ready', {}); return false }
      if (!cost(500)) return false
      p.nukeProgress = Math.min(100, p.nukeProgress + 20 + (p.techTree.sci ?? 0) * 4)
      if (p.nukeProgress >= 100) {
        p.nukes += 1
        ev(state, 'tech', 'ev_nuke_done', { country: p.name }, true)
      } else if (!silent) ev(state, 'tech', 'ev_nuke_progress', { country: p.name, pct: Math.round(p.nukeProgress) })
      return true
    }
    case 'nuke_strike': {
      const target = o.target ? state.countries[o.target] : null
      if (!target || !target.alive || p.nukes < 1) return false
      const atWar = state.wars.some(x => !x.over && x.attackers.includes(p.id) !== x.attackers.includes(target.id) && (x.attackers.includes(p.id) || x.defenders.includes(p.id)))
      if (!atWar) { if (!silent) ev(state, 'war', 'ev_nuke_no_war', {}); return false }
      p.nukes -= 1
      state.wars.forEach(w => { if (!w.over) w.nukesUsed = (w.nukesUsed ?? 0) + 1 })
      target.industry = Math.max(1, target.industry * 0.65)
      target.divisions = Math.max(0, Math.round(target.divisions * 0.75))
      target.stability = Math.max(0, target.stability - 25)
      target.warSupport = Math.max(0, target.warSupport - 20)
      p.reputation = Math.max(0, p.reputation - 35)
      p.prestige = Math.max(0, p.prestige - 10)
      for (const c of Object.values(state.countries)) if (c.alive && c.id !== p.id && c.id !== target.id) changeRel(state, c.id, p.id, -6)
      ev(state, 'war', 'ev_nuke_strike', { a: p.name, b: target.name }, true)
      return true
    }
    case 'congress_vote': {
      const cg = state.congress
      if (!cg || cg.playerVoted) return false
      cg.votes[state.playerId] = o.text as 'yes' | 'no' | 'abstain'
      cg.playerVoted = true
      resolveCongress(state)
      return true
    }
    case 'imf_loan': {
      if (!cost(0)) return false
      p.treasury += 600
      p.debt += 650
      p.corruption = Math.max(2, (p.corruption ?? 10) - 2)
      if (!silent) ev(state, 'economy', 'ev_imf_loan', { country: p.name })
      return true
    }
    case 'fight_corruption': {
      if (!cost(200)) return false
      p.corruption = Math.max(2, (p.corruption ?? 10) - 6)
      if (!silent) ev(state, 'economy', 'ev_anti_corruption', { country: p.name, n: Math.round(p.corruption) })
      return true
    }
  }
  return false
}

export function imposeSanctions(state: GameState, from: string, target: string): boolean {
  const cf = state.countries[from], ct = state.countries[target]
  if (!cf || !ct || !cf.alive || !ct.alive) return false
  const existing = state.treaties.find(t => t.type === 'sanctions' && t.status === 'active' && t.parties[0] === from && t.parties[1] === target)
  if (existing) return false
  state.treaties.push({ id: state.nextId++, type: 'sanctions', parties: [from, target], signedMonth: state.month, status: 'active' })
  changeRel(state, from, target, -20)
  ct.reputation = Math.max(0, ct.reputation - 3)
  ev(state, 'diplomacy', 'ev_sanctions', { a: cf.name, b: ct.name }, true)
  return true
}

export function liftSanctions(state: GameState, from: string, target: string): void {
  const t = state.treaties.find(x => x.type === 'sanctions' && x.status === 'active' && x.parties[0] === from && x.parties[1] === target)
  if (t) { t.status = 'broken'; t.brokenBy = from; changeRel(state, from, target, 6); ev(state, 'diplomacy', 'ev_sanctions_lifted', { a: state.countries[from]?.name ?? '', b: state.countries[target]?.name ?? '' }) }
}

// ---------------- diplomacy ----------------
export function acceptanceScore(state: GameState, from: string, to: string, type: TreatyType): number {
  const cf = state.countries[from], ct = state.countries[to]
  if (!cf || !ct) return -999
  const rel = ct.relations[from] ?? 0
  let score = rel * 0.45
  const myPower = power(ct), theirPower = power(cf)
  switch (type) {
    case 'nap': score += 40 + (atWarThreat(state, to) > 0 ? 10 : 0); break
    case 'trade': score += 48 + (isCoastalN(state, to) || isCoastalN(state, from) ? 6 : 0); break
    case 'guarantee': score += 30 + (theirPower > myPower * 1.2 ? 18 : -10); break
    case 'sanctions': score = -999; break
    case 'alliance': {
      score += 28
      if (commonEnemy(state, from, to)) score += 22
      if (theirPower < myPower * 0.6) score -= 15
      if (myPower < theirPower * 0.5) score += 12
      break
    }
    case 'vassal': score = theirPower > myPower * 3.2 ? 25 : -25; break
    case 'peace': {
      const war = state.wars.find(w => !w.over &&
        ((w.attackers.includes(from) && w.defenders.includes(to)) || (w.attackers.includes(to) && w.defenders.includes(from))))
      if (!war) return -999
      const mySide = war.attackers.includes(to) ? war.attackers : war.defenders
      const theirSide = war.attackers.includes(to) ? war.defenders : war.attackers
      const myP = mySide.reduce((s, id) => s + power(state.countries[id] ?? { industry: 0, tech: 5, divisions: 0 } as Country), 0)
      const theirP = theirSide.reduce((s, id) => s + power(state.countries[id] ?? { industry: 0, tech: 5, divisions: 0 } as Country), 0)
      score = 50 - (myP / Math.max(1, theirP)) * 30
      if (ct.warSupport < 30) score += 20
      if (cf.warSupport < 30) score -= 10
      break
    }
  }
  // personality
  if (ct.personality === 'diplomat') score += 12
  if (ct.personality === 'cautious' && (type === 'nap' || type === 'guarantee')) score += 8
  if (ct.personality === 'expansionist' && type === 'alliance') score += 6
  if (ct.personality === 'isolationist' && type === 'alliance') score -= 12
  if (ct.personality === 'zealot') score -= 6
  // ideology affinity
  score += ideologyAffinity(ct.ideology, cf.ideology) * 0.5
  // reputation & prestige of the proposer
  score += (cf.reputation - 60) * 0.4 + (cf.prestige - 50) * 0.2
  return score
}

function isCoastalN(state: GameState, id: string): boolean {
  return regionsOf(state, id).some(r => isCoastal(r))
}
function atWarThreat(state: GameState, id: string): number {
  return state.wars.filter(w => !w.over && (w.attackers.includes(id) || w.defenders.includes(id))).length
}
function commonEnemy(state: GameState, a: string, b: string): string | null {
  const enemiesOf = (id: string) => {
    const s = new Set<string>()
    for (const w of state.wars) {
      if (!w.over) {
        if (w.attackers.includes(id)) w.defenders.forEach(x => s.add(x))
        if (w.defenders.includes(id)) w.attackers.forEach(x => s.add(x))
      }
    }
    for (const [other, rel] of Object.entries(state.countries[id]?.relations ?? {})) if (rel < -50) s.add(other)
    return s
  }
  const ea = enemiesOf(a), eb = enemiesOf(b)
  for (const e of ea) if (eb.has(e)) return e
  return null
}

export function proposeTreaty(state: GameState, from: string, to: string, type: TreatyType): { accepted: boolean; reasonKey: string } {
  const cf = state.countries[from], ct = state.countries[to]
  if (!cf || !ct) return { accepted: false, reasonKey: 'reason_gone' }
  if (hasTreaty(state, from, to, type) && type !== 'peace') return { accepted: false, reasonKey: 'reason_already' }
  if (atWarWith(state, from, to) && type !== 'peace') return { accepted: false, reasonKey: 'reason_at_war' }
  const score = acceptanceScore(state, from, to, type)
  const accepted = score >= 50
  if (accepted) {
    state.treaties.push({
      id: state.nextId++, type, parties: [from, to],
      signedMonth: state.month, status: 'active',
      expiresMonth: type === 'nap' ? state.month + 60 : undefined,
    })
    changeRel(state, from, to, type === 'alliance' ? 12 : 8)
    cf.prestige = Math.min(100, cf.prestige + 2)
    ev(state, 'diplomacy', 'ev_treaty_signed', { a: cf.name, b: ct.name, type }, true)
  } else {
    changeRel(state, from, to, -2)
    ev(state, 'diplomacy', 'ev_treaty_rejected', { a: ct.name, b: cf.name, type })
  }
  return { accepted, reasonKey: accepted ? 'reason_accepted' : score > 35 ? 'reason_hesitant' : 'reason_refused' }
}

export function breakTreaty(state: GameState, treatyId: number, by: string): void {
  const t = state.treaties.find(x => x.id === treatyId)
  if (!t || t.status !== 'active') return
  t.status = 'broken'
  t.brokenBy = by
  const other = t.parties[0] === by ? t.parties[1] : t.parties[0]
  state.countries[by].reputation = Math.max(0, state.countries[by].reputation - 15)
  state.countries[by].prestige = Math.max(0, state.countries[by].prestige - 5)
  changeRel(state, by, other, -35)
  ev(state, 'diplomacy', 'ev_treaty_broken', { a: state.countries[by].name, b: state.countries[other].name, type: t.type }, true)
}

// casus belli realism: wars without CB hurt reputation/stability
export function cbFor(state: GameState, a: string, b: string): string | null {
  const rel = relOf(state, a, b)
  if (rel < -50) return 'hostility'
  if (ideologyAffinity(state.countries[a].ideology, state.countries[b].ideology) <= -25) return 'ideology'
  if (atWarThreat(state, b) > 0) return 'opportunism'
  if (state.countries[a].personality === 'expansionist' && power(state.countries[a]) > power(state.countries[b]) * 2) return 'hegemony'
  return null
}

export function declareWar(state: GameState, attacker: string, defender: string, cb?: string, playerControlled = false): void {
  if (atWarWith(state, attacker, defender)) return
  const ca = state.countries[attacker], cd = state.countries[defender]
  if (!ca || !cd || !ca.alive || !cd.alive) return
  const realCb = cb ?? cbFor(state, attacker, defender)
  if (!realCb) {
    // no casus belli: world condemns
    ca.reputation = Math.max(0, ca.reputation - 20)
    ca.stability = Math.max(0, ca.stability - 8)
    ca.warSupport = Math.max(0, ca.warSupport - 12)
    for (const c of Object.values(state.countries)) {
      if (c.alive && c.id !== attacker && c.id !== defender) changeRel(state, c.id, attacker, -3)
    }
    ev(state, 'war', 'ev_no_cb', { a: ca.name }, true)
  }
  const attackers = [attacker]
  const defenders = [defender]
  for (const t of state.treaties) {
    if (t.status !== 'active' || (t.type !== 'alliance' && t.type !== 'vassal')) continue
    const allyOfDef = t.parties[0] === defender ? t.parties[1] : t.parties[1] === defender ? t.parties[0] : null
    if (allyOfDef && !attackers.includes(allyOfDef) && !defenders.includes(allyOfDef) && state.countries[allyOfDef]?.alive) {
      if (rnd() < 0.5 + state.countries[allyOfDef].reputation / 200) {
        defenders.push(allyOfDef)
        ev(state, 'war', 'ev_ally_joins', { ally: state.countries[allyOfDef].name, for: cd.name })
      }
    }
    const allyOfAtt = t.parties[0] === attacker ? t.parties[1] : t.parties[1] === attacker ? t.parties[0] : null
    if (allyOfAtt && !attackers.includes(allyOfAtt) && !defenders.includes(allyOfAtt) && state.countries[allyOfAtt]?.alive) {
      if (rnd() < 0.3 + state.countries[allyOfAtt].reputation / 300) attackers.push(allyOfAtt)
    }
  }
  for (const t of state.treaties) {
    if (t.status !== 'active' || t.type !== 'guarantee') continue
    if (t.parties[1] === defender || t.parties[0] === defender) {
      const g = t.parties[0] === defender ? t.parties[1] : t.parties[0]
      if (!defenders.includes(g) && !attackers.includes(g) && state.countries[g]?.alive && rnd() < 0.7) {
        defenders.push(g)
        ev(state, 'war', 'ev_guarantee_honored', { ally: state.countries[g].name, for: cd.name })
      }
    }
  }
  const year = Math.floor(state.month / 12)
  const directives: Record<string, Directive> = {}
  const generals: War['generals'] = {}
  for (const id of [...attackers, ...defenders]) {
    directives[id] = 'balanced'
    generals[id] = genGeneral(year, rnd)
  }
  state.wars.push({
    id: state.nextId++, attackers, defenders, startedMonth: state.month, occupations: {},
    over: false, cb: realCb ?? undefined, playerControlled, directives, generals, offensives: {},
  })
  for (const id of [...attackers, ...defenders]) {
    const g = generals[id]
    if (g) ev(state, 'war', 'ev_general', { country: state.countries[id]?.name ?? id, general: g.name })
  }
  changeRel(state, attacker, defender, -40)
  ca.warSupport = Math.min(100, ca.warSupport + 25)
  cd.warSupport = Math.min(100, cd.warSupport + 20)
  ev(state, 'war', 'ev_war_declared', { a: ca.name, b: cd.name, cb: realCb ?? 'none' }, true)
}

// ---------------- wars ----------------
export function weatherFactor(monthIdx: number, attacking: boolean): number {
  // winter & spring thaw slow offensives
  const m = Math.floor(monthIdx) % 12
  if (m === 11 || m === 0 || m === 1) return attacking ? 0.78 : 1.1
  if (m === 2 || m === 3) return attacking ? 0.86 : 1.03
  return 1
}

export function seasonName(month: number, lang: 'ru' | 'en'): string {
  const m = Math.floor(month) % 12
  const s = m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : m <= 9 ? 'autumn' : 'winter'
  return lang === 'ru'
    ? { winter: '❄️ Зима', spring: '🌱 Распутица', summer: '☀️ Лето', autumn: '🍂 Осень' }[s]
    : { winter: '❄️ Winter', spring: '🌱 Thaw', summer: '☀️ Summer', autumn: '🍂 Autumn' }[s]
}

export function directiveMod(d: Directive | undefined, defending: boolean): number {
  if (d === 'offensive') return defending ? 0.92 : 1.18
  if (d === 'defensive') return defending ? 1.2 : 0.9
  return 1
}

function warSidesPower(state: GameState, w: War): [number, number] {
  const monthIdx = Math.floor(state.month) % 12
  const sideP = (ids: string[], defending: boolean) => ids.reduce((s, id) => {
    const c = state.countries[id]
    if (!c || !c.alive) return s
    const mods = techMods(c)
    const equipBonus = c.divisions > 0 ? Math.min(1, c.equipment / c.divisions) * 0.3 : 0
    const supply = supplyFactor(c)
    const dir = directiveMod(w.directives?.[id], defending)
    const gen = generalBonus(w.generals?.[id], defending)
    const weather = weatherFactor(monthIdx, !defending)
    const offPush = w.offensives?.[id] ? 1.15 : 1
    return s + c.divisions * (1 + c.tech / 8) * (0.55 + c.warSupport / 220) * (0.85 + rnd() * 0.3)
      * (defending ? 1.18 : 1) * (defending ? mods.armyDefense : mods.armyAttack)
      * (1 + equipBonus) * supply * dir * gen * weather * offPush + c.navy * 2 * mods.navyPower
  }, 0)
  return [sideP(w.attackers, false), sideP(w.defenders, true)]
}

function supplyFactor(c: Country): number {
  const needGrain = c.divisions * 0.03
  const grainOk = c.stockpile.grain > 0 ? 1 : 0.75
  const steelOk = c.stockpile.steel > 0 ? 1 : 0.85
  return (grainOk + steelOk) / 2
}

function candidateTargets(state: GameState, w: War, side: string[]): string[] {
  const enemy = side === w.attackers ? w.defenders : w.attackers
  const owned = new Set<string>()
  side.forEach(id => regionsOf(state, id).forEach(r => owned.add(r)))
  const occ = new Set(Object.keys(w.occupations))
  const res = new Set<string>()
  for (const e of enemy) {
    for (const r of regionsOf(state, e)) {
      const nbs = adjMap[r]
      if (!nbs) continue
      for (const nb of nbs) if (owned.has(nb) || occ.has(nb)) { res.add(r); break }
    }
  }
  return [...res]
}

export function updateWars(state: GameState, dt: number): void {
  for (const w of state.wars) {
    if (w.over) continue

    // AI defense minister: chooses (sometimes poorly) for wars delegated by the player
    if (w.playerControlled === false) {
      for (const id of [...w.attackers, ...w.defenders]) {
        const c = state.countries[id]
        if (!c?.isPlayer || !w.directives) continue
        if (rnd() < 0.06 * dt) {
          const defending = w.defenders.includes(id)
          const smart: Directive = defending ? 'defensive' : 'offensive'
          // minister errs ~35% of the time
          const d = rnd() < 0.65 ? smart : (pick(['offensive', 'balanced', 'defensive'] as Directive[]))
          if (d !== w.directives[id]) {
            w.directives[id] = d
            const dirLabel = ({ offensive: ['Наступление', 'Offensive'], balanced: ['Баланс', 'Balanced'], defensive: ['Оборона', 'Defensive'] })[d][state.lang === 'ru' ? 0 : 1]
            ev(state, 'war', 'ev_minister_order', { general: w.generals?.[id]?.name ?? '—', dir: dirLabel })
          }
        }
      }
    }
    // offensive momentum countdown
    if (w.offensives) for (const k of Object.keys(w.offensives)) {
      w.offensives[k] -= dt
      if (w.offensives[k] <= 0) delete w.offensives[k]
    }

    // partisans in occupied regions
    for (const [r, occ] of Object.entries(w.occupations)) {
      const origOwner = state.regionOwner[r]
      if (!origOwner || origOwner === occ) continue
      const oc = state.countries[origOwner]
      if (!oc?.alive) continue
      if (rnd() < 0.012 * dt * (oc.warSupport / 50)) {
        delete w.occupations[r]
        const oc2 = state.countries[occ]
        if (oc2) {
          oc2.equipment = Math.max(0, oc2.equipment - 2)
          oc2.stability = Math.max(0, oc2.stability - 0.5)
        }
        ev(state, 'war', 'ev_partisans', { region: r, country: oc.name })
      }
    }

    const [attP, defP] = warSidesPower(state, w)
    const ratio = attP / Math.max(1, defP)
    const totalP = attP + defP
    const step = dt // in months

    if (ratio > 1.12) {
      const targets = candidateTargets(state, w, w.attackers)
      if (targets.length) {
        const n = Math.min(targets.length, 1 + Math.floor((ratio - 1) * 3)) * (step >= 1 ? 1 : step >= 0.5 ? 1 : 0)
        if (n > 0 || (step < 0.5 && rnd() < 0.3)) {
          const occupier = w.attackers.filter(a => state.countries[a]?.alive).sort((a, b) => power(state.countries[b]) - power(state.countries[a]))[0]
          const count = Math.max(n, step < 0.5 ? 1 : n)
          for (let i = 0; i < count && targets.length; i++) {
            const r = targets.splice(Math.floor(rnd() * targets.length), 1)[0]
            if (state.regionOwner[r] && !w.defenders.includes(state.regionOwner[r])) continue
            w.occupations[r] = occupier
            ev(state, 'war', 'ev_region_occupied', { region: r, by: state.countries[occupier]?.name ?? occupier })
          }
        }
      } else if (rnd() < 0.08 * step) {
        // no land contact: naval invasion of a coastal enemy region if we rule the sea
        const attNavy = w.attackers.reduce((s2, i) => s2 + (state.countries[i]?.navy ?? 0), 0)
        const defNavy = w.defenders.reduce((s2, i) => s2 + (state.countries[i]?.navy ?? 0), 0)
        if (attNavy > defNavy * 1.2 && attNavy > 2) {
          const coastalTargets = w.defenders.flatMap(d => regionsOf(state, d)).filter(r => isCoastal(r) && !w.occupations[r])
          if (coastalTargets.length) {
            const r = pick(coastalTargets)
            const occupier = w.attackers.filter(a => state.countries[a]?.alive)[0]
            w.occupations[r] = occupier
            ev(state, 'war', 'ev_amphibious', { region: r, by: state.countries[occupier]?.name ?? occupier }, true)
          }
        }
      }
    } else if (ratio < 0.88) {
      const occ = Object.keys(w.occupations)
      if (occ.length && rnd() < 0.7 * step) {
        const r = pick(occ)
        delete w.occupations[r]
        ev(state, 'war', 'ev_region_liberated', { region: r, by: state.countries[w.defenders[0]]?.name ?? '' })
      } else if (ratio < 0.6) {
        const targets = candidateTargets(state, w, w.defenders)
        if (targets.length && rnd() < step) {
          const r = pick(targets)
          const occupier = w.defenders.filter(a => state.countries[a]?.alive)[0]
          if (occupier && state.regionOwner[r] && w.attackers.includes(state.regionOwner[r])) {
            w.occupations[r] = occupier
            ev(state, 'war', 'ev_region_occupied', { region: r, by: state.countries[occupier].name })
          }
        }
      }
    }

    const atLoss = Math.round(totalP * 0.006 * (ratio < 1 ? 1.4 : 0.7) * step)
    const dfLoss = Math.round(totalP * 0.006 * (ratio > 1 ? 1.4 : 0.7) * step)
    applyLosses(state, w.attackers, atLoss)
    applyLosses(state, w.defenders, dfLoss)

    for (const id of [...w.attackers, ...w.defenders]) {
      const c = state.countries[id]
      if (!c) continue
      const winning = w.attackers.includes(id) ? ratio > 1.05 : ratio < 0.95
      c.warSupport = Math.max(0, Math.min(100, c.warSupport + (winning ? 0.4 : -1.1) * step))
      c.stability = Math.max(0, c.stability - 0.08 * step)
      // equipment attrition
      c.equipment = Math.max(0, c.equipment - atLoss * 0.5 * step)
    }

    checkSurrender(state, w, w.defenders, w.attackers, ratio < 0.7)
    if (!w.over) checkSurrender(state, w, w.attackers, w.defenders, ratio > 1.4)

    if (!w.over) {
      for (const side of [w.defenders, w.attackers]) {
        for (const id of side) {
          const c = state.countries[id]
          if (!c || !c.alive || c.isPlayer) continue
          if (c.warSupport < 18 && rnd() < 0.25 * step) {
            const enemy = side === w.attackers ? w.defenders[0] : w.attackers[0]
            if (power(c) < power(state.countries[enemy] ?? c) * 0.85 || c.warSupport < 10) {
              makePeace(state, w, id, enemy)
              break
            }
          }
        }
        if (w.over) break
      }
    }
  }
  state.wars = state.wars.filter(w => !w.over || state.month - w.startedMonth < 240)
}

function applyLosses(state: GameState, ids: string[], total: number): void {
  const alive = ids.filter(i => state.countries[i]?.alive)
  if (!alive.length) return
  const per = total / alive.length
  for (const id of alive) {
    const c = state.countries[id]
    c.divisions = Math.max(0, c.divisions - Math.round(per * (0.7 + rnd() * 0.6)))
  }
}

function checkSurrender(state: GameState, w: War, losers: string[], winners: string[], forced: boolean): void {
  for (const id of losers) {
    const c = state.countries[id]
    if (!c || !c.alive) continue
    const origRegions = regionsOf(state, id)
    const occCount = origRegions.filter(r => w.occupations[r]).length
    const occRatio = origRegions.length > 0 ? occCount / origRegions.length : 0
    const capitulate = c.warSupport < 12 || (occRatio > 0.55 && c.warSupport < 45) || (forced && c.warSupport < 25)
    if (capitulate) {
      concludePeace(state, w, id, winners, true)
      return
    }
  }
}

function concludePeace(state: GameState, w: War, loserId: string, winners: string[], capitulation: boolean): void {
  const loser = state.countries[loserId]
  if (!loser) return
  const winner = winners.map(i => state.countries[i]).filter(c => c?.alive).sort((a, b) => power(b) - power(a))[0]
  if (!winner) { w.over = true; return }
  let ceded = 0
  for (const [r, occ] of Object.entries(w.occupations)) {
    if (state.regionOwner[r] !== loserId) continue
    const touchesWinner = [...(adjMap[r] ?? [])].some(nb => state.regionOwner[nb] === occ) || regionsOf(state, occ).length === 0
    if (occ === winner.id && (touchesWinner || ceded < 1)) {
      state.regionOwner[r] = winner.id
      delete w.occupations[r]
      ceded++
    }
  }
  for (const r of Object.keys(w.occupations)) {
    if (state.regionOwner[r] === loserId) delete w.occupations[r]
  }
  if (capitulation) {
    const rep = Math.round(loser.treasury * 0.25)
    loser.treasury -= rep
    winner.treasury += rep
    loser.stability = Math.max(5, loser.stability - 15)
    loser.warSupport = 35
  }
  loser.warSupport = Math.max(loser.warSupport, 30)
  winner.prestige = Math.min(100, winner.prestige + 8)
  loser.prestige = Math.max(0, loser.prestige - 8)

  if (regionsOf(state, loserId).length === 0) {
    loser.alive = false
    ev(state, 'war', 'ev_nation_destroyed', { loser: loser.name, winner: winner.name }, true)
  } else {
    ev(state, 'war', 'ev_capitulation', { loser: loser.name, winner: winner.name, ceded }, true)
  }
  state.treaties.push({
    id: state.nextId++, type: 'peace', parties: [loserId, winner.id],
    signedMonth: state.month, status: 'active', note: capitulation ? 'capitulation' : 'white peace',
  })
  const attAlive = w.attackers.filter(i => state.countries[i]?.alive && regionsOf(state, i).length > 0)
  const defAlive = w.defenders.filter(i => state.countries[i]?.alive && regionsOf(state, i).length > 0)
  if (!attAlive.length || !defAlive.length) w.over = true
  changeRel(state, loserId, winner.id, 8)
}

function makePeace(state: GameState, w: War, fromId: string, toId: string): void {
  const from = state.countries[fromId]
  const score = acceptanceScore(state, fromId, toId, 'peace')
  if (score >= 45) {
    const amAttacker = w.attackers.includes(fromId)
    concludePeace(state, w, fromId, amAttacker ? w.defenders : w.attackers, false)
  } else {
    ev(state, 'diplomacy', 'ev_peace_refused', { a: state.countries[toId]?.name ?? '', b: from.name })
  }
}

// ---------------- economy (v2: resources, factories, trade) ----------------
export function updateEconomy(state: GameState, dt: number): void {
  const atWarCache: Record<string, boolean> = {}
  for (const c of Object.values(state.countries)) {
    if (!c.alive) continue
    const mods = techMods(c)
    const sanN = state.treaties.reduce((n, t) => n + (t.type === 'sanctions' && t.status === 'active' && t.parties[1] === c.id ? 1 : 0), 0)
    // honest difficulty bonus: AI economies scale, player's does not
    const diffBonus = !c.isPlayer ? 1 + state.difficulty * 0.05 : 1
    const cycleMod = state.econCycle === 'boom' ? 1.1 : state.econCycle === 'recession' ? 0.85 : 1
    const corruptMod = Math.max(0.55, 1 - (c.corruption ?? 0) / 100)
    const income = c.industry * c.taxRate * Math.max(0.6, 1 - sanN * 0.08) * diffBonus * cycleMod * corruptMod
    const upkeep = c.divisions * (1.5 + c.tech * 0.35) + c.navy * 1.2 + c.population * 0.05
    const social = income * (c.socialSpend ?? 0.1)
    const invest = income * c.investRate
    const interest = (c.debt ?? 0) * 0.005 // ~6% yearly on national debt
    const net = income - upkeep - social - invest - interest
    if (net >= 0) {
      // surplus: pay down debt, rest to treasury
      const paydown = Math.min(c.debt ?? 0, net * 0.4) * dt
      c.debt = Math.max(0, (c.debt ?? 0) - paydown)
      c.treasury += (net * dt - paydown)
    } else {
      // deficit: borrow
      c.debt = (c.debt ?? 0) - net * dt
      c.treasury = Math.max(0, c.treasury + net * dt * 0.3)
    }
    if (c.treasury <= 0 && (c.debt ?? 0) > gdpOf(c) * 2) {
      c.stability = Math.max(0, c.stability - 1.2 * dt)
      c.divisions = Math.round(c.divisions * (1 - 0.025 * dt))
      c.equipment = Math.max(0, c.equipment * (1 - 0.02 * dt))
      if (rnd() < 0.01 * dt) ev(state, 'economy', 'ev_debt_crisis', { country: c.name }, true)
    } else if (c.treasury < 0) {
      c.stability = Math.max(0, c.stability - 0.8 * dt)
      c.divisions = Math.round(c.divisions * (1 - 0.025 * dt))
      c.equipment = Math.max(0, c.equipment * (1 - 0.02 * dt))
      c.treasury = 0
    }
    // social programs & corruption dynamics (Millennium-Dawn style)
    if ((c.socialSpend ?? 0) >= 0.15) c.stability = Math.min(100, c.stability + 0.06 * dt)
    else if ((c.socialSpend ?? 0) < 0.06 && (c.corruption ?? 0) > 18 && rnd() < 0.004 * dt) {
      c.stability = Math.max(0, c.stability - 4)
      ev(state, 'internal', 'ev_protests', { country: c.name })
    }
    c.corruption = Math.max(2, Math.min(50, (c.corruption ?? 10) + (state.econCycle === 'recession' ? 0.02 : -0.005) * dt))
    c.industry += invest * 0.05 * Math.max(0.2, (13 - c.tech) / 8) * mods.industryGrowth * dt
    c.tech = Math.min(12, c.tech + 0.0015 * dt * mods.scienceRate)
    c.science += (c.industry * 0.002 + 1) * mods.scienceRate * dt

    const atWar = atWarCache[c.id] = state.wars.some(w => !w.over && (w.attackers.includes(c.id) || w.defenders.includes(c.id)))
    c.population *= 1 + 0.0006 * (c.stability / 70) * (atWar ? 0.4 : 1) * dt
    c.stability += ((62 - c.stability) * 0.012 - (atWar ? 0.06 : 0)) * dt
    c.stability = Math.max(0, Math.min(100, c.stability))
    if (!atWar) c.warSupport += (35 - c.warSupport) * 0.02 * dt
    c.warSupport = Math.max(0, Math.min(100, c.warSupport))
    const cap = Math.round(c.population * 1.6)
    if (c.divisions < cap && c.treasury > 200) c.divisions = Math.min(cap, c.divisions + Math.max(0, Math.round((cap - c.divisions) * 0.008 * dt)))

    // --- resources ---
    const regions = regionsOf(state, c.id)
    const prod = { grain: 0, oil: 0, steel: 0, rare: 0 }
    for (const r of regions) {
      const d = depositOf(r)
      const extract = 0.6 + 0.08 * (c.techTree.ind ?? 0)
      prod.grain += (d.grain ?? 0) * extract
      prod.oil += (d.oil ?? 0) * extract
      prod.steel += (d.steel ?? 0) * extract
      prod.rare += (d.rare ?? 0) * extract
    }
    // military factories produce equipment from steel
    const steelNeedMil = c.factoriesMil * 0.4
    const steelAvail = c.stockpile.steel + prod.steel * dt
    const milRun = Math.min(c.factoriesMil, steelAvail / 0.4)
    c.equipment += milRun * 0.5 * dt
    // consumption
    const consGrain = c.population * 0.02 + c.divisions * 0.03
    const consOil = c.navy * 0.05 + c.industry * 0.002
    const consSteel = c.divisions * 0.01 + c.factoriesMil * 0.4
    const balGrain = prod.grain - consGrain
    const balOil = prod.oil - consOil
    const balSteel = prod.steel - consSteel
    const balRare = prod.rare - c.industry * 0.0005
    c.stockpile.grain = Math.max(0, Math.min(200, c.stockpile.grain + balGrain * dt))
    c.stockpile.oil = Math.max(0, c.stockpile.oil + balOil * dt)
    c.stockpile.steel = Math.max(0, c.stockpile.steel + balSteel * dt)
    c.stockpile.rare = Math.max(0, c.stockpile.rare + balRare * dt)
    // trade auto-buys deficits if treasury positive & has trade partners
    const hasTrade = state.treaties.some(t => t.type === 'trade' && t.status === 'active' && (t.parties[0] === c.id || t.parties[1] === c.id))
    if (c.stockpile.grain <= 0.01 && balGrain < 0) {
      const price = consGrain * 2 * dt
      if (c.treasury > price && (hasTrade || c.isPlayer)) {
        c.treasury -= price
        c.stockpile.grain += consGrain * dt
      } else if (rnd() < 0.05 * dt) {
        c.stability = Math.max(0, c.stability - 3)
        ev(state, 'economy', 'ev_famine', { country: c.name })
      }
    }
    // civilian factories boost industry income slightly
    c.industry += c.factoriesCiv * 0.3 * dt
  }
  // vassal tribute flows to the suzerain
  for (const t of state.treaties) {
    if (t.status !== 'active' || t.type !== 'vassal') continue
    const suzerain = state.countries[t.parties[0]], vassal = state.countries[t.parties[1]]
    if (suzerain?.alive && vassal?.alive && vassal.treasury > 50) {
      const tribute = Math.min(vassal.treasury * 0.5, vassal.industry * vassal.taxRate * 0.05 * dt)
      vassal.treasury -= tribute
      suzerain.treasury += tribute
    }
  }
}

// ---------------- politics: revolutions & separatism ----------------
function govFromIdeology(ideology: Ideology): Country['government'] {
  switch (ideology) {
    case 'communism': return 'communist'
    case 'fascism': return 'junta'
    case 'monarchism': return 'monarchy'
    case 'theocracy': return 'theocracy'
    default: return 'republic'
  }
}

export function internalEvents(state: GameState, dt: number): void {
  const year = Math.floor(state.month / 12)
  for (const c of Object.values(state.countries)) {
    if (!c.alive) continue
    const regions = regionsOf(state, c.id)
    if (regions.length === 0) continue
    // core culture = culture of the biggest region
    let coreRegion = regions[0], best = -1
    for (const r of regions) { const a = (POP[r] || 0.5); if (a > best) { best = a; coreRegion = r } }
    const coreCulture = cultureOf(coreRegion)

    // separatism: foreign-culture region + low stability
    if (regions.length >= 2 && c.stability < 35 && rnd() < 0.02 * dt) {
      const alien = regions.filter(r => cultureOf(r) !== coreCulture)
      if (alien.length) {
        const r = pick(alien)
        spawnRebel(state, c, r, 'separatist')
        continue
      }
    }
    // classic rebellion when collapsing
    if (regions.length >= 3 && c.stability < 15 && rnd() < 0.025 * dt) {
      spawnRebel(state, c, pick(regions), 'rebel')
      continue
    }
    // revolution: ideology flip toward a hostile neighbor's ideology
    if (c.stability < 25 && rnd() < 0.015 * dt) {
      const neighborIds = new Set<string>()
      for (const r of regions) for (const nb of adjMap[r] ?? []) {
        const o = state.regionOwner[nb]
        if (o && o !== c.id && state.countries[o]?.alive) neighborIds.add(o)
      }
      const hostile = [...neighborIds].map(n => state.countries[n])
        .filter(n => ideologyAffinity(n.ideology, c.ideology) <= -15)
      if (hostile.length) {
        const newIdeology = pick(hostile).ideology
        const old = c.ideology
        c.ideology = newIdeology
        c.government = govFromIdeology(newIdeology)
        c.stability = Math.min(100, c.stability + 20)
        c.warSupport = Math.min(100, c.warSupport + 10)
        const ideo = (i: Ideology) => ({ monarchism: ['монархизм', 'monarchism'], fascism: ['фашизм', 'fascism'], communism: ['коммунизм', 'communism'], democracy: ['демократия', 'democracy'], theocracy: ['теократия', 'theocracy'] })[i][state.lang === 'ru' ? 0 : 1]
        ev(state, 'internal', 'ev_revolution', { country: c.name, from: ideo(old), to: ideo(newIdeology) }, true)
      }
    }
    // plague
    if (rnd() < 0.002 * dt) {
      c.population *= 0.985
      c.stability = Math.max(0, c.stability - 6)
      ev(state, 'internal', 'ev_plague', { country: c.name })
    }
    // leader death -> new leader flavor
    if (rnd() < 0.003 * dt && c.leader) {
      ev(state, 'internal', 'ev_leader_change', { country: c.name, leader: c.leader })
    }
  }
}

function spawnRebel(state: GameState, c: Country, r: string, kind: 'separatist' | 'rebel'): void {
  const newId = r + '_R'
  if (state.countries[newId]) return
  state.regionOwner[r] = newId
  const pop = (POP[r] || 0.5)
  state.countries[newId] = {
    id: newId,
    name: (MODERN[r]?.[state.lang] ?? r) + (state.lang === 'ru' ? (kind === 'separatist' ? ' (сепаратисты)' : ' (повстанцы)') : (kind === 'separatist' ? ' (separatists)' : ' (rebels)')),
    color: PALETTE[hashCode(newId) % PALETTE.length],
    flag: '🏴', government: 'republic', ideology: c.ideology, personality: 'cautious',
    isPlayer: false, alive: true,
    population: pop * 0.8, industry: pop * 3, tech: c.tech * 0.9,
    treasury: 100, stability: 40, warSupport: 70,
    divisions: Math.max(1, Math.round(pop * 0.4)), navy: 0,
    taxRate: 0.2, investRate: 0.2, reputation: 50,
    relations: { [c.id]: -60 }, aiMemory: {}, lastAiActionMonth: state.month,
    resources: { grain: 0, oil: 0, steel: 0, rare: 0 },
    stockpile: { grain: 5, oil: 1, steel: 5, rare: 0 },
    factoriesCiv: 1, factoriesMil: 0, equipment: 0,
    techTree: { inf: 0, arm: 0, air: 0, nav: 0, ind: 0, sci: 0 },
    science: 0, prestige: 10,
    nukeProgress: 0, nukes: 0,
    debt: 0, corruption: 20, socialSpend: 0.08,
    leader: '',
  }
  c.relations[newId] = -60
  c.stability = Math.min(100, c.stability + 8)
  ev(state, 'internal', kind === 'separatist' ? 'ev_separatism' : 'ev_rebellion',
    { country: c.name, region: r, new: state.countries[newId].name }, true)
}

// ---------------- AI ----------------
export function aiTurns(state: GameState, dt: number): void {
  const yearNow = Math.floor(state.month / 12)
  for (const c of Object.values(state.countries)) {
    if (c.isPlayer || !c.alive) continue
    // nuclear arms race: great powers develop the bomb after 1945
    if (yearNow >= 1945 && c.nukes < 3 && c.treasury > 800 && rnd() < 0.03 * dt) {
      c.nukeProgress += 4 + (c.techTree.sci ?? 0)
      c.treasury -= 40 * dt
      if (c.nukeProgress >= 100) {
        c.nukeProgress = 0
        c.nukes += 1
        ev(state, 'tech', 'ev_nuke_done', { country: c.name }, true)
      }
    }
    if (state.month - c.lastAiActionMonth < 1) continue
    const rng = mulberry32(hashCode(c.id + Math.floor(state.month * 4)))
    const activity = { expansionist: 0.45, militarist: 0.4, opportunist: 0.4, diplomat: 0.35, merchant: 0.3, cautious: 0.2, isolationist: 0.12, zealot: 0.35 }[c.personality] ?? 0.3
    if (rng() > activity * dt * 2) continue
    const activeWars = state.wars.filter(w => !w.over).length
    if (activeWars > 3 && rng() < 0.4) continue
    c.lastAiActionMonth = state.month

    const myRegions = regionsOf(state, c.id)
    const neighbors = new Set<string>()
    for (const r of myRegions) for (const nb of adjMap[r] ?? []) {
      const owner = state.regionOwner[nb]
      if (owner && owner !== c.id && state.countries[owner]?.alive) neighbors.add(owner)
    }
    const atWar = state.wars.some(w => !w.over && (w.attackers.includes(c.id) || w.defenders.includes(c.id)))

    if (!atWar && (c.personality === 'expansionist' || c.personality === 'militarist' || c.personality === 'opportunist' || c.personality === 'zealot')) {
      if (c.warSupport > 38 && c.divisions > 3) {
        for (const n of neighbors) {
          const target = state.countries[n]
          if (!target) continue
          if (target.isPlayer && state.difficulty < 2 && rnd() < 0.5) continue
          if (hasTreaty(state, c.id, n, 'alliance')) continue
          if (hasTreaty(state, c.id, n, 'nap')) {
            if (c.personality !== 'opportunist' && c.personality !== 'zealot' && c.personality !== 'expansionist') continue
            if (rnd() < 0.75) continue
          }
          const myP = power(c), theirP = power(target)
          const relT = c.relations[n] ?? 0
          // only attack clearly weaker targets — or arch-enemies
          if (theirP > myP * 0.8 && relT > -60) continue
          // respect guarantees & suzerains of stronger powers
          const guarantor = state.treaties.find(t => t.status === 'active' && (t.type === 'guarantee' || t.type === 'vassal') &&
            (t.parties[0] === n || t.parties[1] === n))
          if (guarantor) {
            const g = guarantor.parties[0] === n ? guarantor.parties[1] : guarantor.parties[0]
            if (state.countries[g]?.alive && power(state.countries[g]) > myP * 0.8 && rnd() < 0.8) continue
          }
          const rel = c.relations[n] ?? 0
          const greed = (c.personality === 'expansionist' ? 38 : c.personality === 'militarist' ? 32 : c.personality === 'zealot' ? 26 : 22)
          const score = greed + (myP / Math.max(1, theirP)) * 26 + (rel < -40 ? 18 : rel < -10 ? 8 : 0) + (target.stability < 30 ? 12 : 0)
            + ideologyAffinity(c.ideology, target.ideology) * -0.3
          const threshold = 52 + state.difficulty * 2 - (target.isPlayer ? 14 : 0)
          if (score > threshold && rnd() < 0.65) {
            for (const t of state.treaties) {
              if (t.status === 'active' && (t.type === 'nap' || t.type === 'alliance') &&
                ((t.parties[0] === c.id && t.parties[1] === n) || (t.parties[1] === c.id && t.parties[0] === n))) breakTreaty(state, t.id, c.id)
            }
            declareWar(state, c.id, n)
            return
          }
        }
      }
    }

    // economic pressure: sanction hated rivals instead of (or before) war
    for (const [other, rel] of Object.entries(c.relations)) {
      const oc = state.countries[other]
      if (!oc?.alive || rel > -50 || rnd() > 0.06 * dt) continue
      if (!hasTreaty(state, c.id, other, 'sanctions')) {
        imposeSanctions(state, c.id, other)
        break
      }
    }

    const candidates = [...neighbors].map(n => ({ id: n, threat: power(state.countries[n]) / Math.max(1, power(c)), rel: c.relations[n] ?? 0 }))
    if (candidates.length) {
      const biggest = candidates.sort((a, b) => b.threat - a.threat)[0]
      if (biggest.threat > 1.1 && (c.relations[biggest.id] ?? 0) > -30 && !atWarWith(state, c.id, biggest.id)) {
        if (rnd() < 0.5) {
          if (!hasTreaty(state, c.id, biggest.id, 'nap') && rnd() < 0.6) proposeTreaty(state, c.id, biggest.id, 'nap')
          else changeRel(state, c.id, biggest.id, 5)
          return
        }
      }
      if (c.personality === 'merchant' || c.personality === 'diplomat') {
        const friendly = candidates.filter(x => x.rel > 15 && !atWarWith(state, c.id, x.id))
        if (friendly.length && rnd() < 0.5) {
          const t = pick(friendly)
          if (!hasTreaty(state, c.id, t.id, 'trade')) proposeTreaty(state, c.id, t.id, 'trade')
          else changeRel(state, c.id, t.id, 4)
          return
        }
      }
      if (biggest.threat > 1.5) {
        for (const cand of candidates) {
          if (cand.id === biggest.id) continue
          if ((c.relations[cand.id] ?? 0) > 25 && !hasTreaty(state, c.id, cand.id, 'alliance') && !atWarWith(state, c.id, cand.id)) {
            if (commonEnemy(state, c.id, cand.id) || power(state.countries[cand.id]) > power(c) * 0.6) {
              if (rnd() < 0.35) { proposeTreaty(state, c.id, cand.id, 'alliance'); return }
            }
          }
        }
      }
    }
    if (rnd() < 0.3 && candidates.length) {
      const t = pick(candidates)
      changeRel(state, c.id, t.id, rnd() < 0.5 ? 2 : -2)
    }
  }
}

// ---------------- victory ----------------
export function checkVictory(state: GameState): void {
  if (!state.victoryEnabled || state.victory) return
  const alive = Object.values(state.countries).filter(c => c.alive)
  const worldIndustry = alive.reduce((s, c) => s + c.industry, 0)
  const top = alive.slice().sort((a, b) => b.industry - a.industry)[0]
  const share = top ? top.industry / Math.max(1, worldIndustry) : 0
  let winner: Country | null = null
  let type: 'domination' | 'economy' | 'science' | 'culture' | null = null
  if (share > 0.4) { winner = top; type = 'domination' }
  else if (share > 0.25 && top && top.industry > (alive[1]?.industry ?? 0) * 1.5) { winner = top; type = 'economy' }
  else {
    for (const c of alive) {
      if (BRANCHES.every(b => (c.techTree[b] ?? 0) >= MAX_TIER)) { winner = c; type = 'science'; break }
    }
    if (!winner) for (const c of alive) {
      if (c.prestige > 90 && c.stability > 70) { winner = c; type = 'culture'; break }
    }
  }
  if (winner && type) {
    state.victory = { type, winner: winner.id }
    ev(state, 'world', 'ev_victory', { country: winner.name, type }, true)
    if (winner.isPlayer) state.gameOver = true
  }
}

// ---------------- advance (fractional months: weeks supported) ----------------
// ---------------- world congress ----------------
export function startCongress(state: GameState): void {
  const alive = Object.values(state.countries).filter(c => c.alive)
  if (alive.length < 3) return
  const proposer = alive.filter(c => !c.isPlayer).sort((a, b) => b.prestige - a.prestige)[0] ?? alive[0]
  const wars = state.wars.filter(w => !w.over)
  const rogue = alive.filter(c => c.reputation < 35).sort((a, b) => a.reputation - b.reputation)[0]
  let resolution = 'cong_freetrade', target: string | undefined
  if (wars.length && rnd() < 0.5) {
    resolution = 'cong_peace'
    target = wars[0].attackers[0]
  } else if (rogue) {
    resolution = 'cong_condemn'
    target = rogue.id
  }
  const votes: Record<string, 'yes' | 'no' | 'abstain'> = {}
  for (const c of alive) {
    if (c.isPlayer) continue
    if (c.id === proposer.id) { votes[c.id] = 'yes'; continue }
    let score = (relOf(state, c.id, proposer.id) ?? 0) / 10 + c.reputation / 25 - 4
    if (resolution === 'cong_condemn' && target) {
      if (c.id === target) score = -50
      else score += (35 - state.countries[target].reputation) / 8
    }
    if (resolution === 'cong_peace' && target) {
      const w = wars[0]
      if (w.attackers.includes(c.id)) score = -40
      if (w.defenders.includes(c.id)) score = 40
    }
    votes[c.id] = score > 2 ? 'yes' : score < -2 ? 'no' : 'abstain'
  }
  state.congress = { month: state.month, resolution, target, proposedBy: proposer.id, votes }
  ev(state, 'diplomacy', 'ev_congress_open', { country: proposer.name }, true)
}

export function resolveCongress(state: GameState): void {
  const cg = state.congress
  if (!cg) return
  let yes = 0, no = 0
  for (const [id, v] of Object.entries(cg.votes)) {
    const w = Math.sqrt(power(state.countries[id] ?? { industry: 0, population: 0, divisions: 0, navy: 0, tech: 0 } as never))
    if (v === 'yes') yes += w
    else if (v === 'no') no += w
  }
  cg.passed = yes > no
  if (cg.passed) {
    if (cg.resolution === 'cong_condemn' && cg.target) {
      const t = state.countries[cg.target]
      if (t) { t.reputation = Math.max(0, t.reputation - 15); t.prestige = Math.max(0, t.prestige - 8) }
    } else if (cg.resolution === 'cong_peace') {
      for (const w of state.wars) if (!w.over) {
        for (const id of [...w.attackers, ...w.defenders]) {
          const c = state.countries[id]
          if (c) c.warSupport = Math.max(0, c.warSupport - 12)
        }
      }
    } else {
      for (const c of Object.values(state.countries)) if (c.alive) c.prestige = Math.min(100, c.prestige + 2)
    }
  }
  const resLabel = ({
    cong_freetrade: ['Свободная торговля для всех', 'Free trade for all'],
    cong_condemn: ['Осуждение агрессора', 'Condemnation of the rogue state'],
    cong_peace: ['Призыв к прекращению войн', 'Call to end the wars'],
  } as Record<string, [string, string]>)[cg.resolution]?.[state.lang === 'ru' ? 0 : 1] ?? cg.resolution
  ev(state, 'diplomacy', cg.passed ? 'ev_congress_pass' : 'ev_congress_fail',
    { res: resLabel, country: state.countries[cg.proposedBy]?.name ?? '' }, true)
  state.congress = undefined
}

// ---------------- achievements ----------------
const ACH_DEFS: { id: string; check: (s: GameState) => boolean }[] = [
  { id: 'ach_first_conquest', check: s => { const h0 = s.history[0]; return !!h0 && regionsOf(s, s.playerId).length > h0.regions } },
  { id: 'ach_nuclear', check: s => (s.countries[s.playerId]?.nukes ?? 0) >= 1 || (s.wars.some(w => (w.nukesUsed ?? 0) > 0 && w.attackers[0] === s.playerId)) },
  { id: 'ach_diplomat', check: s => s.treaties.filter(t => t.status === 'active' && t.parties.includes(s.playerId) && t.type !== 'sanctions').length >= 5 },
  { id: 'ach_tycoon', check: s => { const h0 = s.history[0]; const p = s.countries[s.playerId]; return !!h0 && !!p && p.industry >= h0.industry * 3 } },
  { id: 'ach_survivor', check: s => s.monthCount - 0 >= 600 },
  { id: 'ach_general_staff', check: s => s.wars.some(w => !w.over && w.playerControlled && (w.attackers.includes(s.playerId) || w.defenders.includes(s.playerId))) },
  { id: 'ach_minister', check: s => s.wars.some(w => !w.over && w.playerControlled === false && (w.attackers.includes(s.playerId) || w.defenders.includes(s.playerId))) },
  { id: 'ach_sanctions', check: s => s.treaties.some(t => t.type === 'sanctions' && t.status === 'active' && t.parties[0] === s.playerId) },
  { id: 'ach_victory', check: s => !!s.victory && s.victory.winner === s.playerId },
  { id: 'ach_century', check: s => s.monthCount >= 1200 },
]

export const ACH_IDS = ACH_DEFS.map(a => a.id)

// ---------------- real historical events ----------------
export function gdpOf(c: Country): number {
  return Math.round(c.industry * (10 + c.population * 0.5))
}

export function checkHistoricalEvents(state: GameState): void {
  if (!state.historicalFired) state.historicalFired = []
  const year = Math.floor(state.month / 12)
  const month = Math.floor(state.month) % 12
  const api: HistApi = {
    ev: (kind, key, params, major) => ev(state, kind, key, params, major),
    find: (...ids) => {
      for (const id of ids) {
        const c = state.countries[id]
        if (c?.alive) return c
      }
      return null
    },
    setIdeology: (c, ideo) => {
      c.ideology = ideo
      c.government = govFromIdeology(ideo)
    },
    war: (att, def) => {
      if (!att.alive || !def.alive || att.isPlayer || def.isPlayer) return false
      if (atWarWith(state, att.id, def.id)) return false
      declareWar(state, att.id, def.id, 'historical', true)
      return true
    },
    rel: (a, b, d) => { changeRel(state, a.id, b.id, d); changeRel(state, b.id, a.id, d) },
    allAlive: fn => { for (const c of Object.values(state.countries)) if (c.alive) fn(c) },
    setCycle: c => { state.econCycle = c },
  }
  for (const h of HISTORICAL) {
    if (h.year > year || (h.year === year && (h.month ?? 0) > month)) continue
    if (state.historicalFired.includes(h.id)) continue
    if (h.year < state.startYear) continue // started later — history already happened
    if (h.needs) {
      const ok = h.needs.every(group => group.some(id => state.countries[id]?.alive))
      if (!ok) { state.historicalFired.push(h.id); continue }
    }
    state.historicalFired.push(h.id)
    ev(state, 'world', h.key, { year: h.year }, h.major ?? false)
    try { h.fx?.(state, api) } catch { /* sandbox-safe */ }
  }
}

const ACH_LABELS: Record<string, [string, string]> = {
  ach_first_conquest: ['Первое завоевание', 'First Conquest'],
  ach_nuclear: ['Ядерная держава', 'Nuclear Power'],
  ach_diplomat: ['Дипломат', 'Diplomat'],
  ach_tycoon: ['Магнат', 'Tycoon'],
  ach_survivor: ['Выживший', 'Survivor'],
  ach_general_staff: ['Генштаб', 'General Staff'],
  ach_minister: ['Делегирование', 'Delegation'],
  ach_sanctions: ['Экономическое оружие', 'Economic Weapon'],
  ach_victory: ['Победитель', 'Victor'],
  ach_century: ['Столетие у власти', 'Century in Power'],
}

export function checkAchievements(state: GameState): void {
  if (!state.achievements) state.achievements = []
  for (const a of ACH_DEFS) {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id)
      ev(state, 'world', 'ev_achievement', { ach: ACH_LABELS[a.id]?.[state.lang === 'ru' ? 0 : 1] ?? a.id }, true)
    }
  }
}

export function advanceMonths(state: GameState, months: number): GameState {
  let remaining = months
  while (remaining > 0.001 && !state.gameOver) {
    const dt = Math.min(0.25, remaining)
    remaining -= dt
    state.month += dt
    state.monthCount += dt
    updateEconomy(state, dt)
    aiTurns(state, dt)
    updateWars(state, dt)
    internalEvents(state, dt)
    for (const t of state.treaties) {
      if (t.status === 'active' && t.expiresMonth && state.month >= t.expiresMonth) {
        t.status = 'expired'
        ev(state, 'diplomacy', 'ev_treaty_expired', { a: state.countries[t.parties[0]]?.name ?? '', b: state.countries[t.parties[1]]?.name ?? '', type: t.type })
      }
    }
    // congress every ~5 years; timeout if player never votes
    if (!state.congress && Math.floor(state.monthCount / 60) !== Math.floor((state.monthCount - dt) / 60)) startCongress(state)
    if (state.congress && !state.congress.playerVoted && state.month > state.congress.month + 3) {
      state.congress.votes[state.playerId] = 'abstain'
      state.congress.playerVoted = true
      resolveCongress(state)
    }
    // yearly history + victory check + achievements + history timeline
    if (Math.floor(state.month) !== Math.floor(state.month - dt)) {
      const p = state.countries[state.playerId]
      if (p) state.history.push({ month: state.month, industry: Math.round(p.industry), population: +p.population.toFixed(1), regions: regionsOf(state, p.id).length })
      checkHistoricalEvents(state)
      checkVictory(state)
      checkAchievements(state)
      // global economic cycle drifts
      const r = rnd()
      if (state.econCycle === 'stable' && r < 0.012) { state.econCycle = r < 0.006 ? 'recession' : 'boom'; ev(state, 'economy', state.econCycle === 'recession' ? 'ev_recession' : 'ev_boom', {}, true) }
      else if (state.econCycle === 'recession' && r < 0.05) { state.econCycle = 'stable'; ev(state, 'economy', 'ev_recovery', {}, false) }
      else if (state.econCycle === 'boom' && r < 0.06) { state.econCycle = 'stable' }
    }
    const p = state.countries[state.playerId]
    if (p && p.alive && regionsOf(state, state.playerId).length === 0) {
      p.alive = false
      state.gameOver = true
      ev(state, 'world', 'ev_player_destroyed', { country: p.name }, true)
    }
    if (!p?.alive && !state.gameOver) state.gameOver = true
  }
  return state
}
