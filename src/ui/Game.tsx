import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameState, PlayerOrder, TreatyType } from '../sim/types'
import { monthName, fmtNum } from '../sim/types'
import { t } from '../i18n'
import MapView from './MapView'
import CountryPanel from './CountryPanel'
import { EventsPanel, TreatiesPanel, ActionsPanel, AdvisorPanel, TechPanel, NewspaperPanel } from './Panels'

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
  onDeclareWar: (target: string, playerControlled: boolean) => void
  onOfferPeace: (target: string) => void
  onBreakTreaty: (id: number) => void
  onSave: () => void
  onLoad: () => void
  onMenu: () => void
  onSettings: () => void
  onToggleTheme: () => void
  onToggleMute: () => void
  onTutNext: () => void
}

type Tab = 'events' | 'actions' | 'treaties' | 'advisor' | 'tech' | 'news'

const SPEEDS = [
  { label: 'x1', ms: 4000 },
  { label: 'x2', ms: 2000 },
  { label: 'x4', ms: 1000 },
]

export default function Game(props: Props) {
  const { state } = props
  const lang = state.lang
  const [tab, setTab] = useState<Tab>('actions')
  const [timeOpen, setTimeOpen] = useState(false)
  const [autoSpeed, setAutoSpeed] = useState(-1) // index into SPEEDS, -1 = off
  const autoRef = useRef(autoSpeed)
  autoRef.current = autoSpeed
  const p = state.countries[state.playerId]

  // auto-advance loop
  useEffect(() => {
    if (autoSpeed < 0 || state.gameOver || state.victory) { return }
    const id = setInterval(() => {
      if (autoRef.current >= 0 && !state.gameOver && !state.victory) props.onAdvance(1)
    }, SPEEDS[autoSpeed].ms)
    return () => clearInterval(id)
  }, [autoSpeed, state.gameOver, !!state.victory]) // eslint-disable-line react-hooks/exhaustive-deps

  const income = useMemo(() => {
    if (!p) return 0
    const gross = p.industry * p.taxRate
    const upkeep = p.divisions * (1.5 + p.tech * 0.35) + p.navy * 1.2 + p.population * 0.05
    return gross - upkeep - gross * p.investRate
  }, [p])

  if (!p) return null

  const tutKey = state.tutorialStep < 6 ? 'tut_' + (state.tutorialStep + 1) : null

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
          <span title={t(lang, 'factories_civ') + '/' + t(lang, 'factories_mil')}>🏭 {p.factoriesCiv} <em>/</em> ⚙️ {p.factoriesMil}</span>
          <span title={t(lang, 'tech')}>🔬 {p.tech.toFixed(1)}</span>
          <span title={t(lang, 'science_pts')}>🧪 {fmtNum(p.science)}</span>
          <span title={t(lang, 'prestige')}>⭐ {Math.round(p.prestige)}</span>
          <span title={t(lang, 'divisions')}>🪖 {p.divisions}</span>
          <span title={t(lang, 'stability')}>⚖️ {Math.round(p.stability)}</span>
        </div>
        <div className="tb-right">
          <div className={'advance-wrap' + (timeOpen ? ' open' : '')}>
            <button className="btn primary" onClick={() => setTimeOpen(o => !o)}>
              ⏳ {t(lang, 'advance')}{autoSpeed >= 0 ? ' ' + SPEEDS[autoSpeed].label : ''}
            </button>
            {timeOpen && (
              <div className="advance-menu">
                <button onClick={() => { setTimeOpen(false); setAutoSpeed(-1); props.onAdvance(0.25) }}>📆 {t(lang, 'week')}</button>
                <button onClick={() => { setTimeOpen(false); setAutoSpeed(-1); props.onAdvance(1) }}>{t(lang, 'month_1')}</button>
                <button onClick={() => { setTimeOpen(false); setAutoSpeed(-1); props.onAdvance(3) }}>{t(lang, 'month_3')}</button>
                <button onClick={() => { setTimeOpen(false); setAutoSpeed(-1); props.onAdvance(12) }}>{t(lang, 'month_12')}</button>
                <div className="auto-row">
                  <span>{t(lang, 'speed_auto')}:</span>
                  {SPEEDS.map((s, i) => (
                    <button key={s.label} className={autoSpeed === i ? 'active' : ''}
                      onClick={() => { setAutoSpeed(autoSpeed === i ? -1 : i); setTimeOpen(false) }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="btn ghost sm" title={t(lang, state.muted ? 'mute_off' : 'mute_on')} onClick={props.onToggleMute}>
            {state.muted ? '🔇' : '🔊'}
          </button>
          <button className="btn ghost sm" title={t(lang, state.theme === 'dark' ? 'theme_parchment' : 'theme_dark')} onClick={props.onToggleTheme}>
            {state.theme === 'dark' ? '📜' : '🌙'}
          </button>
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
          {(['actions', 'events', 'news', 'treaties', 'tech', 'advisor'] as Tab[]).map(tb => (
            <button key={tb} className={tab === tb ? 'active' : ''} onClick={() => setTab(tb)}>
              {tb === 'actions' ? '⚡' : tb === 'events' ? '📜' : tb === 'news' ? '🗞' : tb === 'treaties' ? '🤝' : tb === 'tech' ? '🔬' : '🧠'}
              {' '}{t(lang, tb === 'actions' ? 'actions' : tb === 'events' ? 'events' : tb === 'news' ? 'newspaper' : tb === 'treaties' ? 'treaties' : tb === 'tech' ? 'tech_tree' : 'advisor')}
            </button>
          ))}
        </div>
        <div className="tab-body">
          {tab === 'events' && <EventsPanel state={state} />}
          {tab === 'news' && <NewspaperPanel state={state} />}
          {tab === 'treaties' && <TreatiesPanel state={state} onBreak={props.onBreakTreaty} />}
          {tab === 'tech' && <TechPanel state={state} onOrder={props.onOrder} />}
          {tab === 'actions' && <ActionsPanel state={state} onOrder={props.onOrder} onSetRate={props.onSetRate} onDecree={props.onDecree} decreeBusy={props.decreeBusy} />}
          {tab === 'advisor' && <AdvisorPanel state={state} />}
        </div>
      </div>

      <div className="toasts">
        {props.toasts.map(x => <div key={x.id} className={'toast ' + x.kind}>{x.text}</div>)}
      </div>

      {tutKey && !state.gameOver && !state.victory && (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <b>🎓 {lang === 'ru' ? 'Обучение' : 'Tutorial'} {state.tutorialStep + 1}/6</b>
            <p>{t(lang, tutKey)}</p>
            <div className="tutorial-btns">
              <button className="btn primary sm" onClick={props.onTutNext}>
                {state.tutorialStep >= 5 ? t(lang, 'back') : t(lang, 'tut_next')}
              </button>
              <button className="btn ghost sm" onClick={() => { for (let i = 0; i < 6; i++) props.onTutNext() }}>
                {t(lang, 'tut_skip')}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.victory && (
        <div className="overlay">
          <div className="modal victory-modal">
            <h2>🏆 {t(lang, 'victory_title')}</h2>
            <p>{t(lang, 'victory_text', {
              who: state.countries[state.victory.winner]?.name ?? state.victory.winner,
              type: t(lang, 'victory_' + state.victory.type),
            })}</p>
            <button className="btn primary" onClick={props.onMenu}>{t(lang, 'to_menu')}</button>
          </div>
        </div>
      )}

      {state.gameOver && !state.victory && (
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
