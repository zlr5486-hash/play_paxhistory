import type { Lang } from './sim/types'

type Dict = Record<string, { ru: string; en: string }>

export const STR: Dict = {
  // ---- general ----
  game_title: { ru: 'PAX MUNDI', en: 'PAX MUNDI' },
  game_subtitle: { ru: 'Гранд-стратегия альтернативной истории', en: 'Alternate-history grand strategy' },
  new_game: { ru: 'Новая игра', en: 'New Game' },
  continue: { ru: 'Продолжить', en: 'Continue' },
  start: { ru: 'Начать', en: 'Start' },
  back: { ru: 'Назад', en: 'Back' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  confirm: { ru: 'Подтвердить', en: 'Confirm' },
  settings: { ru: 'Настройки', en: 'Settings' },
  language: { ru: 'Язык', en: 'Language' },
  save: { ru: 'Сохранить', en: 'Save' },
  load: { ru: 'Загрузить', en: 'Load' },
  saved: { ru: 'Сохранено', en: 'Saved' },
  loaded: { ru: 'Загружено', en: 'Loaded' },
  no_saves: { ru: 'Нет сохранений', en: 'No saves' },
  main_menu: { ru: 'Главное меню', en: 'Main menu' },
  game_over: { ru: 'Игра окончена', en: 'Game Over' },
  game_over_text: { ru: 'Ваша нация уничтожена. История не пощадила вас.', en: 'Your nation has been destroyed. History showed no mercy.' },
  to_menu: { ru: 'В меню', en: 'To menu' },
  difficulty: { ru: 'Сложность', en: 'Difficulty' },
  diff_0: { ru: 'Легендарно легко', en: 'Legendary' },
  diff_1: { ru: 'Легко', en: 'Easy' },
  diff_2: { ru: 'Нормально', en: 'Normal' },
  diff_3: { ru: 'Сложно', en: 'Hard' },
  diff_4: { ru: 'Невозможно', en: 'Impossible' },

  // ---- setup ----
  choose_era: { ru: 'Выберите эпоху', en: 'Choose an era' },
  choose_country: { ru: 'Выберите державу', en: 'Choose your nation' },
  choose_country_hint: { ru: 'Найдите в списке или кликните по карте', en: 'Search the list or click the map' },
  search: { ru: 'Поиск...', en: 'Search...' },
  regions: { ru: 'Регионы', en: 'Regions' },
  population: { ru: 'Население', en: 'Population' },
  industry: { ru: 'Индустрия', en: 'Industry' },
  tech: { ru: 'Технологии', en: 'Technology' },
  government: { ru: 'Правительство', en: 'Government' },
  personality: { ru: 'Характер', en: 'Personality' },
  start_game: { ru: 'Начать игру', en: 'Start Game' },
  pick_country_first: { ru: 'Сначала выберите державу', en: 'Pick a nation first' },

  // ---- government types ----
  gov_monarchy: { ru: 'Монархия', en: 'Monarchy' },
  gov_empire: { ru: 'Империя', en: 'Empire' },
  gov_republic: { ru: 'Республика', en: 'Republic' },
  gov_democracy: { ru: 'Демократия', en: 'Democracy' },
  gov_theocracy: { ru: 'Теократия', en: 'Theocracy' },
  gov_tribal: { ru: 'Племенной строй', en: 'Tribal' },
  gov_federation: { ru: 'Федерация', en: 'Federation' },
  gov_communist: { ru: 'Коммунизм', en: 'Communist state' },
  gov_junta: { ru: 'Хунта', en: 'Junta' },
  gov_oligarchy: { ru: 'Олигархия', en: 'Oligarchy' },

  // ---- personalities ----
  per_expansionist: { ru: 'Экспансионист', en: 'Expansionist' },
  per_diplomat: { ru: 'Дипломат', en: 'Diplomat' },
  per_merchant: { ru: 'Торговец', en: 'Merchant' },
  per_militarist: { ru: 'Милитарист', en: 'Militarist' },
  per_isolationist: { ru: 'Изоляционист', en: 'Isolationist' },
  per_opportunist: { ru: 'Оппортунист', en: 'Opportunist' },
  per_cautious: { ru: 'Осторожный', en: 'Cautious' },
  per_zealot: { ru: 'Фанатик', en: 'Zealot' },

  // ---- top bar ----
  treasury: { ru: 'Казна', en: 'Treasury' },
  income: { ru: 'Доход', en: 'Income' },
  stability: { ru: 'Стабильность', en: 'Stability' },
  war_support: { ru: 'Военная поддержка', en: 'War support' },
  divisions: { ru: 'Дивизии', en: 'Divisions' },
  navy: { ru: 'Флот', en: 'Navy' },
  reputation: { ru: 'Репутация', en: 'Reputation' },
  advance: { ru: 'Ход вперёд', en: 'Advance time' },
  month_1: { ru: '1 месяц', en: '1 month' },
  month_3: { ru: '3 месяца', en: '3 months' },
  month_6: { ru: 'Полгода', en: '6 months' },
  month_12: { ru: '1 год', en: '1 year' },

  // ---- panels ----
  events: { ru: 'События', en: 'Events' },
  treaties: { ru: 'Договоры', en: 'Treaties' },
  advisor: { ru: 'Советник', en: 'Advisor' },
  actions: { ru: 'Действия', en: 'Actions' },
  diplomacy: { ru: 'Дипломатия', en: 'Diplomacy' },
  registry_title: { ru: 'Реестр договоров', en: 'Treaty Registry' },
  registry_empty: { ru: 'Договоров пока нет. Заключите первый!', en: 'No treaties yet. Sign your first one!' },
  party: { ru: 'Стороны', en: 'Parties' },
  type: { ru: 'Тип', en: 'Type' },
  signed: { ru: 'Подписан', en: 'Signed' },
  status: { ru: 'Статус', en: 'Status' },
  active: { ru: 'Действует', en: 'Active' },
  broken: { ru: 'Нарушен', en: 'Broken' },
  expired: { ru: 'Истёк', en: 'Expired' },
  superseded: { ru: 'Заменён', en: 'Superseded' },
  break_treaty: { ru: 'Нарушить', en: 'Break' },
  break_treaty_warn: { ru: 'Нарушение договора ударит по репутации (−15) и отношениям (−35).', en: 'Breaking a treaty hits reputation (−15) and relations (−35).' },

  // ---- treaty types ----
  tt_nap: { ru: 'Пакт о ненападении', en: 'Non-aggression pact' },
  tt_alliance: { ru: 'Союз', en: 'Alliance' },
  tt_trade: { ru: 'Торговое соглашение', en: 'Trade agreement' },
  tt_guarantee: { ru: 'Гарантия независимости', en: 'Guarantee of independence' },
  tt_vassal: { ru: 'Вассалитет', en: 'Vassalization' },
  tt_peace: { ru: 'Мирный договор', en: 'Peace treaty' },

  // ---- diplomacy actions ----
  relations: { ru: 'Отношения', en: 'Relations' },
  improve_relations: { ru: 'Улучшить отношения (−50💰)', en: 'Improve relations (−50💰)' },
  propose: { ru: 'Предложить договор', en: 'Propose treaty' },
  demand_region: { ru: 'Требовать регион', en: 'Demand region' },
  declare_war: { ru: 'Объявить войну', en: 'Declare war' },
  offer_peace: { ru: 'Предложить мир', en: 'Offer peace' },
  at_war: { ru: 'В состоянии войны', en: 'At war' },
  our_treaties: { ru: 'Наши договоры', en: 'Our treaties' },
  accepted: { ru: 'Принято!', en: 'Accepted!' },
  refused: { ru: 'Отказ.', en: 'Refused.' },
  hesitant: { ru: 'Колеблются... Отказ.', en: 'They hesitated... Refused.' },
  war_confirm: { ru: 'Объявить войну', en: 'Declare war on' },
  war_confirm_text: { ru: 'Войну нельзя отменить миром в первый же день. Уверены?', en: 'War cannot be undone on day one. Are you sure?' },

  // ---- actions ----
  invest: { ru: 'Инвестировать в промышленность', en: 'Invest in industry' },
  invest_hint: { ru: '15% казны → рост индустрии', en: '15% of treasury → industry growth' },
  research: { ru: 'Научные исследования', en: 'Research' },
  research_hint: { ru: '+0.15 технологий', en: '+0.15 tech' },
  propaganda: { ru: 'Пропаганда', en: 'Propaganda' },
  propaganda_hint: { ru: '+8 воен. поддержки, +4 стабильности', en: '+8 war support, +4 stability' },
  army_up: { ru: 'Призвать 5 дивизий', en: 'Raise 5 divisions' },
  navy_up: { ru: 'Построить 2 корабля', en: 'Build 2 ships' },
  stabilize: { ru: 'Укрепить порядок', en: 'Restore order' },
  stabilize_hint: { ru: '+10 стабильности', en: '+10 stability' },
  tax_rate: { ru: 'Налоги', en: 'Tax rate' },
  invest_rate: { ru: 'Инвестиции', en: 'Investment' },
  decree: { ru: 'Указ (свободная форма)', en: 'Decree (free text)' },
  decree_hint: { ru: 'Опишите свои намерения — игра преобразует их в действия', en: 'Describe your intent — the game turns it into actions' },
  decree_go: { ru: 'Издать указ', en: 'Issue decree' },
  decree_empty: { ru: 'Напишите указ.', en: 'Write a decree first.' },
  decree_parsed: { ru: 'Указ принят: {n} распоряжений будет исполнено при следующем ходе.', en: 'Decree accepted: {n} orders will be executed next turn.' },
  decree_narrative: { ru: 'Нарратив ИИ', en: 'AI narrative' },
  queued_orders: { ru: 'Запланировано на ход', en: 'Queued for next turn' },
  no_funds: { ru: 'Недостаточно средств', en: 'Not enough funds' },

  // ---- advisor ----
  adv_threats: { ru: 'Угрозы', en: 'Threats' },
  adv_opportunities: { ru: 'Возможности', en: 'Opportunities' },
  adv_economy: { ru: 'Экономика', en: 'Economy' },
  adv_diplo: { ru: 'Дипломатия', en: 'Diplomacy' },
  adv_no_threats: { ru: 'Серьёзных угроз не обнаружено.', en: 'No serious threats detected.' },
  adv_no_opps: { ru: 'Явных возможностей нет — укрепляйте экономику.', en: 'No obvious opportunities — strengthen your economy.' },
  adv_threat_line: { ru: '{name}: мощь {ratio}× вашей, отношения {rel}', en: '{name}: power {ratio}× yours, relations {rel}' },
  adv_opp_line: { ru: '{name}: слабее вас в {ratio} раз, отношения {rel}', en: '{name}: {ratio}× weaker than you, relations {rel}' },
  adv_econ_deficit: { ru: 'Бюджет в дефиците! Снизьте налоги или армию.', en: 'Budget in deficit! Cut taxes or military.' },
  adv_econ_surplus: { ru: 'Профицит {n}/мес. Инвестируйте или стройте армию.', en: 'Surplus {n}/mo. Invest or build up the army.' },
  adv_low_stab: { ru: 'Стабильность опасно низка — риск восстаний!', en: 'Stability dangerously low — rebellion risk!' },
  adv_treaty_suggest: { ru: 'Совет: предложите пакт о ненападении: {name}', en: 'Tip: propose a non-aggression pact to {name}' },
  adv_alliance_suggest: { ru: 'Совет: союз с {name} против общего врага возможен', en: 'Tip: an alliance with {name} against a common foe is possible' },

  // ---- events ----
  ev_game_start: { ru: 'Новая эпоха. Год {year}. История в ваших руках.', en: 'A new era begins. Year {year}. History is in your hands.' },
  ev_war_declared: { ru: '⚔️ {a} объявляет войну {b}!', en: '⚔️ {a} declares war on {b}!' },
  ev_ally_joins: { ru: '{ally} вступает в войну на стороне {for} (союз)', en: '{ally} joins the war on the side of {for} (alliance)' },
  ev_guarantee_honored: { ru: '{ally} выполняет гарантии независимости {for}', en: '{ally} honors the guarantee of {for}' },
  ev_region_occupied: { ru: '🔥 Войска {by} занимают регион', en: '🔥 Forces of {by} occupy a region' },
  ev_region_liberated: { ru: '🛡️ {by} освобождает оккупированный регион', en: '🛡️ {by} liberates an occupied region' },
  ev_capitulation: { ru: '🏳️ {loser} капитулирует перед {winner}. Уступлено регионов: {ceded}', en: '🏳️ {loser} capitulates to {winner}. Regions ceded: {ceded}' },
  ev_nation_destroyed: { ru: '💀 {loser} уничтожена и поглощена державой {winner}', en: '💀 {loser} has been destroyed and absorbed by {winner}' },
  ev_peace_refused: { ru: '{a} отвергает мирное предложение {b}', en: '{a} rejects the peace offer from {b}' },
  ev_treaty_signed: { ru: '✒️ Подписан договор: {a} и {b}', en: '✒️ Treaty signed: {a} and {b}' },
  ev_treaty_rejected: { ru: '{a} отклоняет предложение {b}', en: '{a} rejects the proposal from {b}' },
  ev_treaty_broken: { ru: '💔 {a} нарушает договор с {b}! Доверие подорвано.', en: '💔 {a} breaks the treaty with {b}! Trust shattered.' },
  ev_treaty_expired: { ru: 'Договор между {a} и {b} истёк', en: 'Treaty between {a} and {b} has expired' },
  ev_relations_improved: { ru: '🤝 {a} улучшает отношения с {b}', en: '🤝 {a} improves relations with {b}' },
  ev_decree_narrative: { ru: '📖 {text}', en: '📖 {text}' },
  ev_rebellion: { ru: '🏴 Восстание в {country}! Регион провозглашает независимость: {new}', en: '🏴 Rebellion in {country}! A region declares independence: {new}' },
  ev_plague: { ru: '☠️ Эпидемия в {country}. Население и стабильность падают.', en: '☠️ Plague in {country}. Population and stability fall.' },
  ev_player_destroyed: { ru: '💀 Ваша страна {country} стёрта с карты мира.', en: '💀 Your nation {country} has been erased from the map.' },
  ev_no_funds: { ru: 'Казна пуста! Нужно {need}💰', en: 'Treasury empty! Need {need}💰' },
  ev_invest: { ru: '🏭 Инвестиции в промышленность ({amount}💰)', en: '🏭 Industry investment ({amount}💰)' },
  ev_research: { ru: '🔬 Научный прорыв! Технологии: {tech}', en: '🔬 Scientific breakthrough! Tech: {tech}' },
  ev_propaganda: { ru: '📣 Пропагандистская кампания в {country}', en: '📣 Propaganda campaign in {country}' },
  ev_army: { ru: '🪖 Призвано {n} дивизий (всего {div})', en: '🪖 {n} divisions raised (total {div})' },
  ev_navy: { ru: '⚓ Построено {n} корабля (флот: {navy})', en: '⚓ {n} ships built (navy: {navy})' },
  ev_stabilize: { ru: '⚖️ Порядок в {country} укреплён', en: '⚖️ Order restored in {country}' },

  // ---- map ----
  owned_by: { ru: 'Владелец', en: 'Owner' },
  your_country: { ru: 'Ваша страна', en: 'Your country' },
  occupied: { ru: 'Оккупирован', en: 'Occupied' },
  zoom_hint: { ru: 'Колесо — масштаб, перетаскивание — перемещение', en: 'Wheel to zoom, drag to pan' },

  // ---- settings / AI ----
  ai_settings: { ru: 'ИИ-нарратив (опционально)', en: 'AI narrative (optional)' },
  ai_key_label: { ru: 'API-ключ (OpenRouter / OpenAI-совместимый)', en: 'API key (OpenRouter / OpenAI-compatible)' },
  ai_endpoint: { ru: 'Эндпоинт', en: 'Endpoint' },
  ai_model: { ru: 'Модель', en: 'Model' },
  ai_note: { ru: 'Без ключа игра полностью работает на встроенном движке.', en: 'Without a key the game runs fully on the built-in engine.' },
  ai_save: { ru: 'Сохранить настройки ИИ', en: 'Save AI settings' },
}

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const entry = STR[key]
  let s = entry ? entry[lang] : key
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll('{' + k + '}', String(v))
  return s
}

export const TREATY_KEYS: Record<string, string> = {
  nap: 'tt_nap', alliance: 'tt_alliance', trade: 'tt_trade',
  guarantee: 'tt_guarantee', vassal: 'tt_vassal', peace: 'tt_peace',
}
export const GOV_KEYS: Record<string, string> = {
  monarchy: 'gov_monarchy', empire: 'gov_empire', republic: 'gov_republic', democracy: 'gov_democracy',
  theocracy: 'gov_theocracy', tribal: 'gov_tribal', federation: 'gov_federation', communist: 'gov_communist',
  junta: 'gov_junta', oligarchy: 'gov_oligarchy',
}
export const PER_KEYS: Record<string, string> = {
  expansionist: 'per_expansionist', diplomat: 'per_diplomat', merchant: 'per_merchant',
  militarist: 'per_militarist', isolationist: 'per_isolationist', opportunist: 'per_opportunist',
  cautious: 'per_cautious', zealot: 'per_zealot',
}
