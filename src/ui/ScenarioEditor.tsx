import { useMemo, useState } from 'react'
import type { GameState, Lang } from '../sim/types'
import { fmtNum } from '../sim/types'
import { createGame, regionsOf } from '../sim/setup'
import { SNAPSHOTS } from '../data/snapshots'
import MapView from './MapView'
import { t } from '../i18n'

export interface Scenario {
  id: string
  name: string
  year: number
  regionOwner: Record<string, string>
  patches: Record<string, { treasury?: number; divisions?: number; industry?: number }>
}

const LS_KEY = 'paxmundi_scenarios'

export function loadScenarios(): Scenario[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Scenario[] } catch { return [] }
}
export function saveScenarios(list: Scenario[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

interface Props {
  lang: Lang
  setLang: (l: Lang) => void
  onExit: () => void
  onPlay: (sc: Scenario, playerId: string) => void
}

export default function ScenarioEditor({ lang, setLang, onExit, onPlay }: Props) {
  const [snapIdx, setSnapIdx] = useState(4)
  const [name, setName] = useState(lang === 'ru' ? 'Мой сценарий' : 'My scenario')
  const [brush, setBrush] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<GameState>(() => createGame({ year: SNAPSHOTS[4].year, playerId: '__draft__', difficulty: 2, lang }))
  const [scenarios, setScenarios] = useState<Scenario[]>(() => loadScenarios())
  const [pending, setPending] = useState<Scenario | null>(null)
  const [pendingPid, setPendingPid] = useState('')
  const pendingCountries = useMemo(() => {
    if (!pending) return []
    return Object.values(createGame({ year: pending.year, playerId: '__draft__', difficulty: 2, lang }).countries)
      .filter(c => c.alive).slice(0, 30)
  }, [pending, lang])

  const snap = SNAPSHOTS[snapIdx]
  const countries = useMemo(() => Object.values(draft.countries).filter(c => c.alive).sort((a, b) => b.industry - a.industry), [draft])
  const editing = editId ? draft.countries[editId] : null

  const switchEra = (i: number) => {
    setSnapIdx(i)
    setDraft(createGame({ year: SNAPSHOTS[i].year, playerId: '__draft__', difficulty: 2, lang }))
    setBrush(null)
  }

  const paint = (_cid: string | null, regionId?: string) => {
    if (!regionId || !brush) return
    setDraft(d => {
      const next: GameState = JSON.parse(JSON.stringify(d))
      next.regionOwner[regionId] = brush
      return next
    })
  }

  const patch = (field: 'treasury' | 'divisions' | 'industry', v: number) => {
    if (!editId) return
    setDraft(d => {
      const next: GameState = JSON.parse(JSON.stringify(d))
      const c = next.countries[editId]
      if (c) (c[field] as number) = v
      return next
    })
  }

  const save = () => {
    const patches: Scenario['patches'] = {}
    const base = createGame({ year: snap.year, playerId: '__draft__', difficulty: 2, lang })
    for (const c of Object.values(draft.countries)) {
      const b = base.countries[c.id]
      if (!b) continue
      const p: Scenario['patches'][string] = {}
      if (Math.round(c.treasury) !== Math.round(b.treasury)) p.treasury = c.treasury
      if (c.divisions !== b.divisions) p.divisions = c.divisions
      if (Math.abs(c.industry - b.industry) > 0.5) p.industry = c.industry
      if (Object.keys(p).length) patches[c.id] = p
    }
    const sc: Scenario = { id: Date.now().toString(36), name: name.trim() || 'Scenario', year: snap.year, regionOwner: draft.regionOwner, patches }
    const list = [sc, ...scenarios].slice(0, 10)
    setScenarios(list)
    saveScenarios(list)
  }

  const remove = (id: string) => {
    const list = scenarios.filter(s => s.id !== id)
    setScenarios(list)
    saveScenarios(list)
  }

  return (
    <div className="setup-screen editor-screen">
      <div className="setup-header">
        <button className="btn ghost" onClick={onExit}>← {t(lang, 'back')}</button>
        <div className="setup-title">
          <h1>🛠 {t(lang, 'scenario_editor')}</h1>
          <p>{t(lang, 'sc_hint')}</p>
        </div>
        <div className="lang-switch">
          <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
      </div>

      <div className="setup-body">
        <div className="setup-left">
          <h2>{t(lang, 'choose_era')}</h2>
          <div className="era-list">
            {SNAPSHOTS.map((s, i) => (
              <button key={s.year} className={'era-card' + (i === snapIdx ? ' active' : '')} onClick={() => switchEra(i)}>
                <b>{lang === 'ru' ? s.labelRu : s.labelEn}</b>
              </button>
            ))}
          </div>

          <h2>🖌 {t(lang, 'sc_pick_owner')}</h2>
          <div className="country-list brush-list">
            {countries.slice(0, 24).map(c => (
              <button key={c.id} className={'country-row' + (brush === c.id ? ' active' : '')} onClick={() => setBrush(c.id)}>
                <span className="c-flag">{c.flag}</span>
                <span className="c-name">{c.name}</span>
                <span className="c-stats">🗺 {regionsOf(draft, c.id).length}</span>
              </button>
            ))}
          </div>

          <h2>🏦 {t(lang, 'sc_edit_country')}</h2>
          <select className="input" value={editId ?? ''} onChange={e => setEditId(e.target.value || null)}>
            <option value="">—</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
          {editing && (
            <div className="sc-sliders">
              <label>💰 {t(lang, 'treasury')}: <b>{fmtNum(editing.treasury)}</b>
                <input type="range" min={0} max={20000} step={100} value={editing.treasury} onChange={e => patch('treasury', Number(e.target.value))} />
              </label>
              <label>🪖 {t(lang, 'divisions')}: <b>{editing.divisions}</b>
                <input type="range" min={0} max={500} value={editing.divisions} onChange={e => patch('divisions', Number(e.target.value))} />
              </label>
              <label>🏭 {t(lang, 'industry')}: <b>{Math.round(editing.industry)}</b>
                <input type="range" min={1} max={5000} value={Math.round(editing.industry)} onChange={e => patch('industry', Number(e.target.value))} />
              </label>
            </div>
          )}

          <div className="sc-save-row">
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t(lang, 'sc_name')} />
            <button className="btn primary" onClick={save}>💾 {t(lang, 'save')}</button>
          </div>

          <h2>📚 {t(lang, 'sc_saved')}</h2>
          <div className="sc-list">
            {scenarios.length === 0 && <p className="hint">—</p>}
            {scenarios.map(sc => (
              <div key={sc.id} className="sc-row">
                <b>{sc.name}</b> <span className="hint">({sc.year})</span>
                <button className="btn sm" onClick={() => { setPending(sc); setPendingPid('') }}>▶ {t(lang, 'sc_play')}</button>
                <button className="btn danger sm" onClick={() => remove(sc.id)}>{t(lang, 'sc_delete')}</button>
              </div>
            ))}
            {pending && (
              <div className="sc-pending">
                <label>{t(lang, 'choose_country')}:
                  <select className="input" value={pendingPid} onChange={e => setPendingPid(e.target.value)}>
                    <option value="">—</option>
                    {pendingCountries.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                  </select>
                </label>
                <button className="btn primary sm" disabled={!pendingPid} onClick={() => onPlay(pending, pendingPid)}>
                  {t(lang, 'start_game')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="setup-right">
          <div className="setup-map-box">
            <MapView state={draft} selected={brush} onSelect={paint} />
          </div>
        </div>
      </div>
    </div>
  )
}
