import type { Country, TechBranch, Lang } from './types'

export const BRANCHES: TechBranch[] = ['inf', 'arm', 'air', 'nav', 'ind', 'sci']

export const BRANCH_INFO: Record<TechBranch, { ru: string; en: string; icon: string }> = {
  inf: { ru: 'Пехота и артиллерия', en: 'Infantry & artillery', icon: '🪖' },
  arm: { ru: 'Бронетехника', en: 'Armour', icon: '🛡️' },
  air: { ru: 'Авиация', en: 'Aviation', icon: '✈️' },
  nav: { ru: 'Флот', en: 'Navy', icon: '⚓' },
  ind: { ru: 'Промышленность', en: 'Industry', icon: '🏭' },
  sci: { ru: 'Наука', en: 'Science', icon: '🔬' },
}

export const MAX_TIER = 5

// era-flavored tier names (HOI4-mod style flavor)
export const TECH_TIERS: Record<TechBranch, [string, string][]> = {
  inf: [['Меч и строй', 'Sword & formation'], ['Мушкеты', 'Muskets'], ['Линейная пехота', 'Line infantry'], ['Окопная война', 'Trench warfare'], ['Мотострелки и ССО', 'Mechanized & SOF']],
  arm: [['Конница', 'Cavalry'], ['Кирасиры и пушки', 'Cuirassiers & guns'], ['Первые танки', 'First tanks'], ['Средние танки', 'Medium tanks'], ['ОБТ и РСЗО', 'MBTs & MLRS']],
  air: [['Аэростаты', 'Balloons'], ['Бипланы', 'Biplanes'], ['Поршневая авиация', 'Prop aircraft'], ['Реактивная эра', 'Jet age'], ['Стелс и БПЛА', 'Stealth & drones']],
  nav: [['Галеры', 'Galleys'], ['Парусный флот', 'Age of sail'], ['Броненосцы', 'Ironclads'], ['Дредноуты', 'Dreadnoughts'], ['Авианосцы и АПЛ', 'Carriers & SSNs']],
  ind: [['Ремесло', 'Crafts'], ['Мануфактуры', 'Manufactories'], ['Фабрики', 'Factories'], ['Конвейер', 'Assembly line'], ['Автоматизация', 'Automation']],
  sci: [['Академии', 'Academies'], ['Университеты', 'Universities'], ['Научные общества', 'Learned societies'], ['НИИ и лаборатории', 'Research institutes'], ['Кибернетика и ИИ', 'Cybernetics & AI']],
}

export function researchCost(c: Country, branch: TechBranch): number {
  const next = (c.techTree[branch] ?? 0) + 1
  return Math.round(150 * Math.pow(1.9, next) * (0.6 + c.tech / 12))
}

export function canResearch(c: Country, branch: TechBranch, year: number): string | null {
  const tier = c.techTree[branch] ?? 0
  if (tier >= MAX_TIER) return 'max'
  // era gates: higher tiers need later years
  const need = [1850, 1900, 1935, 1960, 1990][tier] ?? 0
  if (year < need) return 'era'
  return null
}

// combat multipliers from the tree
export function techMods(c: Country) {
  const t = c.techTree
  return {
    armyAttack: 1 + (t.inf ?? 0) * 0.08 + (t.arm ?? 0) * 0.1,
    armyDefense: 1 + (t.inf ?? 0) * 0.1,
    airPower: (t.air ?? 0) * 0.15,
    navyPower: 1 + (t.nav ?? 0) * 0.15,
    industryGrowth: 1 + (t.ind ?? 0) * 0.1,
    scienceRate: 1 + (t.sci ?? 0) * 0.2,
  }
}

export function branchName(b: TechBranch, lang: Lang): string {
  return lang === 'ru' ? BRANCH_INFO[b].ru : BRANCH_INFO[b].en
}
