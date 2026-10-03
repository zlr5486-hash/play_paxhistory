import { useEffect, useRef, useState } from 'react'
import type { GameState, TreatyType } from '../sim/types'
import { fmtNum, monthName } from '../sim/types'
import { regionsOf, power, relOf, hasTreaty, atWarWith } from '../sim/setup'
import { cbFor } from '../sim/engine'
import { chatKey } from '../sim/chat'
import { t, GOV_KEYS, PER_KEYS, TREATY_KEYS } from '../i18n'

interface Props {
  state: GameState
  countryId: string | null
  onClose: () => void
  onImprove: (target: string) => void
  onPropose: (target: string, type: TreatyType) => void
  onDeclareWar: (target: string, playerControlled: boolean) => void
  onOfferPeace: (target: string) => void
  onChat: (target: string, text: string) => void
  onSanctions: (target: string) => void
  onLiftSanctions: (target: string) => void
}

const PHRASES: { key: string; ru: string; en: string }[] = [
  { key: 'phrase_hello', ru: 'Приветствую вас, лидер великой державы!', en: 'Greetings, leader of a great nation!' },
  { key: 'phrase_ally', ru: 'Наши страны могли бы стать союзниками. Что скажете?', en: 'Our nations could be allies. What say you?' },
  { key: 'phrase_trade', ru: 'Нам пора расширять торговлю между странами.', en: 'It is time to expand trade between our lands.' },
  { key: 'phrase_peace', ru: 'Нам нужен мир. Война разоряет обоих.', en: 'We need peace. War ruins us both.' },
  { key: 'phrase_praise', ru: 'Ваша мудрость известна всему миру.', en: 'Your wisdom is known across the world.' },
  { key: 'phrase_threat', ru: 'Советую считаться с нашей силой, иначе пожалеете.', en: 'Heed our strength, or you will regret it.' },
]

