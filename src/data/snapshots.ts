// Era snapshots: regionId -> owner polity id. Unlisted regions are independent,
// auto-generated countries. Snapshot is chosen by nearest year <= selected year.

export interface Snapshot {
  year: number
  labelRu: string
  labelEn: string
  descRu: string
  descEn: string
  owners: Record<string, string>
}

const OWN_117: Record<string, string> = {
  // Roman Empire at Trajan's peak
  PRT: 'ROM', ESP: 'ROM', FRA: 'ROM', GBR: 'ROM', BEL: 'ROM', LUX: 'ROM', NLD: 'ROM', ITA: 'ROM',
  CHE: 'ROM', AUT: 'ROM', SVN: 'ROM', HRV: 'ROM', BIH: 'ROM', SRB: 'ROM', MNE: 'ROM', MKD: 'ROM',
  ALB: 'ROM', GRC: 'ROM', BGR: 'ROM', ROU: 'ROM', TUR: 'ROM', SYR: 'ROM', LBN: 'ROM', ISR: 'ROM',
  PSE: 'ROM', JOR: 'ROM', EGY: 'ROM', LBY: 'ROM', TUN: 'ROM', DZA: 'ROM', MAR: 'ROM', CYP: 'ROM', NCY: 'ROM',
  // Parthia
  IRN: 'PARTH', IRQ: 'PARTH', TKM: 'PARTH', AFG: 'PARTH',
  // Han
  CHN: 'HAN', VNM: 'HAN',
  // Kushan / Xiongnu / Aksum
  PAK: 'KUSH', TJK: 'KUSH', UZB: 'KUSH',
  MNG: 'XION', KAZ: 'XION', KGZ: 'XION',
  ETH: 'AKS', ERI: 'AKS', SDN: 'AKS', DJI: 'AKS', SOM: 'AKS',
}

const OWN_1100: Record<string, string> = {
  BYZ: 'BYZ' as never, // placeholder, BYZ owns regions below
  GRC: 'BYZ', TUR: 'BYZ', CYP: 'BYZ', NCY: 'BYZ',
  // Holy Roman Empire
  DEU: 'HRE', AUT: 'HRE', CHE: 'HRE', CZE: 'HRE', SVN: 'HRE', NLD: 'HRE', BEL: 'HRE', LUX: 'HRE',
  ITA: 'HRE',
  // Seljuks
  IRQ: 'SEL', SYR: 'SEL', IRN: 'SEL', TKM: 'SEL', UZB: 'SEL', AFG: 'SEL', KAZ: 'SEL', KGZ: 'SEL',
  // Fatimids
  EGY: 'FAT', LBY: 'FAT', TUN: 'FAT', DZA: 'FAT', LBN: 'FAT',
  // Almoravids
  MAR: 'ALM', ESH: 'ALM', MRT: 'ALM', MLI: 'ALM', SEN: 'ALM', GMB: 'ALM',
  // Crusader states
  ISR: 'CRS', PSE: 'CRS', JOR: 'CRS',
  // Song / Liao
  CHN: 'SNG', MNG: 'KHL', PRK: 'KHL', KOR: 'KHL',
  // Kievan Rus
  UKR: 'KIEV', BLR: 'KIEV', RUS: 'KIEV',
  // Ghana empire
  BFA: 'GHA_E', GIN: 'GHA_E',
  // independent-ish medieval realms get their own auto-countrys: FRA ESP PRT GBR POL HUN SWE DNK NOR JPN IND ETH etc.
}
// fix placeholder artifact
delete OWN_1100.BYZ

