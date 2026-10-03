import { useMemo, useState } from 'react'
import type { Lang } from '../sim/types'
import { SNAPSHOTS, snapshotForYear, SNAPSHOT_POLITIES } from '../data/snapshots'
import { MODERN } from '../data/polities'
import { createGame } from '../sim/setup'
import MapView from './MapView'
import { t } from '../i18n'
import { fmtNum } from '../sim/types'

interface Props {
  lang: Lang
  setLang: (l: Lang) => void
  onStart: (opts: { year: number; playerId: string; difficulty: number; lang: Lang }) => void
  onExit: () => void
}

export default function Setup({ lang, setLang, onStart, onExit }: Props) {
  const [snapIdx, setSnapIdx] = useState(4) // 1936 default
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState(2)
  const [search, setSearch] = useState('')
  const [selectedMap, setSelectedMap] = useState<string | null>(null)

  const snap = SNAPSHOTS[snapIdx]

  // Draft game used only to preview owners/colors/countries for the chosen era
  const draft = useMemo(() => createGame({ year: snap.year, playerId: '__draft__', difficulty, lang }), [snap.year, lang, difficulty])

  const list = useMemo(() => {
    const arr = Object.values(draft.countries)
      .filter(c => c.alive)
      .map(c => ({ ...c }))
      .sort((a, b) => b.industry - a.industry)
    const q = search.trim().toLowerCase()
    return q ? arr.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) : arr
  }, [draft, search])

  const chosen = playerId ? draft.countries[playerId] : null

  return (
    <div className="setup-screen">
      <div className="setup-header">
        <button className="btn ghost" onClick={onExit}>← {t(lang, 'back')}</button>
        <div className="setup-title">
          <h1>{t(lang, 'game_title')}</h1>
          <p>{t(lang, 'game_subtitle')}</p>
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
              <button key={s.year} className={'era-card' + (i === snapIdx ? ' active' : '')} onClick={() => { setSnapIdx(i); setPlayerId(null) }}>
                <b>{lang === 'ru' ? s.labelRu : s.labelEn}</b>
                <span>{lang === 'ru' ? s.descRu : s.descEn}</span>
              </button>
            ))}
          </div>

          <h2>{t(lang, 'choose_country')}</h2>
          <input className="input" placeholder={t(lang, 'search')} value={search} onChange={e => setSearch(e.target.value)} />
          <div className="country-list">
            {list.map(c => (
              <button key={c.id} className={'country-row' + (playerId === c.id ? ' active' : '')} onClick={() => setPlayerId(c.id)}>
                <span className="c-flag">{c.flag}</span>
                <span className="c-name">{c.name}</span>
                <span className="c-stats">🏭 {fmtNum(c.industry)} · 👥 {fmtNum(c.population)}M</span>
              </button>
            ))}
          </div>
          <p className="hint">{t(lang, 'choose_country_hint')}</p>
        </div>

        <div className="setup-right">
          <div className="setup-map-box">
            <MapView state={draft} selected={selectedMap ?? playerId} onSelect={(cid) => { if (cid && cid !== '__draft__') setPlayerId(cid) }} />
          </div>

          <div className="setup-controls">
            {chosen && (
              <div className="chosen-card">
                <div className="chosen-head"><span className="c-flag big">{chosen.flag}</span> <b>{chosen.name}</b></div>
                <div className="chosen-stats">
                  <span>👥 {fmtNum(chosen.population)}M</span>
                  <span>🏭 {fmtNum(chosen.industry)}</span>
                  <span>🔬 {chosen.tech.toFixed(1)}</span>
                  <span>🪖 {chosen.divisions}</span>
                </div>
              </div>
            )}
            <label className="diff-label">
              {t(lang, 'difficulty')}:
              <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}>
                {[0, 1, 2, 3, 4].map(d => <option key={d} value={d}>{t(lang, 'diff_' + d)}</option>)}
              </select>
            </label>
            <button
              className="btn primary big"
              disabled={!playerId}
              onClick={() => playerId && onStart({ year: snap.year, playerId, difficulty, lang })}
            >
              {playerId ? t(lang, 'start_game') : t(lang, 'pick_country_first')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
