import { useState } from 'react'
import type { GameState, TreatyType } from '../sim/types'
import { fmtNum } from '../sim/types'
import { regionsOf, power, relOf, hasTreaty, atWarWith } from '../sim/setup'
import { t, GOV_KEYS, PER_KEYS, TREATY_KEYS } from '../i18n'

interface Props {
  state: GameState
  countryId: string | null
  onClose: () => void
  onImprove: (target: string) => void
  onPropose: (target: string, type: TreatyType) => void
  onDeclareWar: (target: string) => void
  onOfferPeace: (target: string) => void
}

export default function CountryPanel({ state, countryId, onClose, onImprove, onPropose, onDeclareWar, onOfferPeace }: Props) {
  const lang = state.lang
  const [propType, setPropType] = useState<TreatyType>('nap')
  const p = state.countries[state.playerId]
  const c = countryId ? state.countries[countryId] : null

  if (!c || !c.alive) {
    return (
      <div className="side-panel empty">
        <p className="hint">{lang === 'ru' ? 'Кликните по стране на карте' : 'Click a country on the map'}</p>
      </div>
    )
  }

  const isSelf = c.id === state.playerId
  const rel = relOf(state, state.playerId, c.id)
  const war = atWarWith(state, state.playerId, c.id)
  const ourTreaties = state.treaties.filter(x => x.status === 'active' &&
    ((x.parties[0] === c.id && x.parties[1] === state.playerId) || (x.parties[1] === c.id && x.parties[0] === state.playerId)))

  return (
    <div className="side-panel">
      <div className="sp-head">
        <span className="c-flag big">{c.flag}</span>
        <div className="sp-title">
          <b>{c.name}</b>
          <span>{t(lang, GOV_KEYS[c.government])} · {t(lang, PER_KEYS[c.personality])}</span>
        </div>
        <button className="btn ghost x" onClick={onClose}>✕</button>
      </div>

      <div className="sp-stats">
        <div><label>{t(lang, 'population')}</label><b>{fmtNum(c.population)}M</b></div>
        <div><label>{t(lang, 'industry')}</label><b>{fmtNum(c.industry)}</b></div>
        <div><label>{t(lang, 'tech')}</label><b>{c.tech.toFixed(1)}</b></div>
        <div><label>{t(lang, 'divisions')}</label><b>{c.divisions}</b></div>
        <div><label>{t(lang, 'navy')}</label><b>{c.navy}</b></div>
        <div><label>{t(lang, 'regions')}</label><b>{regionsOf(state, c.id).length}</b></div>
        <div><label>{lang === 'ru' ? 'Мощь' : 'Power'}</label><b>{fmtNum(power(c))}</b></div>
        <div><label>{t(lang, 'reputation')}</label><b>{Math.round(c.reputation)}</b></div>
      </div>

      {isSelf ? (
        <p className="hint">{t(lang, 'your_country')}</p>
      ) : (
        <>
          <div className="rel-block">
            <label>{t(lang, 'relations')}: <b className={rel >= 0 ? 'pos' : 'neg'}>{rel > 0 ? '+' : ''}{rel}</b></label>
            <div className="rel-bar"><div className={rel >= 0 ? 'fill pos' : 'fill neg'} style={{ width: Math.abs(rel) + '%' }} /></div>
            {war && <div className="at-war-badge">⚔️ {t(lang, 'at_war')}</div>}
          </div>

          {ourTreaties.length > 0 && (
            <div className="our-treaties">
              <label>{t(lang, 'our_treaties')}:</label>
              {ourTreaties.map(x => <span key={x.id} className="chip">{t(lang, TREATY_KEYS[x.type])}</span>)}
            </div>
          )}

          <div className="diplo-actions">
            {!war && (
              <>
                <button className="btn" disabled={p.treasury < 50} onClick={() => onImprove(c.id)}>
                  {t(lang, 'improve_relations')}
                </button>
                <div className="prop-row">
                  <select value={propType} onChange={e => setPropType(e.target.value as TreatyType)}>
                    {(['nap', 'trade', 'alliance', 'guarantee'] as TreatyType[]).map(tt => (
                      <option key={tt} value={tt}>{t(lang, TREATY_KEYS[tt])}</option>
                    ))}
                  </select>
                  <button className="btn" disabled={hasTreaty(state, state.playerId, c.id, propType)} onClick={() => onPropose(c.id, propType)}>
                    {t(lang, 'propose')}
                  </button>
                </div>
                <button className="btn danger" onClick={() => onDeclareWar(c.id)}>⚔️ {t(lang, 'declare_war')}</button>
              </>
            )}
            {war && <button className="btn primary" onClick={() => onOfferPeace(c.id)}>🕊️ {t(lang, 'offer_peace')}</button>}
          </div>
        </>
      )}
    </div>
  )
}