const OWN_1700: Record<string, string> = {
  // Ottomans
  TUR: 'OTT', GRC: 'OTT', BGR: 'OTT', ROU: 'OTT', SRB: 'OTT', BIH: 'OTT', HRV: 'OTT', MNE: 'OTT',
  MKD: 'OTT', ALB: 'OTT', HUN: 'OTT', IRQ: 'OTT', SYR: 'OTT', LBN: 'OTT', ISR: 'OTT', PSE: 'OTT',
  JOR: 'OTT', EGY: 'OTT', LBY: 'OTT', TUN: 'OTT', DZA: 'OTT', SAU: 'OTT', YEM: 'OTT',
  // Habsburgs
  AUT: 'HAB', CZE: 'HAB', SVN: 'HAB',
  // Spain + empire
  ESP: 'SPA_B', MEX: 'SPA_B', GTM: 'SPA_B', BLZ: 'SPA_B', HND: 'SPA_B', SLV: 'SPA_B', NIC: 'SPA_B',
  CRI: 'SPA_B', PAN: 'SPA_B', CUB: 'SPA_B', DOM: 'SPA_B', VEN: 'SPA_B', COL: 'SPA_B', ECU: 'SPA_B',
  PER: 'SPA_B', BOL: 'SPA_B', CHL: 'SPA_B', ARG: 'SPA_B', URY: 'SPA_B', PRY: 'SPA_B', PHL: 'SPA_B',
  BEL: 'SPA_B', LUX: 'SPA_B',
  // Portugal + empire
  PRT: 'POR_B', BRA: 'POR_B', AGO: 'POR_B', MOZ: 'POR_B', GNB: 'POR_B', TLS: 'POR_B',
  // France + colonies
  FRA: 'FRA_B', CAN: 'FRA_B', HTI: 'FRA_B',
  // Britain + colonies
  GBR: 'GBR_B', IRL: 'GBR_B', USA: 'GBR_B',
  // Dutch
  NLD: 'NLD_B', ZAF: 'NLD_B', NAM: 'NLD_B',
  // Russia
  RUS: 'RUS_B', UKR: 'RUS_B', KAZ: 'RUS_B',
  // Sweden
  SWE: 'SWE_B', FIN: 'SWE_B', EST: 'SWE_B', LVA: 'SWE_B',
  // Commonwealth
  POL: 'PLC', LTU: 'PLC', BLR: 'PLC',
  // Qing
  CHN: 'QNG', MNG: 'QNG', TWN: 'QNG',
  // Mughals
  IND: 'MUG', PAK: 'MUG', BGD: 'MUG', NPL: 'MUG',
  // Safavids
  IRN: 'SAF_D', AFG: 'SAF_D',
  // HRE remainder
  DEU: 'HRE',
}

