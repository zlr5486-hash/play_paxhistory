import type { GameState, Lang, Personality } from './types'
import { relOf, power } from './setup'
import { ideologyAffinity } from './engine'

export const chatKey = (a: string, b: string): string => [a, b].sort().join('|')

type Mood = 'warm' | 'neutral' | 'cold' | 'hostile'

function moodOf(state: GameState, from: string, to: string): Mood {
  const rel = relOf(state, from, to)
  const atWar = state.wars.some(w => !w.over && w.attackers.includes(from) !== w.attackers.includes(to) && (w.attackers.includes(from) || w.defenders.includes(from)))
  if (atWar) return 'hostile'
  if (rel > 30) return 'warm'
  if (rel > -10) return 'neutral'
  if (rel > -40) return 'cold'
  return 'hostile'
}

const pick = <T,>(arr: T[], rnd: () => number = Math.random): T => arr[Math.floor(rnd() * arr.length)]

// keyword detection (both languages)
type Intent = 'ally' | 'trade' | 'peace' | 'threat' | 'insult' | 'praise' | 'demand' | 'hello' | 'other'

function detectIntent(text: string): Intent {
  const s = text.toLowerCase()
  if (/(союз|альянс|союзник|alliance|allies)/.test(s)) return 'ally'
  if (/(торг|товар|сделк|эмбарго|trade|commerce|deal)/.test(s)) return 'trade'
  if (/(мир|перемир|прекрат.*войн|мирн|peace|truce|ceasefire)/.test(s)) return 'peace'
  if (/(гроз|предупрежд|пожале|арми|войск|сила|threat|warning|regret|army)/.test(s)) return 'threat'
  if (/(глуп|слаб|ничтож|смешн|дурак|stupid|weak|pathetic|fool)/.test(s)) return 'insult'
  if (/(велик|мудр|слав|уваж|дружб|брат|great|wise|glorious|respect|friend|brother)/.test(s)) return 'praise'
  if (/(треб|отдай|верни|уступ|верните|demand|return|cede|surrender|give)/.test(s)) return 'demand'
  if (/(привет|здравств|добрый|день|приветствую|hello|greetings|good day)/.test(s)) return 'hello'
  return 'other'
}

