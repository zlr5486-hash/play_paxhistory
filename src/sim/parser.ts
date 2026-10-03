import type { PlayerOrder } from './types'

// Offline "decree" parser: turns free-text intent into structured orders (RU + EN keywords).
export function parseDecree(text: string, treasury: number): PlayerOrder[] {
  const s = text.toLowerCase()
  const orders: PlayerOrder[] = []
  const has = (...words: string[]) => words.some(w => s.includes(w))

  if (has('инвест', 'завод', 'промышлен', 'фабрик', 'стройк', 'индустри', 'invest', 'industr', 'factor', 'factory', 'build up'))
    orders.push({ type: 'invest', amount: Math.round(treasury * 0.15) })
  if (has('арми', 'дивизи', 'мобилиз', 'призыв', 'солдат', 'войск', 'army', 'division', 'mobiliz', 'conscript', 'troop', 'soldier'))
    orders.push({ type: 'army', amount: 5 })
  if (has('флот', 'корабл', 'верф', 'морск', 'адмирал', 'navy', 'ship', 'fleet', 'dockyard'))
    orders.push({ type: 'navy', amount: 2 })
  if (has('наук', 'исследован', 'технолог', 'университет', 'академ', 'учён', 'research', 'science', 'technolog', 'university', 'academ'))
    orders.push({ type: 'research' })
  if (has('пропаганд', 'агитац', 'патриот', 'пропаг', 'моральн', 'дух', 'propaganda', 'morale', 'patriot', 'rally'))
    orders.push({ type: 'propaganda' })
  if (has('порядок', 'стабильн', 'полици', 'беспоряд', 'успоко', 'стабилизац', 'order', 'stabil', 'police', 'calm'))
    orders.push({ type: 'stabilize' })
  return orders
}