const OWN_1914: Record<string, string> = {
  // British Empire
  GBR: 'GBR_B', IRL: 'GBR_B', CAN: 'GBR_B', AUS: 'GBR_B', NZL: 'GBR_B', ZAF: 'GBR_B',
  IND: 'GBR_B', PAK: 'GBR_B', BGD: 'GBR_B', LKA: 'GBR_B', MYS: 'GBR_B', BRN: 'GBR_B',
  NGA: 'GBR_B', GHA: 'GBR_B', KEN: 'GBR_B', UGA: 'GBR_B', GMB: 'GBR_B', SLE: 'GBR_B',
  ZWE: 'GBR_B', ZMB: 'GBR_B', BWA: 'GBR_B', LSO: 'GBR_B', SWZ: 'GBR_B', MWI: 'GBR_B',
  SDN: 'GBR_B', SSD: 'GBR_B', EGY: 'GBR_B', SOM: 'GBR_B', SML: 'GBR_B', CYP: 'GBR_B',
  KUW: 'GBR_B', QAT: 'GBR_B',
  ARE: 'GBR_B', OMN: 'GBR_B', YEM: 'GBR_B',
  GUY: 'GBR_B', JAM: 'GBR_B', TTO: 'GBR_B', BHS: 'GBR_B', BLZ: 'GBR_B', FLK: 'GBR_B',
  // French Empire
  FRA: 'FRA_B', DZA: 'FRA_B', TUN: 'FRA_B', MAR: 'FRA_B', MRT: 'FRA_B', SEN: 'FRA_B',
  CIV: 'FRA_B', BEN: 'FRA_B', GAB: 'FRA_B', COG: 'FRA_B', MDG: 'FRA_B', DJI: 'FRA_B',
  GIN: 'FRA_B', NER: 'FRA_B', TCD: 'FRA_B', CAF: 'FRA_B', MLI: 'FRA_B',
  BFA: 'FRA_B', NCL: 'FRA_B', VUT: 'FRA_B',
  // German Empire + colonies
  DEU: 'GER_B', NAM: 'GER_B', TGO: 'GER_B', CMR: 'GER_B', TZA: 'GER_B', PNG: 'GER_B',
  // Russia
  RUS: 'RUS_B', FIN: 'RUS_B', POL: 'RUS_B', LTU: 'RUS_B', LVA: 'RUS_B', EST: 'RUS_B',
  BLR: 'RUS_B', UKR: 'RUS_B', MDA: 'RUS_B', KAZ: 'RUS_B', UZB: 'RUS_B', TKM: 'RUS_B',
  KGZ: 'RUS_B', TJK: 'RUS_B', GEO: 'RUS_B', ARM: 'RUS_B', AZE: 'RUS_B', MNG: 'RUS_B',
  // Austria-Hungary
  AUH: 'AUH' as never, AUT: 'AUH', HUN: 'AUH', CZE: 'AUH', SVK: 'AUH', SVN: 'AUH', HRV: 'AUH', BIH: 'AUH',
  // Ottomans
  OTT: 'OTT' as never, TUR: 'OTT', SYR: 'OTT', LBN: 'OTT', PSE: 'OTT', ISR: 'OTT', IRQ: 'OTT', SAU: 'OTT',
  // Italy + colonies
  ITA: 'ITA_B', LBY: 'ITA_B', ERI: 'ITA_B',
  // USA + possessions
  USA: 'USA_B', PRI: 'USA_B', PHL: 'USA_B',
  // Japan + empire
  JPN: 'JPN_B', KOR: 'JPN_B', PRK: 'JPN_B', TWN: 'JPN_B',
  // Belgium, Netherlands, Portugal, Spain, Denmark
  BEL: 'BEL_B', COD: 'BEL_B', RWA: 'BEL_B', BDI: 'BEL_B',
  NLD: 'NLD_B', IDN: 'NLD_B', SUR: 'NLD_B',
  POR: 'POR_B', AGO: 'POR_B', MOZ: 'POR_B', GNB: 'POR_B', TLS: 'POR_B',
  ESP: 'SPA_B', ESH: 'SPA_B', GNQ: 'SPA_B',
  DNK: 'DNK_B', GRL: 'DNK_B', ISL: 'DNK_B',
  // France mandates not yet; rest independent
}
// cleanup placeholder keys
delete OWN_1914.AUH
delete OWN_1914.OTT

