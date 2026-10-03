import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState, Lang, PlayerOrder, TreatyType } from './sim/types'
import { createGame } from './sim/setup'
import { advanceMonths, applyOrder, proposeTreaty, breakTreaty, declareWar, changeRel, ev, imposeSanctions, liftSanctions } from './sim/engine'
import { sendChat } from './sim/chat'
import { parseDecree } from './sim/parser'
import { llmDecree, loadAiSettings, saveAiSettings, type AiSettings } from './llm'
import { sfx, setMuted } from './sound'
import { t } from './i18n'
import Setup from './ui/Setup'
import ScenarioEditor, { type Scenario } from './ui/ScenarioEditor'
import Game, { type Toast } from './ui/Game'

const LS_LANG = 'paxmundi_lang'
const LS_AUTO = 'paxmundi_save_auto'
const LS_MANUAL = 'paxmundi_save_manual'

function saveState(state: GameState, key: string): void {
  try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* quota */ }
}
function loadState(key: string): GameState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    // migrate older saves to v2/stage-B fields
    for (const c of Object.values(s.countries ?? {})) {
      c.nukeProgress ??= 0
      c.nukes ??= 0
      c.techTree ??= { inf: 0, arm: 0, air: 0, nav: 0, ind: 0, sci: 0 }
      c.resources ??= { grain: 0, oil: 0, steel: 0, rare: 0 }
      c.stockpile ??= { grain: 5, oil: 1, steel: 5, rare: 0 }
      c.factoriesCiv ??= 1
      c.factoriesMil ??= 0
      c.equipment ??= 0
      c.science ??= 0
      c.prestige ??= 20
      c.ideology ??= 'monarchism'
    }
    s.achievements ??= []
    s.history ??= []
    s.tutorialStep ??= 6
    s.theme ??= 'dark'
    s.victoryEnabled ??= false
    return s
  } catch { return null }
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LS_LANG) as Lang) || 'ru')
  const [screen, setScreen] = useState<'menu' | 'setup' | 'game' | 'editor'>('menu')
  const [state, setState] = useState<GameState | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [decreeBusy, setDecreeBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [aiCfg, setAiCfg] = useState<AiSettings>(() => loadAiSettings())
  const toastId = useRef(1)

  useEffect(() => {
    document.body.classList.toggle('parchment', state?.theme === 'parchment')
  }, [state?.theme])

  const setLang = (l: Lang) => { localStorage.setItem(LS_LANG, l); setLangState(l) }

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = toastId.current++
    setToasts(ts => [...ts.slice(-3), { id, text, kind }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3500)
  }, [])

  const mutate = useCallback((fn: (s: GameState) => void) => {
    setState(prev => {
      if (!prev) return prev
      const next: GameState = JSON.parse(JSON.stringify(prev))
      fn(next)
      return next
    })
  }, [])

  const startGame = (opts: { year: number; playerId: string; difficulty: number; lang: Lang; victoryEnabled: boolean }) => {
    const g = createGame(opts)
    setState(g)
    setSelected(opts.playerId)
    setScreen('game')
    sfx.ok()
  }

  const advance = (months: number) => {
    sfx.turn()
    mutate(s => {
      advanceMonths(s, months)
      saveState(s, LS_AUTO)
    })
  }

  // decrees & orders apply IMMEDIATELY — no queue
  const order = (o: PlayerOrder) => mutate(s => {
    const ok = applyOrder(s, o)
    if (ok) sfx.click()
  })

  const setRate = (kind: 'tax' | 'invest', v: number) => mutate(s => {
    const p = s.countries[s.playerId]
    if (!p) return
    if (kind === 'tax') p.taxRate = v
    else p.investRate = v
  })

  const decree = async (text: string) => {
    if (!state) return
    const cfg = loadAiSettings()
    if (cfg.key) {
      setDecreeBusy(true)
      const res = await llmDecree(state, text)
      setDecreeBusy(false)
      if (res) {
        mutate(s => {
          for (const o of res.orders) applyOrder(s, o, true)
          if (res.narrative) {
            s.lastNarrative = res.narrative
            ev(s, 'player', 'ev_decree_narrative', { text: res.narrative })
          }
        })
        toast(t(state.lang, 'decree_parsed', { n: res.orders.length }), 'ok')
        sfx.ok()
        return
      }
    }
    const p = state.countries[state.playerId]
    const orders = parseDecree(text, p?.treasury ?? 0)
    if (orders.length === 0) { toast(t(state.lang, 'decree_empty'), 'bad'); sfx.bad(); return }
    mutate(s => { for (const o of orders) applyOrder(s, o, true) })
    toast(t(state.lang, 'decree_parsed', { n: orders.length }), 'ok')
    sfx.ok()
  }

  const improve = (target: string) => mutate(s => {
    const p = s.countries[s.playerId]
    if (!p || p.treasury < 50) return
    p.treasury -= 50
    changeRel(s, s.playerId, target, 8)
    ev(s, 'diplomacy', 'ev_relations_improved', { a: p.name, b: s.countries[target]?.name ?? '' })
    sfx.click()
  })

  const propose = (target: string, type: TreatyType) => mutate(s => {
    const res = proposeTreaty(s, s.playerId, target, type)
    toast(t(s.lang, res.accepted ? 'accepted' : res.reasonKey === 'reason_hesitant' ? 'hesitant' : 'refused'), res.accepted ? 'ok' : 'bad')
    if (res.accepted) sfx.treaty(); else sfx.bad()
  })

  const war = (target: string, playerControlled: boolean) => mutate(s => {
    declareWar(s, s.playerId, target, undefined, playerControlled)
    sfx.war()
  })
  const peace = (target: string) => mutate(s => {
    const res = proposeTreaty(s, s.playerId, target, 'peace')
    toast(t(s.lang, res.accepted ? 'accepted' : 'refused'), res.accepted ? 'ok' : 'bad')
    if (res.accepted) sfx.treaty()
  })
  const breakTr = (id: number) => mutate(s => { breakTreaty(s, id, s.playerId); sfx.bad() })

  const chat = (target: string, text: string) => mutate(s => { sendChat(s, s.playerId, target, text); sfx.click() })
  const sanctions = (target: string) => mutate(s => { const ok = imposeSanctions(s, s.playerId, target); if (ok) sfx.treaty(); else sfx.bad() })
  const liftSanc = (target: string) => mutate(s => { liftSanctions(s, s.playerId, target) })
  const nuke = (target: string) => mutate(s => { const ok = applyOrder(s, { type: 'nuke_strike', target }); if (ok) sfx.war(); else sfx.bad() })

  // achievement toasts
  const lastAch = useRef(0)
  useEffect(() => {
    const n = state?.achievements?.length ?? 0
    if (n > lastAch.current && state) {
      const id = state.achievements![n - 1]
      toast('🏅 ' + t(state.lang, id), 'ok')
      sfx.ok()
    }
    lastAch.current = n
  }, [state?.achievements?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => mutate(s => { s.theme = s.theme === 'dark' ? 'parchment' : 'dark' })
  const toggleMute = () => mutate(s => { s.muted = !s.muted; setMuted(s.muted) })
  const tutNext = () => mutate(s => { s.tutorialStep++ })

  const save = () => { if (state) { saveState(state, LS_MANUAL); toast(t(state.lang, 'saved'), 'ok'); sfx.ok() } }
  const load = () => {
    const g = loadState(LS_MANUAL) ?? loadState(LS_AUTO)
    if (g) { setState(g); setSelected(g.playerId); setScreen('game'); setMuted(g.muted); toast(t(g.lang, 'loaded'), 'ok') }
    else toast(lang === 'ru' ? 'Нет сохранений' : 'No saves', 'bad')
  }

  const hasSave = !!localStorage.getItem(LS_AUTO) || !!localStorage.getItem(LS_MANUAL)

  const playScenario = (sc: Scenario, playerId: string) => {
    const g = createGame({ year: sc.year, playerId, difficulty: 2, lang })
    g.regionOwner = { ...sc.regionOwner }
    for (const [cid, p] of Object.entries(sc.patches)) {
      const c = g.countries[cid]
      if (!c) continue
      if (p.treasury !== undefined) c.treasury = p.treasury
      if (p.divisions !== undefined) c.divisions = p.divisions
      if (p.industry !== undefined) c.industry = p.industry
    }
    for (const c of Object.values(g.countries)) {
      if (!Object.values(g.regionOwner).includes(c.id)) c.alive = false
    }
    g.scenarioId = sc.id
    setState(g)
    setSelected(playerId)
    setScreen('game')
    sfx.ok()
  }

  if (screen === 'editor') {
    return <ScenarioEditor lang={lang} setLang={setLang} onExit={() => setScreen('menu')} onPlay={playScenario} />
  }

  if (screen === 'setup') {
    return <Setup lang={lang} setLang={setLang} onStart={startGame} onExit={() => setScreen('menu')} />
  }

  if (screen === 'game' && state) {
    return (
      <>
        <Game
          state={state}
          toasts={toasts}
          selected={selected}
          setSelected={setSelected}
          onAdvance={advance}
          onOrder={order}
          onSetRate={setRate}
          onDecree={decree}
          decreeBusy={decreeBusy}
          onImprove={improve}
          onPropose={propose}
          onDeclareWar={war}
          onOfferPeace={peace}
          onBreakTreaty={breakTr}
          onSave={save}
          onLoad={load}
          onMenu={() => { saveState(state, LS_AUTO); setScreen('menu') }}
          onSettings={() => setShowSettings(true)}
          onToggleTheme={toggleTheme}
          onToggleMute={toggleMute}
          onTutNext={tutNext}
          onNuke={nuke}
          onChat={chat}
          onSanctions={sanctions}
          onLiftSanctions={liftSanc}
        />
        {showSettings && (
          <div className="overlay" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>⚙️ {t(lang, 'settings')}</h2>
              <h3>{t(lang, 'ai_settings')}</h3>
              <label>{t(lang, 'ai_endpoint')}
                <input className="input" value={aiCfg.endpoint} onChange={e => setAiCfg({ ...aiCfg, endpoint: e.target.value })} />
              </label>
              <label>{t(lang, 'ai_model')}
                <input className="input" value={aiCfg.model} onChange={e => setAiCfg({ ...aiCfg, model: e.target.value })} />
              </label>
              <label>{t(lang, 'ai_key_label')}
                <input className="input" type="password" value={aiCfg.key} onChange={e => setAiCfg({ ...aiCfg, key: e.target.value })} />
              </label>
              <p className="hint">{t(lang, 'ai_note')}</p>
              <div className="modal-btns">
                <button className="btn primary" onClick={() => { saveAiSettings(aiCfg); setShowSettings(false); toast(t(lang, 'saved'), 'ok') }}>
                  {t(lang, 'ai_save')}
                </button>
                <button className="btn ghost" onClick={() => setShowSettings(false)}>{t(lang, 'back')}</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="menu-screen">
      <div className="menu-inner">
        <div className="menu-lang">
          <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        <h1 className="menu-title">PAX MUNDI</h1>
        <p className="menu-sub">{lang === 'ru' ? 'Гранд-стратегия альтернативной истории' : 'Alternate-history grand strategy'}</p>
        <p className="menu-quote">
          {lang === 'ru' ? '«Что, если бы история пошла иначе? Теперь это решаете вы.»' : '"What if history went differently? Now you decide."'}
        </p>
        <div className="menu-btns">
          <button className="btn primary big" onClick={() => setScreen('setup')}>{t(lang, 'new_game')}</button>
          {hasSave && <button className="btn big" onClick={load}>{t(lang, 'continue')}</button>}
          <button className="btn big" onClick={() => setScreen('editor')}>🛠 {t(lang, 'scenario_editor')}</button>
        </div>
        <div className="menu-footer">
          {lang === 'ru'
            ? 'Песочница: любая держава, любая эпоха · Реестр договоров · Живой ИИ-мир · Экономика в цифрах · Дерево технологий · Идеологии и революции'
            : 'Sandbox: any nation, any era · Treaty registry · Living AI world · Numeric economy · Tech tree · Ideologies & revolutions'}
        </div>
      </div>
    </div>
  )
}
