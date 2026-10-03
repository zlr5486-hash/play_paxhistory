import type { GameState, PlayerOrder } from './sim/types'
import { regionsOf, power } from './sim/setup'

export interface AiSettings { endpoint: string; model: string; key: string }

const LS_KEY = 'paxmundi_ai'

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini', key: '' }
}
export function saveAiSettings(s: AiSettings): void { localStorage.setItem(LS_KEY, JSON.stringify(s)) }

function worldSummary(state: GameState): string {
  const p = state.countries[state.playerId]
  const year = Math.floor(state.month / 12)
  const top = Object.values(state.countries).filter(c => c.alive && !c.isPlayer)
    .sort((a, b) => power(b) - power(a)).slice(0, 8)
    .map(c => `${c.name}: power ${Math.round(power(c))}, rel ${p.relations[c.id] ?? 0}`).join('; ')
  const wars = state.wars.filter(w => !w.over).map(w => `${w.attackers.map(a => state.countries[a]?.name).join('+')} vs ${w.defenders.map(d => state.countries[d]?.name).join('+')}`)
  return [
    `Year ${year}. Player nation: ${p.name}. Population ${p.population.toFixed(1)}M, industry ${Math.round(p.industry)}, tech ${p.tech.toFixed(1)}, treasury ${Math.round(p.treasury)}, divisions ${p.divisions}, stability ${Math.round(p.stability)}.`,
    `Major powers: ${top}.`,
    wars.length ? `Active wars: ${wars.join(' | ')}` : 'No active wars.',
  ].join(' ')
}

export interface LlmDecreeResult { narrative: string; orders: PlayerOrder[] }

// Sends the free-text decree to an LLM (if configured) and gets narrative + structured orders.
export async function llmDecree(state: GameState, text: string): Promise<LlmDecreeResult | null> {
  const cfg = loadAiSettings()
  if (!cfg.key) return null
  try {
    const sys = `You are the game engine narrator of a grand strategy game. The player rules a nation and issues a decree in free text. ` +
      `Respond ONLY with JSON: {"narrative": "<2-4 sentences describing how the decree unfolds>", "orders": [{"type": one of invest|research|propaganda|army|navy|stabilize}]}. ` +
      `Pick at most 3 orders that match the intent.`
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `World state: ${worldSummary(state)}\n\nDecree: ${text}` },
        ],
        temperature: 0.8,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) return null
    const parsed = JSON.parse(m[0])
    const valid = ['invest', 'research', 'propaganda', 'army', 'navy', 'stabilize']
    const orders: PlayerOrder[] = (parsed.orders ?? [])
      .filter((o: { type?: string }) => o && !!o.type && valid.includes(o.type))
      .slice(0, 3)
      .map((o: { type: string }) => ({ type: o.type }))
    return { narrative: String(parsed.narrative ?? ''), orders }
  } catch {
    return null
  }
}