const OWN_1936: Record<string, string> = {
  // British Empire (dominions as separate playable countries)
  GBR: 'GBR_B', CAN: 'CAN', AUS: 'AUS', NZL: 'NZL', ZAF: 'ZAF', IRL: 'IRL',
  IND: 'GBR_B', PAK: 'GBR_B', BGD: 'GBR_B', LKA: 'GBR_B', MYS: 'GBR_B', BRN: 'GBR_B',
  NGA: 'GBR_B', GHA: 'GBR_B', KEN: 'GBR_B', UGA: 'GBR_B', GMB: 'GBR_B', SLE: 'GBR_B',
  ZWE: 'GBR_B', ZMB: 'GBR_B', BWA: 'GBR_B', LSO: 'GBR_B', SWZ: 'GBR_B', MWI: 'GBR_B',
  NAM: 'ZAF', SDN: 'GBR_B', SSD: 'GBR_B', SML: 'GBR_B', CYP: 'GBR_B',
  PSE: 'GBR_B', ISR: 'GBR_B', JOR: 'GBR_B',
  GUY: 'GBR_B', JAM: 'GBR_B', TTO: 'GBR_B', BHS: 'GBR_B', BLZ: 'GBR_B', FLK: 'GBR_B',
  // French Empire
  FRA: 'FRA_B', DZA: 'FRA_B', TUN: 'FRA_B', MAR: 'FRA_B', MRT: 'FRA_B', SEN: 'FRA_B',
  CIV: 'FRA_B', BEN: 'FRA_B', GAB: 'FRA_B', COG: 'FRA_B', MDG: 'FRA_B', DJI: 'FRA_B',
  GIN: 'FRA_B', NER: 'FRA_B', TCD: 'FRA_B', CAF: 'FRA_B', MLI: 'FRA_B', BFA: 'FRA_B',
  TGO: 'FRA_B', SYR: 'FRA_B', LBN: 'FRA_B', NCL: 'FRA_B', VUT: 'FRA_B',
  // Germany
  DEU: 'GER_B',
  // Italy + colonies
  ITA: 'ITA_B', LBY: 'ITA_B', ERI: 'ITA_B', ETH: 'ITA_B', SOM: 'ITA_B',
  // USSR
  SOV: 'SOV' as never, RUS: 'SOV', UKR: 'SOV', BLR: 'SOV', KAZ: 'SOV', UZB: 'SOV', TKM: 'SOV',
  KGZ: 'SOV', TJK: 'SOV', GEO: 'SOV', ARM: 'SOV', AZE: 'SOV', MDA: 'SOV',
  // Japan + empire
  JPN: 'JPN_B', KOR: 'JPN_B', PRK: 'JPN_B', TWN: 'JPN_B',
  // USA + possessions
  USA: 'USA_B', PRI: 'USA_B', PHL: 'USA_B',
  // Czechoslovakia
  CSK: 'CSK' as never, CZE: 'CSK', SVK: 'CSK',
  // colonial powers continued
  BEL: 'BEL_B', COD: 'BEL_B', RWA: 'BEL_B', BDI: 'BEL_B',
  NLD: 'NLD_B', IDN: 'NLD_B', SUR: 'NLD_B',
  POR: 'POR_B', AGO: 'POR_B', MOZ: 'POR_B', GNB: 'POR_B', TLS: 'POR_B',
  ESP: 'SPA_B', ESH: 'SPA_B', GNQ: 'SPA_B',
  DNK: 'DNK_B', GRL: 'DNK_B', ISL: 'DNK_B',
  // Middle East mostly independent
  EGY: 'EGY', IRQ: 'IRQ', SAU: 'SAU', IRN: 'IRN', TUR: 'TUR', AFG: 'AFG',
}
delete OWN_1936.SOV
delete OWN_1936.CSK

const OWN_1946: Record<string, string> = {
  // British Empire winding down (India still British until 1947)
  GBR: 'GBR_B', CAN: 'CAN', AUS: 'AUS', NZL: 'NZL', ZAF: 'ZAF', IRL: 'IRL',
  IND: 'GBR_B', PAK: 'GBR_B', LKA: 'GBR_B', MYS: 'GBR_B', BRN: 'GBR_B',
  NGA: 'GBR_B', GHA: 'GBR_B', KEN: 'GBR_B', UGA: 'GBR_B', GMB: 'GBR_B', SLE: 'GBR_B',
  ZWE: 'GBR_B', ZMB: 'GBR_B', BWA: 'GBR_B', LSO: 'GBR_B', SWZ: 'GBR_B', MWI: 'GBR_B',
  NAM: 'ZAF', SDN: 'GBR_B', SSD: 'GBR_B', SML: 'GBR_B', CYP: 'GBR_B',
  PSE: 'GBR_B', ISR: 'GBR_B', JOR: 'JOR',
  GUY: 'GBR_B', JAM: 'GBR_B', TTO: 'GBR_B', BHS: 'GBR_B', BLZ: 'GBR_B', FLK: 'GBR_B',
  // French Empire
  FRA: 'FRA_B', DZA: 'FRA_B', TUN: 'FRA_B', MAR: 'FRA_B', MRT: 'FRA_B', SEN: 'FRA_B',
  CIV: 'FRA_B', BEN: 'FRA_B', GAB: 'FRA_B', COG: 'FRA_B', MDG: 'FRA_B', DJI: 'FRA_B',
  GIN: 'FRA_B', NER: 'FRA_B', TCD: 'FRA_B', CAF: 'FRA_B', MLI: 'FRA_B', BFA: 'FRA_B',
  TGO: 'FRA_B', SYR: 'SYR', LBN: 'LBN', NCL: 'FRA_B', VUT: 'FRA_B',
  VNM: 'FRA_B', LAO: 'FRA_B', KHM: 'FRA_B',
  // Netherlands (Indonesian revolution ongoing)
  NLD: 'NLD_B', IDN: 'NLD_B', SUR: 'NLD_B',
  // USSR expands
  SOV: 'SOV' as never, RUS: 'SOV', UKR: 'SOV', BLR: 'SOV', KAZ: 'SOV', UZB: 'SOV', TKM: 'SOV',
  KGZ: 'SOV', TJK: 'SOV', GEO: 'SOV', ARM: 'SOV', AZE: 'SOV', MDA: 'SOV',
  EST: 'SOV', LVA: 'SOV', LTU: 'SOV', POL: 'POL',
  // Occupied zones
  PRK: 'SOV', KOR: 'USA_B',
  DEU: 'DEU', AUT: 'AUT', JPN: 'JPN',
  // USA
  USA: 'USA_B', PRI: 'USA_B', PHL: 'PHL',
  // rest of empires
  BEL: 'BEL_B', COD: 'BEL_B', RWA: 'BEL_B', BDI: 'BEL_B',
  POR: 'POR_B', AGO: 'POR_B', MOZ: 'POR_B', GNB: 'POR_B', TLS: 'POR_B',
  ESP: 'SPA_B', ESH: 'SPA_B', GNQ: 'SPA_B',
  DNK: 'DNK_B', GRL: 'DNK_B', ISL: 'ISL',
  EGY: 'EGY', IRQ: 'IRQ', SAU: 'SAU', IRN: 'IRN', TUR: 'TUR', AFG: 'AFG', ETH: 'ETH', ERI: 'GBR_B',
  CHN: 'CHN', TWN: 'TWN', MNG: 'MNG',
}
delete OWN_1946.SOV