export default function CountryPanel({ state, countryId, onClose, onImprove, onPropose, onDeclareWar, onOfferPeace, onChat, onSanctions, onLiftSanctions }: Props) {
  const lang = state.lang
  const [propType, setPropType] = useState<TreatyType>('nap')
  const [warAsk, setWarAsk] = useState<string | null>(null)
  const [manualCmd, setManualCmd] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const p = state.countries[state.playerId]
  const c = countryId ? state.countries[countryId] : null
  const msgs = c && state.chats ? state.chats[chatKey(state.playerId, c.id)] ?? [] : []
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, chatOpen, countryId])

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
  const cb = cbFor(state, state.playerId, c.id)
  const ourTreaties = state.treaties.filter(x => x.status === 'active' &&
    ((x.parties[0] === c.id && x.parties[1] === state.playerId) || (x.parties[1] === c.id && x.parties[0] === state.playerId)))

  return (
    <div className="side-panel">
      <div className="sp-head">
        <span className="c-flag big">{c.flag}</span>
        <div className="sp-title">
          <b>{c.name}</b>
          <span>{t(lang, GOV_KEYS[c.government])} · {t(lang, 'ideo_' + c.ideology)} · {t(lang, PER_KEYS[c.personality])}</span>
          {c.leader && <span className="sp-leader">👤 {c.leader}</span>}
        </div>
        <button className="btn ghost x" onClick={onClose}>✕</button>
      </div>

      <div className="sp-stats">
        <div><label>{t(lang, 'population')}</label><b>{fmtNum(c.population)}M</b></div>
        <div><label>{t(lang, 'industry')}</label><b>{fmtNum(c.industry)}</b></div>
        <div><label>{t(lang, 'tech')}</label><b>{c.tech.toFixed(1)}</b></div>
        <div><label>{t(lang, 'science_pts')}</label><b>{fmtNum(c.science)}</b></div>
        <div><label>{t(lang, 'prestige')}</label><b>{Math.round(c.prestige)}</b></div>
        <div><label>{t(lang, 'divisions')}</label><b>{c.divisions}</b></div>
        <div><label>{t(lang, 'navy')}</label><b>{c.navy}</b></div>
        <div><label>{t(lang, 'factories_civ')}</label><b>{c.factoriesCiv}</b></div>
        <div><label>{t(lang, 'factories_mil')}</label><b>{c.factoriesMil}</b></div>
        <div><label>{t(lang, 'equipment')}</label><b>{Math.round(c.equipment)}</b></div>
        <div><label>{t(lang, 'regions')}</label><b>{regionsOf(state, c.id).length}</b></div>
        <div><label>{lang === 'ru' ? 'Мощь' : 'Power'}</label><b>{fmtNum(power(c))}</b></div>
        <div><label>{t(lang, 'reputation')}</label><b>{Math.round(c.reputation)}</b></div>
        <div><label>{t(lang, 'stability')}</label><b>{Math.round(c.stability)}</b></div>
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
                    {(['nap', 'trade', 'alliance', 'guarantee', 'vassal'] as TreatyType[]).map(tt => (
                      <option key={tt} value={tt}>{t(lang, TREATY_KEYS[tt])}</option>
                    ))}
                  </select>
                  <button className="btn" disabled={hasTreaty(state, state.playerId, c.id, propType)} onClick={() => onPropose(c.id, propType)}>
                    {t(lang, 'propose')}
                  </button>
                </div>
                {hasTreaty(state, state.playerId, c.id, 'sanctions')
                  ? <button className="btn" onClick={() => onLiftSanctions(c.id)}>💼 {t(lang, 'lift_sanctions_label')}</button>
                  : <button className="btn" onClick={() => onSanctions(c.id)}>{t(lang, 'impose_sanctions')}</button>}
                <button className="btn danger" onClick={() => setWarAsk(c.id)}>⚔️ {t(lang, 'declare_war')}</button>
              </>
            )}
            {war && <button className="btn primary" onClick={() => onOfferPeace(c.id)}>🕊️ {t(lang, 'offer_peace')}</button>}
            <button className="btn ghost" onClick={() => setChatOpen(o => !o)}>
              💬 {t(lang, 'chat_title')}{chatOpen ? ' ▾' : ' ▸'}
            </button>
          </div>

          {chatOpen && (
            <div className="chat-box">
              <div className="chat-log">
                {msgs.length === 0 && <p className="hint">{t(lang, 'chat_hint')}</p>}
                {msgs.map((m, i) => (
                  <div key={i} className={'chat-msg' + (m.from === state.playerId ? ' me' : ' them')}>
                    <span className="chat-who">{state.countries[m.from]?.flag} {monthName(m.month, lang)}</span>
                    <div>{m.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-phrases">
                {PHRASES.map(ph => (
                  <button key={ph.key} onClick={() => onChat(c.id, lang === 'ru' ? ph.ru : ph.en)}>
                    {t(lang, ph.key)}
                  </button>
                ))}
              </div>
              <div className="chat-input-row">
                <input className="input" value={chatText} placeholder={t(lang, 'chat_hint')}
                  onChange={e => setChatText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && chatText.trim()) { onChat(c.id, chatText.trim()); setChatText('') } }} />
                <button className="btn primary sm" disabled={!chatText.trim()} onClick={() => { onChat(c.id, chatText.trim()); setChatText('') }}>
                  {t(lang, 'chat_send')}
                </button>
              </div>
            </div>
          )}

          {warAsk === c.id && (
            <div className="war-confirm">
              <b>{t(lang, 'war_command')}</b>
              <label className="cmd-opt"><input type="radio" checked={manualCmd} onChange={() => setManualCmd(true)} />
                {t(lang, 'manual_command')}</label>
              <label className="cmd-opt"><input type="radio" checked={!manualCmd} onChange={() => setManualCmd(false)} />
                {t(lang, 'minister_command')}</label>
              {!manualCmd && <p className="hint">{t(lang, 'minister_note')}</p>}
              <p className="hint">
                {cb ? `${t(lang, 'cb_label')}: ${t(lang, 'cb_' + cb)}` : t(lang, 'no_cb_warn')}
              </p>
              <div className="war-confirm-btns">
                <button className="btn danger" onClick={() => { onDeclareWar(c.id, manualCmd); setWarAsk(null) }}>
                  {t(lang, 'war_confirm')}
                </button>
                <button className="btn ghost" onClick={() => setWarAsk(null)}>{t(lang, 'cancel')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