const T: Record<Lang, Record<Mood, Record<Intent, string[]>>> = {
  ru: {
    warm: {
      hello: ['Приветствуем друга нашего государства! Чем можем помочь?', 'Рады вас слышать. Отношения между нами крепки.'],
      ally: ['Мы высоко ценим вашу дружбу. Внесите предложение о союзе через дипломатическое окно — обсудим предметно.', 'Союз с вами был бы нам выгоден. Действуйте официально.'],
      trade: ['Торговля — кровь государств. Предлагайте торговый договор, мы рассмотрим его благосклонно.'],
      peace: ['Мы тоже устали от войны. Предложите мир официально — примем с достоинством.'],
      threat: ['Зачем угрожать друзьям? Мы предпочли бы решать дела миром.'],
      insult: ['Странные слова для друга. Мы сделаем вид, что не слышали.'],
      praise: ['Благодарим! Ваши слова приятны нашему двору.'],
      demand: ['С друзьями не разговаривают в таком тоне. Попросите вежливее.'],
      other: ['Мы внимательно слушаем. Продолжайте.', 'Интересные речи. Что вы предлагаете конкретно?'],
    },
    neutral: {
      hello: ['Приветствуем. Говорите, зачем пришли.', 'Добрый день. Наше время ограничено.'],
      ally: ['Союз — серьёзный шаг. Докажите сначала надёжность делами.', 'Возможно. Но сначала укрепит доверие.'],
      trade: ['Торговля выгодна обеим сторонам. Внесите предложение.'],
      peace: ['Война дорого обходится. Мы готовы слушать условия.'],
      threat: ['Угрозы? Запомните: мы умеем отвечать.', 'Не советую проверять наше терпение.'],
      insult: ['Осторожнее в выражениях. Мы всё запоминаем.'],
      praise: ['Лесть ничего не стоит, но мы ценим уважение.'],
      demand: ['Требовать может только сильнейший. Вы ли это?'],
      other: ['Слушаем.', 'Говорите по существу.'],
    },
    cold: {
      hello: ['Говорите быстро.', 'У нас мало причин говорить с вами.'],
      ally: ['Союз с вами? Вы шутите.', 'Не тратьте время.'],
      trade: ['Возможно, торговля смягчит наши отношения. Но на честных условиях.'],
      peace: ['Мир возможен, если вы признаете свои ошибки.'],
      threat: ['Ваши угрозы лишь укрепляют нашу решимость.', 'Мы не боимся.'],
      insult: ['Ваши слова записаны. Мы припомним.'],
      praise: ['Слишком поздно для лести.'],
      demand: ['Вы не в том положении, чтобы требовать.'],
      other: ['К чему эти речи?', 'Говорите или уходите.'],
    },
    hostile: {
      hello: ['Зачем вы пришли?', 'Нам не о чем говорить.'],
      ally: ['Никогда.', 'Смешно даже слышать.'],
      trade: ['С вами мы не торгуем.', 'Ваше предложение отвергнуто.'],
      peace: ['Мир? Только на наших условиях и через официальный канал.'],
      threat: ['Ваши угрозы ничтожны. Готовьтесь.', 'Пусть ваши армии говорят вместо вас.'],
      insult: ['Ваши оскорбления ускорят вашу гибель.'],
      praise: ['Лицемер.', 'Слишком поздно.'],
      demand: ['Требуйте у равных, если такие у вас остались.'],
      other: ['Каждое ваше слово против вас.', 'Хватит пустых слов.'],
    },
  },
  en: {
    warm: {
      hello: ['Greetings, friend of our state! How may we help?', 'Good to hear from you. Our ties are strong.'],
      ally: ['We value your friendship highly. Submit a formal alliance proposal and we shall discuss it.', 'An alliance with you could serve us well. Proceed formally.'],
      trade: ['Trade is the blood of nations. Offer a trade agreement; we shall look upon it favourably.'],
      peace: ['We too are weary of war. Offer peace formally and we shall accept with dignity.'],
      threat: ['Why threaten friends? We prefer to settle matters in peace.'],
      insult: ['Strange words for a friend. We shall pretend we did not hear.'],
      praise: ['Thank you! Your words please our court.'],
      demand: ['Friends do not speak in such tones. Ask politely.'],
      other: ['We are listening. Go on.', 'Interesting words. What do you propose, precisely?'],
    },
    neutral: {
      hello: ['Greetings. Say why you have come.', 'Good day. Our time is limited.'],
      ally: ['Alliance is a grave step. Prove your reliability by deeds first.', 'Perhaps. But trust must be earned.'],
      trade: ['Trade benefits both sides. Submit your proposal.'],
      peace: ['War costs dearly. We are willing to hear terms.'],
      threat: ['Threats? Remember: we know how to answer.', 'Do not test our patience.'],
      insult: ['Mind your language. We remember everything.'],
      praise: ['Flattery is worthless, but we value respect.'],
      demand: ['Only the stronger may demand. Are you that?'],
      other: ['We are listening.', 'Come to the point.'],
    },
    cold: {
      hello: ['Speak quickly.', 'We have little reason to talk with you.'],
      ally: ['Alliance with you? You jest.', 'Do not waste our time.'],
      trade: ['Perhaps trade could soften our relations. But on fair terms.'],
      peace: ['Peace is possible if you admit your mistakes.'],
      threat: ['Your threats only harden our resolve.', 'We are not afraid.'],
      insult: ['Your words are noted. We shall remember.'],
      praise: ['Too late for flattery.'],
      demand: ['You are in no position to make demands.'],
      other: ['Why these speeches?', 'Speak or leave.'],
    },
    hostile: {
      hello: ['Why have you come?', 'We have nothing to say to you.'],
      ally: ['Never.', 'Absurd to even hear.'],
      trade: ['We do not trade with you.', 'Your proposal is rejected.'],
      peace: ['Peace? Only on our terms, through formal channels.'],
      threat: ['Your threats are nothing. Prepare yourself.', 'Let your armies speak for you.'],
      insult: ['Your insults hasten your ruin.'],
      praise: ['Hypocrite.', 'Too late.'],
      demand: ['Demand of your equals, if any remain.'],
      other: ['Every word counts against you.', 'Enough empty words.'],
    },
  },
}

