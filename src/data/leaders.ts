// Historical leaders per polity and year range: [fromYear, toYear, ru, en, trait]
type L = [number, number, string, string, string]
export const LEADERS: Record<string, L[]> = {
  RUS: [[1914, 1917, 'Николай II', 'Nicholas II', 'cautious'], [1917, 1924, 'В. Ленин', 'V. Lenin', 'zealot'], [1924, 1953, 'И. Сталин', 'J. Stalin', 'expansionist'], [1953, 1964, 'Н. Хрущёв', 'N. Khrushchev', 'opportunist'], [1964, 1982, 'Л. Брежнев', 'L. Brezhnev', 'cautious'], [1982, 1992, 'М. Горбачёв', 'M. Gorbachev', 'diplomat'], [1992, 2099, 'Президент РФ', 'RF President', 'cautious']],
  SOV: [[1917, 1924, 'В. Ленин', 'V. Lenin', 'zealot'], [1924, 1953, 'И. Сталин', 'J. Stalin', 'expansionist'], [1953, 1964, 'Н. Хрущёв', 'N. Khrushchev', 'opportunist'], [1964, 1982, 'Л. Брежнев', 'L. Brezhnev', 'cautious'], [1982, 1992, 'М. Горбачёв', 'M. Gorbachev', 'diplomat']],
  DEU: [[1914, 1918, 'Вильгельм II', 'Wilhelm II', 'militarist'], [1918, 1933, 'Президент Веймара', 'Weimar President', 'cautious'], [1933, 1945, 'А. Гитлер', 'A. Hitler', 'zealot'], [1945, 2099, 'Канцлер Германии', 'German Chancellor', 'diplomat']],
  GER_B: [[1800, 1918, 'Кайзер', 'The Kaiser', 'militarist'], [1918, 2099, 'Канцлер', 'Chancellor', 'diplomat']],
  USA: [[1914, 1921, 'В. Вильсон', 'W. Wilson', 'diplomat'], [1921, 1933, 'Г. Гувер', 'H. Hoover', 'merchant'], [1933, 1945, 'Ф. Рузвельт', 'F. Roosevelt', 'diplomat'], [1945, 1953, 'Г. Трумэн', 'H. Truman', 'cautious'], [1953, 1961, 'Д. Эйзенхауэр', 'D. Eisenhower', 'cautious'], [1961, 1963, 'Дж. Кеннеди', 'J. Kennedy', 'expansionist'], [1963, 1969, 'Л. Джонсон', 'L. Johnson', 'cautious'], [1969, 1974, 'Р. Никсон', 'R. Nixon', 'opportunist'], [1974, 1981, 'Дж. Форд / Дж. Картер', 'Ford / Carter', 'diplomat'], [1981, 1989, 'Р. Рейган', 'R. Reagan', 'militarist'], [1989, 1993, 'Дж. Буш ст.', 'G. H. W. Bush', 'cautious'], [1993, 2001, 'Б. Клинтон', 'B. Clinton', 'merchant'], [2001, 2009, 'Дж. Буш мл.', 'G. W. Bush', 'militarist'], [2009, 2017, 'Б. Обама', 'B. Obama', 'diplomat'], [2017, 2021, 'Дж. Трамп', 'D. Trump', 'opportunist'], [2021, 2099, 'Президент США', 'US President', 'cautious']],
  GBR: [[1914, 1922, 'Д. Ллойд Джордж', 'D. Lloyd George', 'diplomat'], [1922, 1940, 'Н. Чемберлен', 'N. Chamberlain', 'cautious'], [1940, 1945, 'У. Черчилль', 'W. Churchill', 'militarist'], [1945, 1951, 'К. Эттли', 'C. Attlee', 'diplomat'], [1951, 1955, 'У. Черчилль', 'W. Churchill', 'militarist'], [1955, 1963, 'Макмиллан', 'Macmillan', 'cautious'], [1963, 1979, 'Вильсон / Хит', 'Wilson / Heath', 'cautious'], [1979, 1990, 'М. Тэтчер', 'M. Thatcher', 'militarist'], [1990, 1997, 'Дж. Мейджор', 'J. Major', 'cautious'], [1997, 2007, 'Т. Блэр', 'T. Blair', 'diplomat'], [2007, 2099, 'Премьер-министр', 'Prime Minister', 'cautious']],
  GBR_B: [[1800, 1945, 'Британская корона', 'British Crown', 'merchant'], [1945, 2099, 'Премьер-министр', 'Prime Minister', 'cautious']],
  FRA: [[1914, 1940, 'Французская республика', 'French Republic', 'cautious'], [1940, 1944, 'Ш. де Голль (Св. Франция)', 'De Gaulle', 'militarist'], [1944, 1958, 'IV Республика', 'Fourth Republic', 'cautious'], [1958, 1969, 'Ш. де Голль', 'C. de Gaulle', 'expansionist'], [1969, 2099, 'Президент Франции', 'French President', 'diplomat']],
  FRA_B: [[1800, 1940, 'Французская республика', 'French Republic', 'expansionist'], [1940, 2099, 'Президент Франции', 'French President', 'diplomat']],
  ITA: [[1914, 1922, 'Король Италии', 'King of Italy', 'cautious'], [1922, 1943, 'Б. Муссолини', 'B. Mussolini', 'opportunist'], [1943, 2099, 'Итальянская республика', 'Italian Republic', 'diplomat']],
  ITA_B: [[1800, 1943, 'Итальянская корона', 'Italian Crown', 'opportunist'], [1943, 2099, 'Республика', 'Republic', 'diplomat']],
  JPN: [[1914, 1926, 'Имп. Тайсё', 'Emperor Taisho', 'cautious'], [1926, 1945, 'Имп. Сёва', 'Emperor Showa', 'militarist'], [1945, 2099, 'Премьер Японии', 'Japanese PM', 'merchant']],
  JPN_B: [[1800, 1945, 'Японская империя', 'Empire of Japan', 'militarist'], [1945, 2099, 'Премьер Японии', 'Japanese PM', 'merchant']],
  CHN: [[1914, 1928, 'Эра милитаристов', 'Warlord Era', 'opportunist'], [1928, 1949, 'Чан Кайши', 'Chiang Kai-shek', 'cautious'], [1949, 1976, 'Мао Цзэдун', 'Mao Zedong', 'zealot'], [1976, 1989, 'Дэн Сяопин', 'Deng Xiaoping', 'merchant'], [1989, 2099, 'Председатель КНР', 'PRC President', 'merchant']],
  QNG: [[1600, 1912, 'Император Цин', 'Qing Emperor', 'isolationist'], [1912, 2099, 'Лидер Китая', 'Chinese Leader', 'merchant']],
  IND: [[1947, 1964, 'Дж. Неру', 'J. Nehru', 'diplomat'], [1964, 1984, 'И. Ганди', 'I. Gandhi', 'cautious'], [1984, 1989, 'Р. Ганди', 'R. Gandhi', 'cautious'], [1989, 2014, 'Эра коалиций', 'Coalition Era', 'cautious'], [2014, 2099, 'Премьер Индии', 'Indian PM', 'expansionist']],
  TUR: [[1914, 1922, 'Султан', 'The Sultan', 'cautious'], [1922, 1938, 'М. Кемаль Ататюрк', 'Atatürk', 'diplomat'], [1938, 2003, 'Турецкая республика', 'Turkish Republic', 'cautious'], [2003, 2099, 'Президент Турции', 'Turkish President', 'expansionist']],
  OTT: [[1299, 1922, 'Османский султан', 'Ottoman Sultan', 'cautious'], [1922, 2099, 'Лидер Турции', 'Turkish Leader', 'cautious']],
  ESP: [[1914, 1931, 'Альфонсо XIII', 'Alfonso XIII', 'cautious'], [1931, 1936, 'II Республика', 'Second Republic', 'cautious'], [1936, 1975, 'Ф. Франко', 'F. Franco', 'militarist'], [1975, 2099, 'Король Испании', 'King of Spain', 'diplomat']],
  SPA_B: [[1400, 1931, 'Испанская корона', 'Spanish Crown', 'cautious'], [1931, 2099, 'Испания', 'Spain', 'cautious']],
  AUT: [[1914, 1918, 'Франц Иосиф', 'Franz Joseph', 'cautious'], [1918, 2099, 'Австрийская республика', 'Austrian Republic', 'diplomat']],
  AUH: [[1800, 1918, 'Франц Иосиф', 'Franz Joseph', 'cautious'], [1918, 2099, 'Лидер Австрии', 'Austrian Leader', 'diplomat']],
  POL: [[1914, 1935, 'Ю. Пилсудский', 'J. Piłsudski', 'militarist'], [1935, 1945, 'Президент Польши', 'Polish President', 'cautious'], [1945, 1989, 'ПНР', 'Polish PR', 'communist' as never], [1989, 2099, 'Польская республика', 'Polish Republic', 'cautious']],
  UKR: [[1991, 2099, 'Президент Украины', 'Ukrainian President', 'cautious']],
  BRA: [[1930, 1945, 'Ж. Варгас', 'G. Vargas', 'opportunist'], [1945, 2099, 'Президент Бразилии', 'Brazilian President', 'merchant']],
  ARG: [[1946, 1955, 'Х. Перон', 'J. Perón', 'opportunist'], [1955, 2099, 'Президент Аргентины', 'Argentine President', 'cautious']],
  MEX: [[1914, 1920, 'В. Карранса', 'V. Carranza', 'cautious'], [1920, 2099, 'Президент Мексики', 'Mexican President', 'cautious']],
  EGY: [[1914, 1952, 'Король Египта', 'King of Egypt', 'cautious'], [1952, 1970, 'Г. Насер', 'G. Nasser', 'expansionist'], [1970, 1981, 'А. Садат', 'A. Sadat', 'diplomat'], [1981, 2099, 'Президент Египта', 'Egyptian President', 'cautious']],
  SAU: [[1932, 1953, 'Ибн Сауд', 'Ibn Saud', 'expansionist'], [1953, 2099, 'Король Саудовской Аравии', 'Saudi King', 'cautious']],
  IRN: [[1914, 1979, 'Пехлеви', 'Pahlavi Shah', 'modernist' as never], [1979, 2099, 'Верховный лидер', 'Supreme Leader', 'zealot']],
  SAF_D: [[1500, 1736, 'Шах Персии', 'Shah of Persia', 'cautious'], [1736, 2099, 'Лидер Ирана', 'Iranian Leader', 'zealot']],
  IRQ: [[1921, 1958, 'Король Ирака', 'King of Iraq', 'cautious'], [1958, 1979, 'Иракская республика', 'Iraqi Republic', 'militarist'], [1979, 2003, 'С. Хусейн', 'S. Hussein', 'militarist'], [2003, 2099, 'Ирак', 'Iraq', 'cautious']],
  ROM: [[-500, 300, 'Император Рима', 'Roman Emperor', 'expansionist'], [300, 2099, 'Рим', 'Rome', 'expansionist']],
  HAN: [[-200, 300, 'Император Хань', 'Han Emperor', 'cautious'], [300, 2099, 'Лидер', 'Leader', 'cautious']],
  BYZ: [[300, 1453, 'Василевс', 'Basileus', 'diplomat'], [1453, 2099, 'Лидер', 'Leader', 'diplomat']],
  KOR: [[1948, 2099, 'Президент Кореи', 'ROK President', 'merchant']],
  PRK: [[1948, 1994, 'Ким Ир Сен', 'Kim Il-sung', 'zealot'], [1994, 2011, 'Ким Чен Ир', 'Kim Jong-il', 'zealot'], [2011, 2099, 'Ким Чен Ын', 'Kim Jong-un', 'zealot']],
  CUB: [[1959, 2008, 'Ф. Кастро', 'F. Castro', 'zealot'], [2008, 2099, 'Лидер Кубы', 'Cuban Leader', 'cautious']],
  YUG: [[1945, 1980, 'И. Б. Тито', 'J. B. Tito', 'diplomat'], [1980, 1992, 'Президиум СФРЮ', 'SFRY Presidency', 'cautious'], [1992, 2099, 'Лидер', 'Leader', 'cautious']],
  CSK: [[1918, 1935, 'Т. Масарик', 'T. Masaryk', 'diplomat'], [1935, 1948, 'Э. Бенеш', 'E. Beneš', 'cautious'], [1948, 1989, 'КСЧ', 'Czechoslovak CP', 'communist' as never], [1989, 1992, 'В. Гавел', 'V. Havel', 'diplomat'], [1992, 2099, 'Лидер', 'Leader', 'diplomat']],
  NLD: [[1800, 2099, 'Нидерланды', 'Netherlands', 'merchant']],
  NLD_B: [[1600, 2099, 'Нидерланды', 'Netherlands', 'merchant']],
  BEL: [[1830, 2099, 'Бельгия', 'Belgium', 'cautious']],
  BEL_B: [[1830, 2099, 'Бельгия', 'Belgium', 'cautious']],
  POR: [[1932, 1968, 'А. Салазар', 'A. Salazar', 'isolationist'], [1968, 2099, 'Португалия', 'Portugal', 'diplomat']],
  POR_B: [[1400, 1932, 'Португальская корона', 'Portuguese Crown', 'merchant'], [1932, 2099, 'Португалия', 'Portugal', 'diplomat']],
  SWE: [[1914, 2099, 'Швеция', 'Sweden', 'diplomat']],
  SWE_B: [[1500, 1809, 'Шведская корона', 'Swedish Crown', 'militarist'], [1809, 2099, 'Швеция', 'Sweden', 'diplomat']],
  DNK: [[1800, 2099, 'Дания', 'Denmark', 'cautious']],
  DNK_B: [[1800, 2099, 'Дания', 'Denmark', 'cautious']],
  NOR: [[1905, 2099, 'Норвегия', 'Norway', 'diplomat']],
  FIN: [[1918, 1946, 'К. Маннергейм', 'C. Mannerheim', 'militarist'], [1946, 2099, 'Финляндия', 'Finland', 'cautious']],
  CHE: [[1800, 2099, 'Федеральный совет', 'Federal Council', 'isolationist']],
  GRC: [[1914, 1974, 'Греция', 'Greece', 'cautious'], [1974, 2099, 'Греческая республика', 'Hellenic Republic', 'diplomat']],
  HUN: [[1918, 1944, 'Хорти', 'Horthy', 'militarist'], [1944, 1989, 'ВСРП', 'Hungarian CP', 'cautious'], [1989, 2099, 'Венгрия', 'Hungary', 'cautious']],
  ROU: [[1914, 1947, 'Румынская корона', 'Romanian Crown', 'opportunist'], [1947, 1989, 'Чаушеску и КП', 'Ceaușescu & CP', 'cautious'], [1989, 2099, 'Румыния', 'Romania', 'cautious']],
  BGR: [[1914, 1946, 'Болгарская корона', 'Bulgarian Crown', 'opportunist'], [1946, 1989, 'БКП', 'Bulgarian CP', 'cautious'], [1989, 2099, 'Болгария', 'Bulgaria', 'cautious']],
  SRB: [[1914, 1918, 'Пётр I Карагеоргиевич', 'Peter I', 'militarist'], [1918, 2099, 'Сербия', 'Serbia', 'cautious']],
  PAK: [[1947, 1958, 'Джинна', 'Jinnah', 'cautious'], [1958, 1969, 'Аюб Хан', 'Ayub Khan', 'militarist'], [1969, 2099, 'Пакистан', 'Pakistan', 'cautious']],
  AFG: [[1914, 1973, 'Афганская монархия', 'Afghan Monarchy', 'isolationist'], [1973, 1978, 'Дауд', 'Daoud', 'cautious'], [1978, 1992, 'НДПА', 'PDPA', 'zealot'], [1992, 2099, 'Афганистан', 'Afghanistan', 'zealot']],
  ETH: [[1914, 1974, 'Хайле Селассие', 'Haile Selassie', 'cautious'], [1974, 1991, 'Менгисту', 'Mengistu', 'zealot'], [1991, 2099, 'Эфиопия', 'Ethiopia', 'cautious']],
  VNM: [[1945, 1969, 'Хо Ши Мин', 'Ho Chi Minh', 'zealot'], [1969, 2099, 'Вьетнам', 'Vietnam', 'merchant']],
  IDN: [[1945, 1967, 'Сукарно', 'Sukarno', 'expansionist'], [1967, 1998, 'Сухарто', 'Suharto', 'militarist'], [1998, 2099, 'Индонезия', 'Indonesia', 'cautious']],
  NLD_I: [[1600, 2099, 'Нидерланды', 'Netherlands', 'merchant']],
  KAZ: [[1991, 2019, 'Н. Назарбаев', 'N. Nazarbayev', 'cautious'], [2019, 2099, 'Казахстан', 'Kazakhstan', 'cautious']],
  BLR: [[1991, 2099, 'Беларусь', 'Belarus', 'cautious']],
}

export function leaderFor(polityId: string, year: number, fallbackPersonality: string): { name: string; trait: string } {
  const list = LEADERS[polityId]
  if (list) {
    for (const [a, b, ru, en, tr] of list) if (year >= a && year <= b) return { name: ru, trait: tr }
    const last = list[list.length - 1]
    if (year > last[1]) return { name: last[2], trait: last[4] }
    const first = list[0]
    return { name: first[2], trait: first[4] }
  }
  return { name: '', trait: fallbackPersonality }
}