const OWN_1991: Record<string, string> = {
  SOV: 'SOV' as never, RUS: 'SOV', UKR: 'SOV', BLR: 'SOV', KAZ: 'SOV', UZB: 'SOV', TKM: 'SOV',
  KGZ: 'SOV', TJK: 'SOV', GEO: 'SOV', ARM: 'SOV', AZE: 'SOV', MDA: 'SOV', EST: 'SOV', LVA: 'SOV', LTU: 'SOV',
  CSK: 'CSK' as never, CZE: 'CSK', SVK: 'CSK',
  YUG: 'YUG' as never, SVN: 'YUG', HRV: 'YUG', BIH: 'YUG', SRB: 'YUG', MNE: 'YUG', MKD: 'YUG', KOS: 'YUG',
  DEU: 'DEU',
  ZAF: 'ZAF', NAM: 'NAM',
  ERI: 'ETH',
  TLS: 'IDN',
  SSD: 'SDN',
  GBR: 'GBR', CAN: 'CAN', AUS: 'AUS', NZL: 'NZL',
  USA: 'USA', PRI: 'USA_B', FLK: 'GBR_B',
  NCL: 'FRA_B',
  MAR: 'MAR', ESH: 'MAR',
  PSE: 'ISR',
}
delete OWN_1991.SOV
delete OWN_1991.CSK
delete OWN_1991.YUG

