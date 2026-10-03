// Culture groups per region — drives separatism & assimilation realism.
export const CULTURES: Record<string, string> = {
  // Slavic
  RUS: 'slavic', UKR: 'slavic', BLR: 'slavic', POL: 'slavic', CZE: 'slavic', SVK: 'slavic', BGR: 'slavic',
  SRB: 'slavic', HRV: 'slavic', BIH: 'slavic', SVN: 'slavic', MKD: 'slavic', MNE: 'slavic',
  // Germanic
  DEU: 'germanic', AUT: 'germanic', CHE: 'germanic', NLD: 'germanic', DNK: 'germanic', SWE: 'germanic',
  NOR: 'germanic', ISL: 'germanic', GBR: 'germanic', IRL: 'celtic',
  // Romance
  FRA: 'romance', ITA: 'romance', ESP: 'romance', PRT: 'romance', ROU: 'romance', MDA: 'romance',
  // Hellenic
  GRC: 'hellenic', CYP: 'hellenic', NCY: 'hellenic',
  // Baltic / Finno-Ugric
  LTU: 'baltic', LVA: 'baltic', EST: 'finnic', FIN: 'finnic', HUN: 'uralic',
  // Turkic
  TUR: 'turkic', AZE: 'turkic', KAZ: 'turkic', UZB: 'turkic', TKM: 'turkic', KGZ: 'turkic',
  // East Asian
  CHN: 'sinitic', TWN: 'sinitic', JPN: 'japanese', KOR: 'korean', PRK: 'korean', MNG: 'mongolic',
  // South Asian
  IND: 'indian', PAK: 'indian-muslim', BGD: 'indian-muslim', LKA: 'indian', NPL: 'indian', BTN: 'indian',
  // Southeast Asian
  MMR: 'se-asian', THA: 'se-asian', LAO: 'se-asian', KHM: 'se-asian', VNM: 'se-asian', MYS: 'se-asian-malay',
  IDN: 'se-asian-malay', PHL: 'se-asian', BRN: 'se-asian-malay', TLS: 'se-asian', PNG: 'melanesian',
  SLB: 'melanesian', VUT: 'melanesian', FJI: 'melanesian',
  // Arab / Semitic
  SAU: 'arab', YEM: 'arab', OMN: 'arab', ARE: 'arab', QAT: 'arab', KWT: 'arab', BHR: 'arab', JOR: 'arab',
  IRQ: 'arab', SYR: 'arab', LBN: 'arab', PSE: 'arab', ISR: 'jewish', EGY: 'arab', LBY: 'arab', TUN: 'arab',
  DZA: 'arab-berber', MAR: 'arab-berber', MRT: 'arab-berber', ESH: 'arab-berber', SDN: 'arab-african',
  SSD: 'african', DJI: 'arab-african', SOM: 'somali', SML: 'somali', ERI: 'african',
  // Sub-Saharan
  NGA: 'african', GHA: 'african', CIV: 'african', SEN: 'african', GIN: 'african', SLE: 'african',
  LBR: 'african', TGO: 'african', BEN: 'african', BFA: 'african', MLI: 'african', NER: 'african',
  TCD: 'african', CAF: 'african', CMR: 'african', GAB: 'african', COG: 'african', COD: 'african',
  UGA: 'african', KEN: 'african', TZA: 'african', RWA: 'african', BDI: 'african', ETH: 'african',
  AGO: 'african', ZMB: 'african', ZWE: 'african', MWI: 'african', MOZ: 'african', MAD: 'african',
  MDG: 'african', NAM: 'african', BWA: 'african', ZAF: 'african', LSO: 'african', SWZ: 'african',
  GMB: 'african', GNB: 'african', GNQ: 'african',
  // Americas
  USA: 'anglo-american', CAN: 'anglo-american', MEX: 'latin', GTM: 'latin', BLZ: 'latin', HND: 'latin',
  SLV: 'latin', NIC: 'latin', CRI: 'latin', PAN: 'latin', CUB: 'latin', DOM: 'latin', HTI: 'latin',
  JAM: 'latin', TTO: 'latin', BHS: 'latin', COL: 'latin', VEN: 'latin', ECU: 'latin', PER: 'latin',
  BOL: 'latin', CHL: 'latin', ARG: 'latin', URY: 'latin', PRY: 'latin', BRA: 'latin', SUR: 'latin',
  GUY: 'latin', PRI: 'latin',
  // Oceania
  AUS: 'anglo-american', NZL: 'anglo-american',
  // Caucasus / Central
  GEO: 'caucasian', ARM: 'caucasian', AFG: 'persianic', IRN: 'persianic', TJK: 'persianic',
  KOS: 'slavic', ALB: 'albanian', LUX: 'germanic',
  GRL: 'inuit', NCL: 'melanesian', FLK: 'anglo-american',
}

export const cultureOf = (region: string): string => CULTURES[region] ?? 'local'