// personality seasoning appended sometimes
const SEASON: Record<Lang, Partial<Record<Personality, string[]>>> = {
  ru: {
    expansionist: ['Наша судьба — расти. Не стойте на пути.', 'Земли много не бывает.'],
    diplomat: ['Дипломатия сильнее пушек. Всегда.', 'Стол переговоров лучше поля боя.'],
    merchant: ['Прибыль превыше всего. Что вы можете предложить?', 'Золото решает всё.'],
    militarist: ['Сила — единственный аргумент, который уважают.', 'Наша армия скучает без дела.'],
    isolationist: ['Не вмешивайтесь в наши дела, и мы не тронем ваши.', 'Нам достаточно своих земель.'],
    opportunist: ['Мы всегда на стороне победителя. Помните об этом.', 'Момент решает всё.'],
    cautious: ['Семь раз отмерь — один отрежь.', 'Мы не рискуем без нужды.'],
    zealot: ['Наши идеалы не продаются.', 'История рассудит нас.'],
  },
  en: {
    expansionist: ['Our destiny is to grow. Do not stand in the way.', 'There is never too much land.'],
    diplomat: ['Diplomacy is stronger than cannons. Always.', 'The table beats the battlefield.'],
    merchant: ['Profit above all. What can you offer?', 'Gold decides everything.'],
    militarist: ['Force is the only argument respected.', 'Our army grows restless.'],
    isolationist: ['Do not meddle in our affairs and we shall not touch yours.', 'Our own lands suffice.'],
    opportunist: ['We always side with the winner. Remember that.', 'The moment decides everything.'],
    cautious: ['Measure seven times, cut once.', 'We take no needless risks.'],
    zealot: ['Our ideals are not for sale.', 'History will judge us.'],
  },
}

export function sendChat(state: GameState, from: string, to: string, text: string): string {
  const a = state.countries[from], b = state.countries[to]
  if (!a || !b) return ''
  const lang = state.lang
  const mood = moodOf(state, to, from) // how THEY feel about US
  const intent = detectIntent(text)
  const pool = T[lang][mood][intent]
  let reply = pick(pool)
  // personality seasoning 40%
  if (Math.random() < 0.4) {
    const seas = SEASON[lang][b.personality]
    if (seas) reply += ' ' + pick(seas)
  }
  // ideology friction note
  if (ideologyAffinity(a.ideology, b.ideology) <= -15 && Math.random() < 0.35) {
    reply += lang === 'ru' ? ' И не забывайте: наш строй вам не по душе.' : ' And remember: your system offends us.'
  }
  // power talk when threatened back
  if (intent === 'threat' && power(b) > power(a) * 1.3) {
    reply += lang === 'ru' ? ' Наша мощь говорит сама за себя.' : ' Our power speaks for itself.'
  }
  if (!state.chats) state.chats = {}
  const k = chatKey(from, to)
  if (!state.chats[k]) state.chats[k] = []
  state.chats[k].push({ from, text, month: state.month }, { from: to, text: reply, month: state.month })
  // chats can nudge relations slightly
  if (intent === 'praise' && mood !== 'hostile') b.relations[from] = (b.relations[from] ?? 0) + 2
  if (intent === 'insult') b.relations[from] = (b.relations[from] ?? 0) - 5
  return reply
}
