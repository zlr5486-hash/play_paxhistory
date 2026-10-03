import type { Country, GameState, GameEvent, PlayerOrder, TreatyType, War, Ideology, TechBranch } from './types'
import {
  ADJACENCY, adjMap, regionsOf, power, relOf, hasTreaty, atWarWith, isCoastal, mulberry32, hashCode, PALETTE,
} from './setup'
import { POP, LANDLOCKED } from '../data/regionMeta'
import { MODERN } from '../data/polities'
import { depositOf } from '../data/resources'
import { cultureOf } from '../data/cultures'
import { techMods, researchCost, canResearch, MAX_TIER, BRANCHES } from './tech'

const rnd = Math.random
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]

export function ev(state: GameState, kind: GameEvent['kind'], key: string, params: Record<string, string | number>, major = false): void {
  state.events.push({ id: state.nextId++, month: state.month, kind, key, params, major })
  if (state.events.length > 500) state.events.splice(0, state.events.length - 500)
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
      if (!silent) ev(state, 'tech', 'ev_tech_advance', { country: p.name, branch: String(branch), tier: p.techTree[branch] })
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
  }
  return false
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
    ca.stability = Math.max(0, ca.stability - 10)
    ca.warSupport = Math.max(0, ca.warSupport - 15)
    ev(state, 'war', 'ev_no_cb', { a: ca.name }, true)
  }
  const attackers = [attacker]
  const defenders = [defender]
  for (const t of state.treaties) {
    if (t.status !== 'active' || t.type !== 'alliance') continue
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
  state.wars.push({ id: state.nextId++, attackers, defenders, startedMonth: state.month, occupations: {}, over: false, cb: realCb ?? undefined, playerControlled })
  changeRel(state, attacker, defender, -40)
  ca.warSupport = Math.min(100, ca.warSupport + 25)
  cd.warSupport = Math.min(100, cd.warSupport + 20)
  ev(state, 'war', 'ev_war_declared', { a: ca.name, b: cd.name, cb: realCb ?? 'none' }, true)
}

// ---------------- wars ----------------
function warSidesPower(state: GameState, w: War): [number, number] {
  const sideP = (ids: string[], defending: boolean) => ids.reduce((s, id) => {
    const c = state.countries[id]
    if (!c || !c.alive) return s
    const mods = techMods(c)
    const equipBonus = c.divisions > 0 ? Math.min(1, c.equipment / c.divisions) * 0.3 : 0
    const supply = supplyFactor(c)
    return s + c.divisions * (1 + c.tech / 8) * (0.55 + c.warSupport / 220) * (0.85 + rnd() * 0.3)
      * (defending ? 1.18 : 1) * (defending ? mods.armyDefense : mods.armyAttack) * (1 + equipBonus) * supply + c.navy * 2 * mods.navyPower
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
    const capitulate = c.warSupport < 12 || (origRegions.length > 0 && occCount / origRegions.length > 0.55) || (forced && c.warSupport < 25)
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
    const income = c.industry * c.taxRate
    const upkeep = c.divisions * (1.5 + c.tech * 0.35) + c.navy * 1.2 + c.population * 0.05
    const invest = income * c.investRate
    const net = income - upkeep - invest
    c.treasury += net * dt
    if (c.treasury < 0) {
      c.stability = Math.max(0, c.stability - 0.8 * dt)
      c.divisions = Math.round(c.divisions * (1 - 0.01 * dt))
      c.treasury = 0
    }
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
        ev(state, 'internal', 'ev_revolution', { country: c.name, from: old, to: newIdeology }, true)
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
    leader: '',
  }
  c.relations[newId] = -60
  c.stability = Math.min(100, c.stability + 8)
  ev(state, 'internal', kind === 'separatist' ? 'ev_separatism' : 'ev_rebellion',
    { country: c.name, region: r, new: state.countries[newId].name }, true)
}

// ---------------- AI ----------------
export function aiTurns(state: GameState, dt: number): void {
  for (const c of Object.values(state.countries)) {
    if (c.isPlayer || !c.alive) continue
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
          if (theirP > myP * 1.6) continue
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
    // yearly history + victory check
    if (Math.floor(state.month) !== Math.floor(state.month - dt)) {
      const p = state.countries[state.playerId]
      if (p) state.history.push({ month: state.month, industry: Math.round(p.industry), population: +p.population.toFixed(1), regions: regionsOf(state, p.id).length })
      checkVictory(state)
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