export const SNAPSHOTS: Snapshot[] = [
  {
    year: 117, labelRu: '117 г. — Римская империя', labelEn: '117 AD — Roman Empire',
    descRu: 'Рим Траяна на пике могущества. Парфия, Хань и Кушаны делят Восток.',
    descEn: "Trajan's Rome at its peak. Parthia, Han and the Kushans rule the East.",
    owners: OWN_117,
  },
  {
    year: 1100, labelRu: '1100 г. — Средневековье', labelEn: '1100 — High Middle Ages',
    descRu: 'Крестовые походы, Византия, Сельджуки и Сун. Мир мечей и веры.',
    descEn: 'Crusades, Byzantium, Seljuks and Song. A world of swords and faith.',
    owners: OWN_1100,
  },
  {
    year: 1700, labelRu: '1700 г. — Век паруса', labelEn: '1700 — Age of Sail',
    descRu: 'Колониальные империи делят мир. Пётр I строит флот, Цин процветает.',
    descEn: 'Colonial empires carve up the world. Peter builds a navy, Qing prospers.',
    owners: OWN_1700,
  },
  {
    year: 1914, labelRu: '1914 г. — Пороховая бочка', labelEn: '1914 — Powder Keg',
    descRu: 'Европа вооружена до зубов. Мировая война вот-вот начнётся.',
    descEn: 'Europe is armed to the teeth. A world war is about to begin.',
    owners: OWN_1914,
  },
  {
    year: 1936, labelRu: '1936 г. — Буря приближается', labelEn: '1936 — Gathering Storm',
    descRu: 'Диктатуры поднимаются. У демократий есть два года, чтобы подготовиться.',
    descEn: 'Dictatorships rise. Democracies have two years to prepare.',
    owners: OWN_1936,
  },
  {
    year: 1946, labelRu: '1946 г. — Пепел и надежда', labelEn: '1946 — Ashes and Hope',
    descRu: 'Мир в руинах. Начинается холодная война и распад империй.',
    descEn: 'The world lies in ruins. The Cold War and decolonization begin.',
    owners: OWN_1946,
  },
  {
    year: 1991, labelRu: '1991 г. — Конец эпохи', labelEn: '1991 — End of an Era',
    descRu: 'СССР трещит по швам, Югославия закипает. Новый мировой порядок.',
    descEn: 'The USSR is cracking, Yugoslavia is boiling. A new world order.',
    owners: OWN_1991,
  },
  {
    year: 2025, labelRu: '2025 г. — Наше время', labelEn: '2025 — Modern Day',
    descRu: 'Современная геополитика. Все страны независимы — пока.',
    descEn: 'Modern geopolitics. All nations independent — for now.',
    owners: {},
  },
]

