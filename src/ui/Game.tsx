import { useMemo, useState } from 'react'
import type { GameState, PlayerOrder, TreatyType } from '../sim/types'
import { monthName, fmtNum } from '../sim/types'
import { t } from '../i18n'
import MapView from './MapView'
import CountryPanel from './CountryPanel'
import { EventsPanel, TreatiesPanel, ActionsPanel, AdvisorPanel } from './Panels'

export interface Toast { id: number; text: string; kind: 'ok' | 'bad' | 'info' }

interface Props {
  state: GameState
  toasts: Toast[]
  selected: string | null
  setSelected: (id: string | null) => void
  onAdvance: (months: number) => void
  onOrder: (o: PlayerOrder) => void
  onSetRate: (kind: 'tax' | 'invest', v: number) => void
  onDecree: (text: string) => void
  decreeBusy: boolean
  onImprove: (target: string) => void
  onPropose: (target: string, type: TreatyType) => void
  onDeclareWar: (target: string) => void
  onOfferPeace: (target: string) => void
  onBreakTreaty: (id: number) => void
  onSave: () => void
  onLoad: () => void
  onMenu: () => void
  onSettings: () => void
}

type Tab = 'events' | 'actions' | 'treaties' | 'advisor'

export default function Game(props: Props) {
  const { state } = props
  const lang = state.lang
  const [tab, setTab] = useState<Tab>('actions')
  const [advOpen, setAdvOpen] = useState(false)
  const p = state.countries[state.playerId]

  const income = useMemo(() => {
    if (!p) return 0
    return p.industry * p.taxRate - (p.divisions * (1.5 + p.tech * 0.35) + p.navy * 1.2 + p.population * 0.05)
  }, [p])

  if (!p) return null

  return (
    <div className="game-screen">
      <div className="topbar">
        <div className="tb-left">
          <button className="btn ghost sm" onClick={props.onMenu}>☰</button>
          <span className="tb-flag">{p.flag}</span>
          <span className="tb-name">{p.name}</span>
          <span className="tb-date">📅 {monthName(state.month, lang)}</span>
        </div>
        <div className="tb-stats">
          <span title={t(lang, 'treasury')}>💰 {fmtNum(p.treasury)} <em className={income >= 0 ? 'pos' : 'neg'}>({income >= 0 ? '+' : ''}{Math.round(income)}/м)</em></span>
          <span title={t(lang, 'industry')}>🏭 {fmtNum(p.industry)}</span>
          <span title={t(lang, 'tech')}>🔬 {p.tech.toFixed(1)}</span>
          <span title={t(lang, 'divisions')}>🪖 {p.divisions}</span>
          <span title={t(lang, 'stability')}>⚖️ {Math.round(p.stability)}</span>
          <span title={t(lang, 'war_support')}>🔥 {Math.round(p.warSupport)}</span>
        </div>
        <div className="tb-right">
          <div className={'advance-wrap' + (advOpen ? ' open' : '')}>
            <button className="btn primary" onClick={() => setAdvOpen(o => !o)}>▶ {t(lang, 'advance')}</button>
            {advOpen && (
              <div className="advance-menu">
                {[1, 3, 6, 12].map(m => (
                  <button key={m} onClick={() => { setAdvOpen(false); props.onAdvance(m) }}>
                    {t(lang, m === 1 ? 'month_1' : m === 3 ? 'month_3' : m === 6 ? 'month_6' : 'month_12')}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn ghost sm" title={t(lang, 'save')} onClick={props.onSave}>💾</button>
          <button className="btn ghost sm" title={t(lang, 'load')} onClick={props.onLoad}>📂</button>
          <button className="btn ghost sm" title={t(lang, 'settings')} onClick={props.onSettings}>⚙️</button>
        </div>
      </div>

      <div className="main-row">
        <MapView state={state} selected={props.selected} onSelect={(cid) => props.setSelected(cid)} className="game-map" />
        <CountryPanel
          state={state}
          countryId={props.selected}
          onClose={() => props.setSelected(null)}
          onImprove={props.onImprove}
          onPropose={props.onPropose}
          onDeclareWar={props.onDeclareWar}
          onOfferPeace={props.onOfferPeace}
        />
      </div>

      <div className="bottom-bar">
        <div className="tabs">
          {(['actions', 'events', 'treaties', 'advisor'] as Tab[]).map(tb => (
            <button key={tb} className={tab === tb ? 'active' : ''} onClick={() => setTab(tb)}>
              {tb === 'actions' ? '⚡ ' : tb === 'events' ? '📜 ' : tb === 'treaties' ? '🤝 ' : '🧠 '}
              {t(lang, tb === 'actions' ? 'actions' : tb === 'events' ? 'events' : tb === 'treaties' ? 'treaties' : 'advisor')}
            </button>
          ))}
        </div>
        <div className="tab-body">
          {tab === 'events' && <EventsPanel state={state} />}
          {tab === 'treaties' && <TreatiesPanel state={state} onBreak={props.onBreakTreaty} />}
          {tab === 'actions' && <ActionsPanel state={state} onOrder={props.onOrder} onSetRate={props.onSetRate} onDecree={props.onDecree} decreeBusy={props.decreeBusy} />}
          {tab === 'advisor' && <AdvisorPanel state={state} />}
        </div>
      </div>

      <div className="toasts">
        {props.toasts.map(x => <div key={x.id} className={'toast ' + x.kind}>{x.text}</div>)}
      </div>

      {state.gameOver && (
        <div className="overlay">
          <div className="modal">
            <h2>💀 {t(lang, 'game_over')}</h2>
            <p>{t(lang, 'game_over_text')}</p>
            <button className="btn primary" onClick={props.onMenu}>{t(lang, 'to_menu')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
