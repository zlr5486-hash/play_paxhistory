import type { General, GeneralTrait, Lang } from '../sim/types'

// era-flavored fictional name pools (original, no real persons)
const POOLS = [
  { // up to ~1500
    first: ['Марк', 'Гай', 'Луций', 'Артур', 'Роланд', 'Бодуэн', 'Иштван', 'Конрад', 'Алексий', 'Теодор', 'Готфрид', 'Раймунд'],
    last: ['Валерий', 'Север', 'Кассий', 'де Монфор', 'Отвиль', 'Палеолог', 'Аспень', 'Корвин', 'Валанкур', 'Бренн'],
  },
  { // 1500–1800
    first: ['Альбрехт', 'Густав', 'Фердинанд', 'Карл', 'Лоренцо', 'Ян', 'Сигизмунд', 'Фридрих', 'Амбруаз', 'Матиас', 'Генрих', 'Томаш'],
    last: ['фон Штернберг', 'де Валье', 'Конти', 'Оксеншерна', 'Радзивилл', 'Пикколомини', 'де Терм', 'Врангель', 'Собеский', 'Монтекукколи'],
  },
  { // 1800+
    first: ['Александр', 'Николай', 'Вильгельм', 'Луи', 'Арчибальд', 'Рихард', 'Эдвард', 'Виктор', 'Михаил', 'Оскар', 'Георг', 'Дуглас'],
    last: ['Барклай', 'фон Раух', 'Ланской', 'Дюваль', 'Хейг', 'Молтке', 'Радетский', 'Черняев', 'Фонвизин', 'Леопольд', 'Грант', 'Суворин'],
  },
]

const TRAITS: { t: GeneralTrait; w: number }[] = [
  { t: 'brilliant', w: 0.12 },
  { t: 'aggressive', w: 0.3 },
  { t: 'cautious', w: 0.28 },
  { t: 'logistician', w: 0.15 },
  { t: 'mediocre', w: 0.15 },
]

export function traitName(t: GeneralTrait, lang: Lang): string {
  const M: Record<GeneralTrait, [string, string]> = {
    aggressive: ['Агрессор', 'Aggressive'],
    cautious: ['Осторожный', 'Cautious'],
    brilliant: ['Блестящий', 'Brilliant'],
    mediocre: ['Посредственный', 'Mediocre'],
    logistician: ['Логист', 'Logistician'],
  }
  return lang === 'ru' ? M[t][0] : M[t][1]
}

let seq = 1

export function genGeneral(year: number, rnd: () => number): General {
  const pool = year < 1500 ? POOLS[0] : year < 1800 ? POOLS[1] : POOLS[2]
  const name = pool.first[Math.floor(rnd() * pool.first.length)] + ' ' + pool.last[Math.floor(rnd() * pool.last.length)]
  let r = rnd(), trait: GeneralTrait = 'mediocre'
  for (const x of TRAITS) { if (r < x.w) { trait = x.t; break } r -= x.w }
  const base = trait === 'brilliant' ? 4 : trait === 'mediocre' ? 1 : trait === 'aggressive' ? 3 : trait === 'logistician' ? 3 : 2
  const skill = Math.max(0, Math.min(5, base + Math.round(rnd() * 2 - 1)))
  return { id: 9000 + seq++, name, skill, trait }
}

export function generalBonus(g: General | undefined, defending: boolean): number {
  if (!g) return 1
  let b = 1 + g.skill * 0.035
  if (g.trait === 'aggressive' && !defending) b += 0.06
  if (g.trait === 'cautious' && defending) b += 0.06
  if (g.trait === 'logistician') b += 0.03
  return b
}
