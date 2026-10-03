import type { Country, GameState, GameEvent, PlayerOrder, TreatyType, War } from './types'
import {
  ADJACENCY, adjMap, regionsOf, power, relOf, hasTreaty, atWarWith, isCoastal, mulberry32, hashCode, PALETTE,
} from './setup'
import { POP } from '../data/regionMeta'
import { MODERN } from '../data/polities'

const rnd = Math.random
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]

export function ev(state: GameState, kind: GameEvent['kind'], key: string, params: Record<string, string | number>, major = false): void {
  state.events.push({ id: state.nextId++, month: state.month, kind, key, params, major })
  if (state.events.length > 400) state.events.splice(0, state.events.length - 400)
}

export function changeRel(state: GameState, a: string, b: string, delta: number): void {
  const ca = state.countries[a], cb = state.countries[b]
  if (!ca || !cb || a === b) return
  ca.relations[b] = Math.max(-100, Math.min(100, (ca.relations[b] ?? 0) + delta))
  cb.relations[a] = Math.max(-100, Math.min(100, (cb.relations[a] ?? 0) + delta * 0.8))
}

export function countryName(state: GameState, id: string): string {
  return state.countries[id]?.name ?? id
}

// ---------------- player orders ----------------
export function applyOrder(state: GameState, o: PlayerOrder, silent = false): boolean {
  const p = state.countries[state.playerId]
  if (!p || !p.alive) return false
  const cost = (n: number) => {
    if (p.treasury < n) { if (!silent) ev(state, 'player', 'ev_no_funds', { need: Math.round(n) }); return false }
    p.treasury -= n
    return true
  }
  switch (o.type) {
    case 'invest': {
      const amt = o.amount ?? Math.round(p.treasury * 0.15)
      if (!cost(amt)) return false
      p.industry += amt * 0.08 * (13 - p.tech) / 8
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
  }
  return false
}

// ---------------- diplomacy ----------------
export interface ProposalResult { accepted: boolean; reasonKey: string }

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
    case 'alliance': {
      score += 28
      const commonThreat = commonEnemy(state, from, to)
      if (commonThreat) score += 22
      if (theirPower < myPower * 0.6) score -= 15   // why ally with the weak
      if (myPower < theirPower * 0.5) score += 12   // protection
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
  // reputation of the proposer
  score += (cf.reputation - 60) * 0.4
  // at-war AI hates everyone a bit less to accept peace
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

export function proposeTreaty(state: GameState, from: string, to: string, type: TreatyType): ProposalResult {
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
  changeRel(state, by, other, -35)
  ev(state, 'diplomacy', 'ev_treaty_broken', { a: state.countries[by].name, b: state.countries[other].name, type: t.type }, true)
}

export function declareWar(state: GameState, attacker: string, defender: string, cb?: string): void {
  if (atWarWith(state, attacker, defender)) return
  const ca = state.countries[attacker], cd = state.countries[defender]
  if (!ca || !cd || !ca.alive || !cd.alive) return
  const attackers = [attacker]
  const defenders = [defender]
  // allies honor alliances
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
  // guarantees
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
  state.wars.push({ id: state.nextId++, attackers, defenders, startedMonth: state.month, occupations: {}, over: false, cb })
  changeRel(state, attacker, defender, -40)
  ca.warSupport = Math.min(100, ca.warSupport + 25)
  cd.warSupport = Math.min(100, cd.warSupport + 20)
  ev(state, 'war', 'ev_war_declared', { a: ca.name, b: cd.name, cb: cb ?? '' }, true)
}

// ---------------- wars ----------------
function warSidesPower(state: GameState, w: War): [number, number] {
  const sideP = (ids: string[], defending: boolean) => ids.reduce((s, id) => {
    const c = state.countries[id]
    if (!c || !c.alive) return s
    return s + c.divisions * (1 + c.tech / 8) * (0.55 + c.warSupport / 220) * (0.85 + rnd() * 0.3) * (defending ? 1.18 : 1) + c.navy * 2
  }, 0)
  return [sideP(w.attackers, false), sideP(w.defenders, true)]
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

export function updateWars(state: GameState): void {
  for (const w of state.wars) {
    if (w.over) continue
    const [attP, defP] = warSidesPower(state, w)
    const ratio = attP / Math.max(1, defP)
    const totalP = attP + defP

    // battles & occupation
    if (ratio > 1.12) {
      const targets = candidateTargets(state, w, w.attackers)
      if (targets.length) {
        const n = Math.min(targets.length, 1 + Math.floor((ratio - 1) * 3))
        const occupier = w.attackers.filter(a => state.countries[a]?.alive).sort((a, b) => power(state.countries[b]) - power(state.countries[a]))[0]
        for (let i = 0; i < n; i++) {
          const r = targets.splice(Math.floor(rnd() * targets.length), 1)[0]
          if (state.regionOwner[r] && !w.defenders.includes(state.regionOwner[r])) continue
          w.occupations[r] = occupier
          ev(state, 'war', 'ev_region_occupied', { region: r, by: state.countries[occupier]?.name ?? occupier })
        }
      }
    } else if (ratio < 0.88) {
      const occ = Object.keys(w.occupations)
      if (occ.length && rnd() < 0.7) {
        const r = pick(occ)
        delete w.occupations[r]
        ev(state, 'war', 'ev_region_liberated', { region: r, by: state.countries[w.defenders[0]]?.name ?? '' })
      } else {
        const targets = candidateTargets(state, w, w.defenders)
        if (targets.length && ratio < 0.6) {
          const r = pick(targets)
          const occupier = w.defenders.filter(a => state.countries[a]?.alive)[0]
          if (occupier && state.regionOwner[r] && w.attackers.includes(state.regionOwner[r])) {
            w.occupations[r] = occupier
            ev(state, 'war', 'ev_region_occupied', { region: r, by: state.countries[occupier].name })
          }
        }
      }
    }

    // attrition
    const atLoss = Math.round(totalP * 0.006 * (ratio < 1 ? 1.4 : 0.7))
    const dfLoss = Math.round(totalP * 0.006 * (ratio > 1 ? 1.4 : 0.7))
    applyLosses(state, w.attackers, atLoss)
    applyLosses(state, w.defenders, dfLoss)

    // war support erosion
    for (const id of [...w.attackers, ...w.defenders]) {
      const c = state.countries[id]
      if (!c) continue
      const winning = w.attackers.includes(id) ? ratio > 1.05 : ratio < 0.95
      c.warSupport = Math.max(0, Math.min(100, c.warSupport + (winning ? 0.4 : -1.1)))
      c.stability = Math.max(0, c.stability - 0.08)
    }

    // surrender checks
    checkSurrender(state, w, w.defenders, w.attackers, ratio < 0.7)
    if (!w.over) checkSurrender(state, w, w.attackers, w.defenders, ratio > 1.4)

    // AI sues for peace if hopeless
    if (!w.over) {
      for (const side of [w.defenders, w.attackers]) {
        for (const id of side) {
          const c = state.countries[id]
          if (!c || !c.alive || c.isPlayer) continue
          if (c.warSupport < 18 && rnd() < 0.25) {
            const enemy = side === w.attackers ? w.defenders[0] : w.attackers[0]
            const myPower = power(c)
            const theirPower = power(state.countries[enemy] ?? c)
            if (myPower < theirPower * 0.85 || c.warSupport < 10) {
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

  // cede occupied regions touching winner's territory
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
  // return all remaining occupied regions of the loser
  for (const r of Object.keys(w.occupations)) {
    if (state.regionOwner[r] === loserId) delete w.occupations[r]
  }
  // reparations
  if (capitulation) {
    const rep = Math.round(loser.treasury * 0.25)
    loser.treasury -= rep
    winner.treasury += rep
    loser.stability = Math.max(5, loser.stability - 15)
    loser.warSupport = 35
  }
  loser.warSupport = Math.max(loser.warSupport, 30)

  // nation destroyed?
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
  // end war if one side empty
  const attAlive = w.attackers.filter(i => state.countries[i]?.alive && regionsOf(state, i).length > 0)
  const defAlive = w.defenders.filter(i => state.countries[i]?.alive && regionsOf(state, i).length > 0)
  if (!attAlive.length || !defAlive.length) w.over = true
  else if (losersOf(w).every(l => !state.countries[l]?.alive)) w.over = true
  changeRel(state, loserId, winner.id, 8)
}

function losersOf(w: War): string[] { return [...w.attackers, ...w.defenders] }

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

// ---------------- economy ----------------
export function updateEconomy(state: GameState): void {
  for (const c of Object.values(state.countries)) {
    if (!c.alive) continue
    const income = c.industry * c.taxRate * 1.0
    const upkeep = c.divisions * (1.5 + c.tech * 0.35) + c.navy * 1.2 + c.population * 0.05
    const net = income - upkeep - income * c.investRate
    c.treasury += net
    if (c.treasury < 0) {
      c.stability = Math.max(0, c.stability - 0.8)
      c.divisions = Math.round(c.divisions * 0.99)
      c.treasury = 0
    }
    // investment grows industry
    const inv = income * c.investRate
    c.industry += inv * 0.05 * Math.max(0.2, (13 - c.tech) / 8)
    // passive tech creep
    c.tech = Math.min(12, c.tech + 0.0015)
    // population
      const atWar = state.wars.some(w => !w.over && (w.attackers.includes(c.id) || w.defenders.includes(c.id)))
      c.population *= 1 + 0.0006 * (c.stability / 70) * (atWar ? 0.4 : 1)
      // drift
      c.stability += (62 - c.stability) * 0.012 - (atWar ? 0.06 : 0)
    c.stability = Math.max(0, Math.min(100, c.stability))
    if (!atWar) c.warSupport += (35 - c.warSupport) * 0.02
    c.warSupport = Math.max(0, Math.min(100, c.warSupport))
    // recruitment
    const cap = Math.round(c.population * 1.6)
    if (c.divisions < cap && c.treasury > 200) c.divisions = Math.min(cap, c.divisions + Math.max(0, Math.round((cap - c.divisions) * 0.008)))
  }
}

// ---------------- AI nations ----------------
export function aiTurns(state: GameState): void {
  for (const c of Object.values(state.countries)) {
    if (c.isPlayer || !c.alive) continue
    if (state.month - c.lastAiActionMonth < 1) continue
    const rng = mulberry32(hashCode(c.id + state.month))
    const activity = { expansionist: 0.45, militarist: 0.4, opportunist: 0.4, diplomat: 0.35, merchant: 0.3, cautious: 0.2, isolationist: 0.12, zealot: 0.35 }[c.personality] ?? 0.3
    if (rng() > activity) continue
    // global war fatigue: fewer new conflicts when the world is already burning
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

    // 1. consider war (not while already at war)
    if (!atWar && (c.personality === 'expansionist' || c.personality === 'militarist' || c.personality === 'opportunist' || c.personality === 'zealot')) {
      if (c.warSupport > 38 && c.divisions > 3) {
        for (const n of neighbors) {
          const target = state.countries[n]
          if (!target) continue
          if (target.isPlayer && state.difficulty < 2 && rnd() < 0.5) continue // easier difficulties spare the player a bit
          if (hasTreaty(state, c.id, n, 'alliance')) continue
          if (hasTreaty(state, c.id, n, 'nap')) {
            if (c.personality !== 'opportunist' && c.personality !== 'zealot' && c.personality !== 'expansionist') continue
            if (rnd() < 0.75) continue
          }
          const myP = power(c), theirP = power(target)
          if (theirP > myP * 1.6) continue // sanity: don't attack a clearly stronger power
          const rel = c.relations[n] ?? 0
          const greed = (c.personality === 'expansionist' ? 38 : c.personality === 'militarist' ? 32 : c.personality === 'zealot' ? 26 : 22)
          const score = greed + (myP / Math.max(1, theirP)) * 26 + (rel < -40 ? 18 : rel < -10 ? 8 : 0) + (target.stability < 30 ? 12 : 0)
          const threshold = 52 + state.difficulty * 2 - (target.isPlayer ? 14 : 0)
          if (score > threshold && rnd() < 0.65) {
            // break offending treaties first
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

    // 2. diplomacy: improve relations / treaties
    const candidates = [...neighbors].map(n => ({ id: n, threat: power(state.countries[n]) / Math.max(1, power(c)), rel: c.relations[n] ?? 0 }))
    if (candidates.length) {
      const biggest = candidates.sort((a, b) => b.threat - a.threat)[0]
      const big = state.countries[biggest.id]
      if (biggest.threat > 1.1 && (c.relations[biggest.id] ?? 0) > -30 && !atWarWith(state, c.id, biggest.id)) {
        if (rnd() < 0.5) {
          if (!hasTreaty(state, c.id, biggest.id, 'nap') && rnd() < 0.6) proposeTreaty(state, c.id, biggest.id, 'nap')
          else changeRel(state, c.id, biggest.id, 5)
          return
        }
      }
      // trade with strong merchant partners
      if (c.personality === 'merchant' || c.personality === 'diplomat') {
        const friendly = candidates.filter(x => x.rel > 15 && !atWarWith(state, c.id, x.id))
        if (friendly.length && rnd() < 0.5) {
          const t = pick(friendly)
          if (!hasTreaty(state, c.id, t.id, 'trade')) proposeTreaty(state, c.id, t.id, 'trade')
          else changeRel(state, c.id, t.id, 4)
          return
        }
      }
      // alliance against common threat
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
    // 3. small relation drift for AI-AI pairs that interacted
    if (rnd() < 0.3 && candidates.length) {
      const t = pick(candidates)
      changeRel(state, c.id, t.id, rnd() < 0.5 ? 2 : -2)
    }
  }
}

// ---------------- internal: rebellions ----------------
export function internalEvents(state: GameState): void {
  for (const c of Object.values(state.countries)) {
    if (!c.alive) continue
    const regions = regionsOf(state, c.id)
    if (regions.length >= 3 && c.stability < 15 && rnd() < 0.025) {
      const r = pick(regions)
      if (state.regionOwner[r] !== c.id) continue
      // rebel region becomes independent
      const newId = r + '_R'
      state.regionOwner[r] = newId
      const pop = (POP[r] || 0.5)
      state.countries[newId] = {
        id: newId,
        name: (MODERN[r]?.[state.lang] ?? r) + (state.lang === 'ru' ? ' (повстанцы)' : ' (rebels)'),
        color: PALETTE[hashCode(newId) % PALETTE.length],
        flag: '🏴', government: 'republic', personality: 'cautious', isPlayer: false, alive: true,
        population: pop * 0.8, industry: pop * 3, tech: c.tech * 0.9,
        treasury: 100, stability: 40, warSupport: 70,
        divisions: Math.max(1, Math.round(pop * 0.4)), navy: 0,
        taxRate: 0.2, investRate: 0.2, reputation: 50,
        relations: { [c.id]: -60 }, aiMemory: {}, lastAiActionMonth: state.month,
      }
      c.relations[newId] = -60
      c.stability = Math.min(100, c.stability + 8)
      ev(state, 'internal', 'ev_rebellion', { country: c.name, region: r, new: state.countries[newId].name }, true)
    }
    // famine/plague flavor
    if (rnd() < 0.002) {
      c.population *= 0.985
      c.stability = Math.max(0, c.stability - 6)
      ev(state, 'internal', 'ev_plague', { country: c.name })
    }
  }
}

// ---------------- month advance ----------------
export function advanceMonths(state: GameState, months: number): GameState {
  for (let i = 0; i < months; i++) {
    if (state.gameOver) break
    state.month++
    state.monthCount++
    updateEconomy(state)
    aiTurns(state)
    updateWars(state)
    internalEvents(state)
    // treaty expiry
    for (const t of state.treaties) {
      if (t.status === 'active' && t.expiresMonth && state.month >= t.expiresMonth) {
        t.status = 'expired'
        ev(state, 'diplomacy', 'ev_treaty_expired', { a: state.countries[t.parties[0]]?.name ?? '', b: state.countries[t.parties[1]]?.name ?? '', type: t.type })
      }
    }
    // player country alive check
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
