import { useMemo, useState } from 'react'
import type { GameState, PlayerOrder, TechBranch } from '../sim/types'
import { monthName } from '../sim/types'
import { power, regionsOf, regionName } from '../sim/setup'
import { BRANCHES, BRANCH_INFO, MAX_TIER, researchCost, canResearch, branchName } from '../sim/tech'
import { t, TREATY_KEYS } from '../i18n'

// ---------------- Events ----------------
export function EventsPanel({ state }: { state: GameState }) {
  const lang = state.lang
  const year = Math.floor(state.month / 12)
  const events = useMemo(() => [...state.events].reverse().slice(0, 120), [state.events])
  return (
    <div className="panel events-panel">
      {events.map(e => {
        const params = { ...e.params }
        if (params.region) params.region = regionName(String(params.region), lang, year)
        return (
          <div key={e.id} className={'ev ev-' + e.kind + (e.major ? ' major' : '')}>
            <span className="ev-date">{monthName(e.month, lang)}</span>
            <span className="ev-text">{t(lang, e.key, params)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------- Newspaper (era-style clippings) ----------------
const NEWS_KIND_ICON: Record<string, string> = {
  war: '⚔️', diplomacy: '🕊️', economy: '📈', internal: '🏛️', world: '🌍', player: '⚡', tech: '🔬',
}

export function NewspaperPanel({ state }: { state: GameState }) {
  const lang = state.lang
  const year = Math.floor(state.month / 12)
  const items = useMemo(
    () => [...state.events].filter(e => e.major || e.kind === 'war' || e.kind === 'diplomacy' || e.kind === 'tech' || e.kind === 'internal').reverse().slice(0, 24),
    [state.events],
  )
  return (
    <div className="panel news-panel">
      <div className="news-masthead">
        <span className="news-rule" />
        <b>{t(lang, 'newspaper')} · {year}</b>
        <span className="news-rule" />
      </div>
      {items.length === 0 && <p className="hint">{t(lang, 'registry_empty')}</p>}
      <div className="news-grid">
        {items.map(e => {
          const params = { ...e.params }
          if (params.region) params.region = regionName(String(params.region), lang, year)
          return (
            <article key={e.id} className={'news-clip' + (e.major ? ' major' : '')}>
              <div className="news-date">{monthName(e.month, lang)}</div>
              <h4>{NEWS_KIND_ICON[e.kind] ?? '•'} {t(lang, e.key, params)}</h4>
              <div className="news-body">
                {lang === 'ru'
                  ? 'Собственный корреспондент сообщает подробности с места событий. Редакция продолжает следить за развитием ситуации.'
                  : 'Our own correspondent reports details from the scene. The editorial board continues to follow the developing situation.'}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Treaties registry ----------------
export function TreatiesPanel({ state, onBreak }: { state: GameState; onBreak: (id: number) => void }) {
  const lang = state.lang
  const [showAll, setShowAll] = useState(false)
  const list = state.treaties.filter(x => showAll || x.parties.includes(state.playerId)).slice().reverse()
  return (
    <div className="panel treaties-panel">
      <div className="tr-head">
        <b>📜 {t(lang, 'registry_title')}</b>
        <label className="tr-all"><input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
          {lang === 'ru' ? 'Весь мир' : 'Whole world'}</label>
      </div>
      {list.length === 0 && <p className="hint">{t(lang, 'registry_empty')}</p>}
      <table>
        <thead><tr>
          <th>{t(lang, 'party')}</th><th>{t(lang, 'type')}</th><th>{t(lang, 'signed')}</th><th>{t(lang, 'status')}</th><th></th>
        </tr></thead>
        <tbody>
          {list.map(x => {
            const mine = x.parties.includes(state.playerId)
            return (
              <tr key={x.id} className={'st-' + x.status}>
                <td>{state.countries[x.parties[0]]?.flag} {state.countries[x.parties[0]]?.name ?? x.parties[0]}
                  {' ↔ '}{state.countries[x.parties[1]]?.flag} {state.countries[x.parties[1]]?.name ?? x.parties[1]}</td>
                <td>{t(lang, TREATY_KEYS[x.type])}{x.note ? ` (${x.note})` : ''}</td>
                <td>{monthName(x.signedMonth, lang)}</td>
                <td>
                  {x.status === 'broken' && x.brokenBy
                    ? `${t(lang, 'broken')} (${state.countries[x.brokenBy]?.flag ?? ''})`
                    : t(lang, x.status)}
                </td>
                <td>
                  {x.status === 'active' && mine && x.type !== 'peace' && (
                    <button className="btn danger sm" title={t(lang, 'break_treaty_warn')} onClick={() => onBreak(x.id)}>
                      {t(lang, 'break_treaty')}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------- Tech tree ----------------
export function TechPanel({ state, onOrder }: { state: GameState; onOrder: (o: PlayerOrder) => void }) {
  const lang = state.lang
  const p = state.countries[state.playerId]
  const year = Math.floor(state.month / 12)
  if (!p) return null
  return (
    <div className="panel tech-panel">
      <div className="tech-head">
        <b>🔬 {t(lang, 'tech_tree')}</b>
        <span className="hint">{t(lang, 'tech')}: {p.tech.toFixed(1)} · {t(lang, 'science_pts')}: {Math.round(p.science)}</span>
      </div>
      <div className="tech-grid">
        {BRANCHES.map(b => {
          const tier = p.techTree[b] ?? 0
          const reason = canResearch(p, b, year)
          const c = researchCost(p, b)
          return (
            <div key={b} className={'tech-card' + (reason ? ' locked' : '')}>
              <div className="tech-card-head">
                <span className="tech-icon">{BRANCH_INFO[b].icon}</span>
                <b>{branchName(b, lang)}</b>
              </div>
              <div className="tech-pips">
                {Array.from({ length: MAX_TIER }, (_, i) => (
                  <span key={i} className={'pip' + (i < tier ? ' on' : '')} />
                ))}
              </div>
              <div className="tech-card-foot">
                {reason ? (
                  <span className="hint">{reason === 'era' ? '⏳ ' + t(lang, 'era_locked') : t(lang, 'max_tier')}</span>
                ) : (
                  <>
                    <span className="tech-cost">−{c}💰</span>
                    <button className="btn primary sm" disabled={p.treasury < c} onClick={() => onOrder({ type: 'research_branch', target: b })}>
                      {t(lang, 'research_b')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="hint">{t(lang, 'research_hint')}</p>
    </div>
  )
}

// ---------------- Actions ----------------
export function ActionsPanel({ state, onOrder, onSetRate, onDecree, decreeBusy }: {
  state: GameState
  onOrder: (o: PlayerOrder) => void
  onSetRate: (kind: 'tax' | 'invest', v: number) => void
  onDecree: (text: string) => void
  decreeBusy: boolean
}) {
  const lang = state.lang
  const p = state.countries[state.playerId]
  const [decree, setDecree] = useState('')
  if (!p) return null
  const civCost = Math.round(150 + p.factoriesCiv * 8)
  const milCost = Math.round(200 + p.factoriesMil * 10)
  return (
    <div className="panel actions-panel">
      <div className="act-grid">
        <button className="btn" onClick={() => onOrder({ type: 'invest' })} title={t(lang, 'invest_hint')}>
          🏭 {t(lang, 'invest')} <em>−{Math.round(p.treasury * 0.15)}💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'build_civ' })}>
          🧱 {t(lang, 'build_civ')} <em>−{civCost}💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'build_mil' })}>
          ⚙️ {t(lang, 'build_mil')} <em>−{milCost}💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'research' })} title={t(lang, 'research_hint')}>
          🔬 {t(lang, 'research')} <em>−{Math.round(120 * p.tech)}💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'propaganda' })} title={t(lang, 'propaganda_hint')}>
          📣 {t(lang, 'propaganda')} <em>−80💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'army', amount: 5 })}>
          🪖 {t(lang, 'army_up')} <em>−90💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'navy', amount: 2 })}>
          ⚓ {t(lang, 'navy_up')} <em>−180💰</em>
        </button>
        <button className="btn" onClick={() => onOrder({ type: 'stabilize' })} title={t(lang, 'stabilize_hint')}>
          ⚖️ {t(lang, 'stabilize')} <em>−100💰</em>
        </button>
      </div>
      <div className="res-row" title={t(lang, 'resources')}>
        <span>🌾 {Math.round(p.stockpile.grain)}</span>
        <span>🛢 {Math.round(p.stockpile.oil)}</span>
        <span>⛓ {Math.round(p.stockpile.steel)}</span>
        <span>💎 {Math.round(p.stockpile.rare)}</span>
        <span title={t(lang, 'equipment')}>🔧 {Math.round(p.equipment)}</span>
      </div>
      <div className="sliders">
        <label>{t(lang, 'tax_rate')}: <b>{Math.round(p.taxRate * 100)}%</b>
          <input type="range" min={10} max={50} value={p.taxRate * 100} onChange={e => onSetRate('tax', Number(e.target.value) / 100)} />
        </label>
        <label>{t(lang, 'invest_rate')}: <b>{Math.round(p.investRate * 100)}%</b>
          <input type="range" min={0} max={60} value={p.investRate * 100} onChange={e => onSetRate('invest', Number(e.target.value) / 100)} />
        </label>
      </div>
      <div className="decree-box">
        <label>⚡ {t(lang, 'decree')}</label>
        <textarea
          placeholder={t(lang, 'decree_hint')}
          value={decree}
          onChange={e => setDecree(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (decree.trim()) { onDecree(decree.trim()); setDecree('') } } }}
        />
        <button className="btn primary" disabled={decreeBusy || !decree.trim()} onClick={() => { onDecree(decree.trim()); setDecree('') }}>
          {decreeBusy ? '...' : t(lang, 'decree_go')}
        </button>
      </div>
    </div>
  )
}

// ---------------- Advisor ----------------
export function AdvisorPanel({ state }: { state: GameState }) {
  const lang = state.lang
  const p = state.countries[state.playerId]
  const advice = useMemo(() => {
    if (!p) return { threats: [], opps: [], econ: [], diplo: [] } as {
      threats: { id: string; name: string; ratio: string; rel: number }[]
      opps: { id: string; name: string; ratio: string; rel: number }[]
      econ: string[]
      diplo: string[]
    }
    const myPower = power(p)
    const others = Object.values(state.countries).filter(c => c.alive && !c.isPlayer)
    const threats = others
      .map(c => ({ c, ratio: power(c) / Math.max(1, myPower), rel: p.relations[c.id] ?? 0 }))
      .filter(x => x.ratio > 0.9 && x.rel < 10)
      .sort((a, b) => b.ratio * (b.rel < 0 ? 1.5 : 1) - a.ratio * (a.rel < 0 ? 1.5 : 1))
      .slice(0, 4)
      .map(x => ({ id: x.c.id, name: x.c.flag + ' ' + x.c.name, ratio: x.ratio.toFixed(1), rel: x.rel }))
    const opps = others
      .map(c => ({ c, ratio: myPower / Math.max(1, power(c)), rel: p.relations[c.id] ?? 0 }))
      .filter(x => x.ratio > 2.2)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 4)
      .map(x => ({ id: x.c.id, name: x.c.flag + ' ' + x.c.name, ratio: x.ratio.toFixed(1), rel: x.rel }))
    const income = p.industry * p.taxRate
    const upkeep = p.divisions * (1.5 + p.tech * 0.35) + p.navy * 1.2 + p.population * 0.05
    const econ: string[] = []
    if (income < upkeep) econ.push('adv_econ_deficit')
    else econ.push('adv_econ_surplus')
    if (p.stability < 30) econ.push('adv_low_stab')
    if (p.stockpile.grain <= 5) econ.push('adv_grain_low')
    const diplo: string[] = []
    const worst = threats[0]
    if (worst) diplo.push('adv_treaty_suggest')
    return { threats, opps, econ, diplo, worst, surplus: Math.round(income - upkeep) } as never
  }, [state, p]) as {
    threats: { id: string; name: string; ratio: string; rel: number }[]
    opps: { id: string; name: string; ratio: string; rel: number }[]
    econ: string[]
    diplo: string[]
    worst?: { name: string }
    surplus?: number
  }

  return (
    <div className="panel advisor-panel">
      <div className="adv-col">
        <h4>⚠️ {t(lang, 'adv_threats')}</h4>
        {advice.threats.length === 0 && <p className="hint">{t(lang, 'adv_no_threats')}</p>}
        {advice.threats.map(x => (
          <div key={x.id} className="adv-line">🗡 {t(lang, 'adv_threat_line', { name: x.name, ratio: x.ratio, rel: x.rel })}</div>
        ))}
      </div>
      <div className="adv-col">
        <h4>💡 {t(lang, 'adv_opportunities')}</h4>
        {advice.opps.length === 0 && <p className="hint">{t(lang, 'adv_no_opps')}</p>}
        {advice.opps.map(x => (
          <div key={x.id} className="adv-line">🎯 {t(lang, 'adv_opp_line', { name: x.name, ratio: x.ratio, rel: x.rel })}</div>
        ))}
      </div>
      <div className="adv-col">
        <h4>🏦 {t(lang, 'adv_economy')}</h4>
        {advice.econ.map(k => (
          <div key={k} className="adv-line">{k === 'adv_econ_deficit' ? '📉 ' : k === 'adv_econ_surplus' ? '📈 ' : k === 'adv_grain_low' ? '🌾 ' : '🚨 '}
            {t(lang, k, { n: Math.max(0, advice.surplus ?? 0) })}</div>
        ))}
        <h4>🤝 {t(lang, 'adv_diplo')}</h4>
        {advice.diplo.length === 0 && <p className="hint">—</p>}
        {advice.diplo.map((k, i) => (
          <div key={i} className="adv-line">💬 {t(lang, k, { name: (advice as never as { worst?: { name: string } }).worst?.name ?? '—' })}</div>
        ))}
      </div>
    </div>
  )
}

export type { TechBranch }
