import type { GameState, Country, Ideology } from '../sim/types'

export interface HistApi {
  ev: (kind: 'war' | 'diplomacy' | 'economy' | 'internal' | 'world', key: string, params: Record<string, string | number>, major?: boolean) => void
  find: (...ids: string[]) => Country | null
  setIdeology: (c: Country, ideo: Ideology) => void
  // scripted AI-vs-AI war (skipped if either side is the player or already at war)
  war: (attacker: Country, defender: Country) => boolean
  rel: (a: Country, b: Country, d: number) => void
  allAlive: (fn: (c: Country) => void) => void
  setCycle: (c: GameState['econCycle']) => void
}

export interface HistoricalEvent {
  id: string
  year: number
  month?: number  // 0-11
  key: string
  major?: boolean
  needs?: string[][]  // for each group at least one must be alive
  fx?: (s: GameState, api: HistApi) => void
}

const any = undefined // no preconditions

export const HISTORICAL: HistoricalEvent[] = [
  {
    id: 'trajan', year: 117, key: 'he_trajan', major: true, needs: [['ROM']],
    fx: (s, a) => { const rom = a.find('ROM'); if (rom) { rom.prestige = Math.min(100, rom.prestige + 10); rom.warSupport += 10 } },
  },
  { id: 'milan', year: 313, key: 'he_milan', needs: [['ROM']] },
  {
    id: 'fall_rome', year: 476, key: 'he_fall_rome', major: true, needs: [['ROM']],
    fx: (s, a) => { const rom = a.find('ROM'); if (rom) { rom.stability = Math.max(0, rom.stability - 30); rom.industry *= 0.8; rom.prestige = Math.max(0, rom.prestige - 25) } },
  },
  { id: 'islam', year: 622, key: 'he_islam', major: true, needs: any },
  { id: 'vikings', year: 793, key: 'he_vikings' },
  { id: 'charlemagne', year: 800, key: 'he_charlemagne', needs: [['FRA', 'FRK']] },
  { id: 'schism', year: 1054, key: 'he_schism' },
  { id: 'crusades', year: 1096, key: 'he_crusades', major: true },
  {
    id: 'mongols', year: 1206, key: 'he_mongols', major: true, needs: [['KHL', 'MNG', 'CHN']],
    fx: (s, a) => { const m = a.find('KHL', 'MNG'); if (m) { m.warSupport = Math.min(100, m.warSupport + 25); m.prestige += 10 } },
  },
  { id: 'magna_carta', year: 1215, key: 'he_magna_carta', needs: [['GBR', 'GBR_B', 'ENG']] },
  {
    id: 'black_death', year: 1347, key: 'he_black_death', major: true,
    fx: (s, a) => { a.allAlive(c => { c.population *= 0.75; c.stability = Math.max(0, c.stability - 10); c.industry *= 0.85 }) },
  },
  {
    id: 'constantinople', year: 1453, key: 'he_constantinople', major: true,
    fx: (s, a) => {
      const ott = a.find('OTT', 'TUR')
      const byz = a.find('BYZ')
      if (ott) ott.prestige = Math.min(100, ott.prestige + 15)
      if (ott && byz && !ott.isPlayer && !byz.isPlayer) a.war(ott, byz)
    },
  },
  {
    id: 'columbus', year: 1492, key: 'he_columbus', major: true,
    fx: (s, a) => { for (const id of ['ESP', 'SPA_B', 'PRT', 'GBR', 'GBR_B']) { const c = a.find(id); if (c) { c.prestige = Math.min(100, c.prestige + 8); c.science += 15 } } },
  },
  {
    id: 'reformation', year: 1517, key: 'he_reformation', major: true,
    fx: (s, a) => { a.allAlive(c => { if (c.ideology === 'theocracy' || c.ideology === 'monarchism') c.stability = Math.max(0, c.stability - 8) }) },
  },
  { id: 'armada', year: 1588, key: 'he_armada', needs: [['GBR', 'GBR_B'], ['ESP', 'SPA_B']] },
  {
    id: 'thirty_years', year: 1618, key: 'he_thirty_years', major: true, needs: [['HRE', 'DEU', 'GER_B', 'GER']],
    fx: (s, a) => { const hre = a.find('HRE', 'DEU', 'GER_B', 'GER'); if (hre) { hre.stability = Math.max(0, hre.stability - 15); hre.divisions = Math.round(hre.divisions * 0.8) } },
  },
  {
    id: 'westphalia', year: 1648, key: 'he_westphalia', major: true,
    fx: (s, a) => { a.allAlive(c => { c.reputation = Math.min(100, c.reputation + 5) }) },
  },
  { id: 'glorious', year: 1688, key: 'he_glorious', needs: [['GBR', 'GBR_B']], fx: (s, a) => { const c = a.find('GBR', 'GBR_B'); if (c) c.stability = Math.min(100, c.stability + 10) } },
  {
    id: 'seven_years', year: 1756, key: 'he_seven_years', major: true, needs: [['GBR', 'GBR_B'], ['FRA', 'FRA_B']],
    fx: (s, a) => { const gbr = a.find('GBR', 'GBR_B'); const fra = a.find('FRA', 'FRA_B'); if (gbr && fra) a.war(gbr, fra) },
  },
  { id: 'usa_indep', year: 1776, key: 'he_usa_indep', major: true, needs: [['GBR', 'GBR_B']], fx: (s, a) => { const g = a.find('GBR', 'GBR_B'); if (g) g.stability = Math.max(0, g.stability - 6) } },
  {
    id: 'french_rev', year: 1789, key: 'he_french_rev', major: true, needs: [['FRA', 'FRA_B']],
    fx: (s, a) => { const f = a.find('FRA', 'FRA_B'); if (f && !f.isPlayer) { a.setIdeology(f, 'democracy'); f.warSupport = Math.min(100, f.warSupport + 20); f.stability = Math.min(100, f.stability + 5) } },
  },
  {
    id: 'napoleon', year: 1805, key: 'he_napoleon', major: true, needs: [['FRA', 'FRA_B']],
    fx: (s, a) => {
      const f = a.find('FRA', 'FRA_B')
      if (!f || f.isPlayer) return
      const foes = [a.find('HAB', 'AUT', 'AUH'), a.find('RUS_B', 'RUS'), a.find('GBR_B', 'GBR')].filter(Boolean) as Country[]
      if (foes[0]) a.war(f, foes[0])
      if (f) f.prestige = Math.min(100, f.prestige + 12)
    },
  },
  {
    id: 'vienna', year: 1815, key: 'he_vienna', major: true,
    fx: (s, a) => { a.allAlive(c => { c.stability = Math.min(100, c.stability + 5) }) },
  },
  {
    id: 'springtime', year: 1848, key: 'he_springtime', major: true,
    fx: (s, a) => { a.allAlive(c => { if (c.ideology === 'monarchism') c.stability = Math.max(0, c.stability - 12) }) },
  },
  {
    id: 'crimean', year: 1853, key: 'he_crimean', major: true, needs: [['RUS_B', 'RUS'], ['OTT', 'TUR']],
    fx: (s, a) => { const r = a.find('RUS_B', 'RUS'); const o = a.find('OTT', 'TUR'); if (r && o) a.war(r, o) },
  },
  {
    id: 'us_civil', year: 1861, key: 'he_us_civil', major: true, needs: [['USA', 'USA_B']],
    fx: (s, a) => { const u = a.find('USA', 'USA_B'); if (u) { u.stability = Math.max(0, u.stability - 20); u.divisions = Math.round(u.divisions * 0.7); u.industry *= 0.92 } },
  },
  {
    id: 'meiji', year: 1868, key: 'he_meiji', major: true, needs: [['JPN', 'JPN_B']],
    fx: (s, a) => { const j = a.find('JPN', 'JPN_B'); if (j) { j.tech = Math.min(12, j.tech + 1.5); j.industry *= 1.25; j.prestige += 10 } },
  },
  {
    id: 'franco_prussian', year: 1870, key: 'he_franco_prussian', major: true, needs: [['DEU', 'GER_B', 'GER', 'PRU'], ['FRA', 'FRA_B']],
    fx: (s, a) => { const g = a.find('DEU', 'GER_B', 'GER', 'PRU'); const f = a.find('FRA', 'FRA_B'); if (g && f) a.war(g, f) },
  },
  { id: 'german_unif', year: 1871, key: 'he_german_unif', major: true, needs: [['DEU', 'GER_B', 'GER']], fx: (s, a) => { const g = a.find('DEU', 'GER_B', 'GER'); if (g) g.prestige = Math.min(100, g.prestige + 15) } },
  { id: 'scramble', year: 1884, key: 'he_scramble', major: true },
  { id: 'flight', year: 1903, key: 'he_flight' },
  {
    id: 'rusjap', year: 1905, key: 'he_rusjap', major: true, needs: [['RUS_B', 'RUS'], ['JPN_B', 'JPN']],
    fx: (s, a) => { const r = a.find('RUS_B', 'RUS'); const j = a.find('JPN_B', 'JPN'); if (r && j) { a.war(j, r); r.stability = Math.max(0, r.stability - 10) } },
  },
  {
    id: 'ww1', year: 1914, month: 7, key: 'he_ww1', major: true, needs: [['GER_B', 'GER', 'DEU'], ['FRA_B', 'FRA']],
    fx: (s, a) => {
      const g = a.find('GER_B', 'GER', 'DEU'); const f = a.find('FRA_B', 'FRA'); const r = a.find('RUS_B', 'RUS')
      if (g && f && a.war(g, f) && r) a.war(g, r)
      a.setCycle('recession')
    },
  },
  {
    id: 'rus_rev', year: 1917, month: 9, key: 'he_rus_rev', major: true, needs: [['RUS_B', 'RUS', 'SOV']],
    fx: (s, a) => { const r = a.find('RUS_B', 'RUS', 'SOV'); if (r && !r.isPlayer) { a.setIdeology(r, 'communism'); r.stability = Math.max(0, r.stability - 12); r.warSupport = Math.max(0, r.warSupport - 25) } },
  },
  {
    id: 'spanish_flu', year: 1918, key: 'he_spanish_flu', major: true,
    fx: (s, a) => { a.allAlive(c => { c.population *= 0.97; c.stability = Math.max(0, c.stability - 4) }) },
  },
  { id: 'versailles', year: 1919, key: 'he_versailles', major: true },
  {
    id: 'depression', year: 1929, month: 9, key: 'he_depression', major: true,
    fx: (s, a) => { a.allAlive(c => { c.industry *= 0.8; c.treasury *= 0.6; c.stability = Math.max(0, c.stability - 8) }); a.setCycle('recession') },
  },
  {
    id: 'hitler', year: 1933, key: 'he_hitler', major: true, needs: [['GER_B', 'GER', 'DEU']],
    fx: (s, a) => { const g = a.find('GER_B', 'GER', 'DEU'); if (g && !g.isPlayer) { a.setIdeology(g, 'fascism'); g.warSupport = Math.min(100, g.warSupport + 15) } },
  },
  {
    id: 'ww2', year: 1939, month: 8, key: 'he_ww2', major: true, needs: [['GER_B', 'GER', 'DEU'], ['FRA_B', 'FRA']],
    fx: (s, a) => {
      const g = a.find('GER_B', 'GER', 'DEU'); const f = a.find('FRA_B', 'FRA'); const p = a.find('POL')
      if (g && p) a.war(g, p)
      if (g && f) a.war(g, f)
    },
  },
  {
    id: 'barbarossa', year: 1941, month: 5, key: 'he_barbarossa', major: true, needs: [['GER_B', 'GER', 'DEU'], ['SOV', 'RUS', 'RUS_B']],
    fx: (s, a) => { const g = a.find('GER_B', 'GER', 'DEU'); const r = a.find('SOV', 'RUS', 'RUS_B'); if (g && r) a.war(g, r) },
  },
  {
    id: 'pearl_harbor', year: 1941, month: 11, key: 'he_pearl_harbor', major: true, needs: [['JPN_B', 'JPN'], ['USA_B', 'USA']],
    fx: (s, a) => { const j = a.find('JPN_B', 'JPN'); const u = a.find('USA_B', 'USA'); if (j && u) a.war(j, u) },
  },
  { id: 'nuclear_age', year: 1945, month: 7, key: 'he_nuclear_age', major: true },
  {
    id: 'un_founded', year: 1945, month: 9, key: 'he_un_founded', major: true,
    fx: (s, a) => { a.allAlive(c => { c.reputation = Math.min(100, c.reputation + 4) }) },
  },
  {
    id: 'cold_war', year: 1947, key: 'he_cold_war', major: true, needs: [['USA_B', 'USA'], ['SOV']],
    fx: (s, a) => { const u = a.find('USA_B', 'USA'); const r = a.find('SOV', 'RUS_B'); if (u && r) a.rel(u, r, -60) },
  },
  {
    id: 'nato', year: 1949, key: 'he_nato', major: true, needs: [['USA_B', 'USA']],
    fx: (s, a) => {
      const u = a.find('USA_B', 'USA')
      if (!u) return
      for (const id of ['GBR_B', 'GBR', 'FRA_B', 'FRA', 'CAN', 'ITA_B', 'ITA']) { const c = a.find(id); if (c && !c.isPlayer && !u.isPlayer) s.treaties.push({ id: s.nextId++, type: 'alliance', parties: [u.id, c.id], signedMonth: s.month, status: 'active' }) }
    },
  },
  { id: 'korean_war', year: 1950, key: 'he_korean_war', major: true },
  {
    id: 'warsaw_pact', year: 1955, key: 'he_warsaw_pact', major: true, needs: [['SOV', 'RUS_B']],
    fx: (s, a) => {
      const r = a.find('SOV', 'RUS_B')
      if (!r) return
      for (const id of ['POL', 'DDR', 'HUN', 'CZE', 'CSK', 'ROU', 'BGR']) { const c = a.find(id); if (c && !c.isPlayer && !r.isPlayer) s.treaties.push({ id: s.nextId++, type: 'alliance', parties: [r.id, c.id], signedMonth: s.month, status: 'active' }) }
    },
  },
  { id: 'sputnik', year: 1957, key: 'he_sputnik', major: true, needs: [['SOV', 'RUS', 'RUS_B']], fx: (s, a) => { const r = a.find('SOV', 'RUS', 'RUS_B'); if (r) { r.science += 40; r.prestige = Math.min(100, r.prestige + 10) } } },
  {
    id: 'cuban_crisis', year: 1962, month: 9, key: 'he_cuban_crisis', major: true, needs: [['USA_B', 'USA'], ['SOV', 'RUS', 'RUS_B']],
    fx: (s, a) => { const u = a.find('USA_B', 'USA'); const r = a.find('SOV', 'RUS', 'RUS_B'); if (u) u.warSupport += 10; if (r) r.warSupport += 10 },
  },
  { id: 'moon', year: 1969, key: 'he_moon', major: true, needs: [['USA_B', 'USA']], fx: (s, a) => { const u = a.find('USA_B', 'USA'); if (u) u.prestige = Math.min(100, u.prestige + 12) } },
  {
    id: 'oil_crisis', year: 1973, key: 'he_oil_crisis', major: true,
    fx: (s, a) => { a.allAlive(c => { c.industry *= 0.93; c.treasury *= 0.85 }); a.setCycle('recession') },
  },
  {
    id: 'iranian_rev', year: 1979, key: 'he_iranian_rev', major: true, needs: [['PER', 'IRN']],
    fx: (s, a) => { const p = a.find('PER', 'IRN'); if (p && !p.isPlayer) { a.setIdeology(p, 'theocracy'); p.warSupport += 15 } },
  },
  { id: 'chernobyl', year: 1986, key: 'he_chernobyl', major: true, needs: [['SOV', 'RUS', 'RUS_B', 'UKR']], fx: (s, a) => { const r = a.find('SOV', 'RUS', 'RUS_B'); if (r) { r.stability = Math.max(0, r.stability - 8); r.reputation = Math.max(0, r.reputation - 5) } } },
  { id: 'berlin_wall', year: 1989, month: 10, key: 'he_berlin_wall', major: true, needs: [['DEU', 'GER', 'DDR', 'GER_B']] },
  {
    id: 'ussr_collapse', year: 1991, month: 11, key: 'he_ussr_collapse', major: true, needs: [['SOV', 'RUS_B']],
    fx: (s, a) => { const r = a.find('SOV', 'RUS_B'); if (r && !r.isPlayer) { a.setIdeology(r, 'democracy'); r.industry *= 0.75; r.stability = Math.max(0, r.stability - 15); r.prestige = Math.max(0, r.prestige - 20) } },
  },
  {
    id: 'internet', year: 1995, key: 'he_internet', major: true,
    fx: (s, a) => { a.allAlive(c => { c.science += 15 }) },
  },
  {
    id: 'nine_eleven', year: 2001, month: 8, key: 'he_nine_eleven', major: true, needs: [['USA', 'USA_B']],
    fx: (s, a) => { const u = a.find('USA', 'USA_B'); if (u) { u.stability = Math.max(0, u.stability - 8); u.warSupport = Math.min(100, u.warSupport + 15) } },
  },
  {
    id: 'fin_crisis', year: 2008, month: 8, key: 'he_fin_crisis', major: true,
    fx: (s, a) => { a.allAlive(c => { c.treasury *= 0.7; c.industry *= 0.95; c.debt += c.industry * 2 }); a.setCycle('recession') },
  },
  {
    id: 'arab_spring', year: 2011, key: 'he_arab_spring', major: true,
    fx: (s, a) => { a.allAlive(c => { if (c.ideology === 'theocracy' || c.government === 'junta') c.stability = Math.max(0, c.stability - 10) }) },
  },
  { id: 'digital', year: 2015, key: 'he_digital', fx: (s, a) => { a.allAlive(c => { c.science += 10 }) } },
  {
    id: 'pandemic', year: 2020, month: 2, key: 'he_pandemic', major: true,
    fx: (s, a) => { a.allAlive(c => { c.population *= 0.99; c.industry *= 0.95; c.stability = Math.max(0, c.stability - 5) }) },
  },
]