// Extra polities that appear only as owners in snapshots (colonial-era empires).
export const SNAPSHOT_POLITIES: Record<string, { ru: string; en: string; color: string; flag: string; government: string; personality: string }> = {
  GBR_B: { ru: 'Британская империя', en: 'British Empire', color: '#c0392b', flag: '🇬🇧', government: 'monarchy', personality: 'merchant' },
  FRA_B: { ru: 'Французская империя', en: 'French Empire', color: '#2e6fd8', flag: '🇫🇷', government: 'republic', personality: 'expansionist' },
  GER_B: { ru: 'Германская империя', en: 'German Empire', color: '#5d6d7e', flag: '🇩🇪', government: 'empire', personality: 'militarist' },
  RUS_B: { ru: 'Российская империя', en: 'Russian Empire', color: '#1e8449', flag: '🇷🇺', government: 'empire', personality: 'expansionist' },
  USA_B: { ru: 'США', en: 'United States', color: '#2874a6', flag: '🇺🇸', government: 'republic', personality: 'isolationist' },
  JPN_B: { ru: 'Японская империя', en: 'Empire of Japan', color: '#b9770e', flag: '🇯🇵', government: 'empire', personality: 'expansionist' },
  ITA_B: { ru: 'Королевство Италия', en: 'Kingdom of Italy', color: '#196f3d', flag: '🇮🇹', government: 'monarchy', personality: 'opportunist' },
  SPA_B: { ru: 'Испания', en: 'Spain', color: '#9a7d0a', flag: '🇪🇸', government: 'monarchy', personality: 'cautious' },
  POR_B: { ru: 'Португалия', en: 'Portugal', color: '#7d3c98', flag: '🇵🇹', government: 'monarchy', personality: 'cautious' },
  NLD_B: { ru: 'Нидерланды', en: 'Netherlands', color: '#d35400', flag: '🇳🇱', government: 'republic', personality: 'merchant' },
  BEL_B: { ru: 'Бельгия', en: 'Belgium', color: '#784212', flag: '🇧🇪', government: 'monarchy', personality: 'cautious' },
  DNK_B: { ru: 'Дания', en: 'Denmark', color: '#a93226', flag: '🇩🇰', government: 'monarchy', personality: 'cautious' },
  OTT: { ru: 'Османская империя', en: 'Ottoman Empire', color: '#922b21', flag: '🌙', government: 'empire', personality: 'cautious' },
  AUH: { ru: 'Австро-Венгрия', en: 'Austria-Hungary', color: '#d4ac0d', flag: '👑', government: 'empire', personality: 'cautious' },
  SOV: { ru: 'СССР', en: 'Soviet Union', color: '#cb4335', flag: '☭', government: 'communist', personality: 'expansionist' },
  CSK: { ru: 'Чехословакия', en: 'Czechoslovakia', color: '#5499c7', flag: '🇨🇿', government: 'republic', personality: 'cautious' },
  YUG: { ru: 'Югославия', en: 'Yugoslavia', color: '#2e4053', flag: '⭐', government: 'communist', personality: 'isolationist' },
  HAB: { ru: 'Монархия Габсбургов', en: 'Habsburg Monarchy', color: '#b7950b', flag: '🦅', government: 'monarchy', personality: 'cautious' },
  PLC: { ru: 'Речь Посполитая', en: 'Polish–Lithuanian Commonwealth', color: '#c70039', flag: '🏰', government: 'monarchy', personality: 'cautious' },
  QNG: { ru: 'Империя Цин', en: 'Qing Dynasty', color: '#d68910', flag: '🐲', government: 'empire', personality: 'isolationist' },
  MUG: { ru: 'Империя Моголов', en: 'Mughal Empire', color: '#196f3d', flag: '🕌', government: 'empire', personality: 'expansionist' },
  SAF_D: { ru: 'Сефевидская Персия', en: 'Safavid Persia', color: '#117a65', flag: '🦚', government: 'theocracy', personality: 'cautious' },
  HRE: { ru: 'Священная Римская империя', en: 'Holy Roman Empire', color: '#a67c00', flag: '🦅', government: 'empire', personality: 'cautious' },
  BYZ: { ru: 'Византия', en: 'Byzantine Empire', color: '#6c3483', flag: '☦️', government: 'empire', personality: 'diplomat' },
  SEL: { ru: 'Сельджуки', en: 'Seljuk Sultanate', color: '#1e8449', flag: '🌙', government: 'empire', personality: 'expansionist' },
  FAT: { ru: 'Фатимиды', en: 'Fatimid Caliphate', color: '#148f77', flag: '🕌', government: 'theocracy', personality: 'merchant' },
  ALM: { ru: 'Альморавиды', en: 'Almoravids', color: '#7d6608', flag: '🏜️', government: 'theocracy', personality: 'zealot' },
  CRS: { ru: 'Государства крестоносцев', en: 'Crusader States', color: '#b03a2e', flag: '⚔️', government: 'monarchy', personality: 'zealot' },
  SNG: { ru: 'Империя Сун', en: 'Song Dynasty', color: '#2e86c1', flag: '🀄', government: 'empire', personality: 'merchant' },
  KHL: { ru: 'Империя Ляо', en: 'Liao Dynasty', color: '#784212', flag: '🐎', government: 'empire', personality: 'militarist' },
  KIEV: { ru: 'Киевская Русь', en: 'Kievan Rus', color: '#1f618d', flag: '🛡️', government: 'monarchy', personality: 'expansionist' },
  GHA_E: { ru: 'Империя Гана', en: 'Ghana Empire', color: '#b9770e', flag: '🪙', government: 'empire', personality: 'merchant' },
  ROM: { ru: 'Римская империя', en: 'Roman Empire', color: '#8e44ad', flag: '🏛️', government: 'empire', personality: 'expansionist' },
  PARTH: { ru: 'Парфия', en: 'Parthian Empire', color: '#b7950b', flag: '🏹', government: 'empire', personality: 'cautious' },
  HAN: { ru: 'Империя Хань', en: 'Han Empire', color: '#c0392b', flag: '🐉', government: 'empire', personality: 'cautious' },
  KUSH: { ru: 'Кушанское царство', en: 'Kushan Empire', color: '#d4a017', flag: '☸️', government: 'monarchy', personality: 'merchant' },
  XION: { ru: 'Хунну', en: 'Xiongnu', color: '#7f6a3e', flag: '🐺', government: 'tribal', personality: 'expansionist' },
  AKS: { ru: 'Аксум', en: 'Aksum', color: '#9a7d0a', flag: '🦁', government: 'monarchy', personality: 'merchant' },
}

export function snapshotForYear(year: number): Snapshot {
  let best = SNAPSHOTS[0]
  for (const s of SNAPSHOTS) if (s.year <= year) best = s
  return best
}
