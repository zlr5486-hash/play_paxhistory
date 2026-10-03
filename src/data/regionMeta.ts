// Rough modern populations (millions) and development multipliers per region.
// Used as a base that era snapshots scale. Precision is gameplay-grade, not census-grade.

export const POP: Record<string, number> = {
  AFG: 40, ALB: 2.8, DZA: 45, AGO: 35, AZE: 10, ARG: 46, AUS: 26, AUT: 9, BHS: 0.4, BGD: 170,
  ARM: 3, BEL: 11.6, BTN: 0.8, BOL: 12, BIH: 3.3, BWA: 2.4, BRA: 215, BLZ: 0.4, SLB: 0.7, BRN: 0.45,
  BGR: 6.8, MMR: 55, BDI: 13, BLR: 9.4, KHM: 17, CMR: 28, CAN: 39, CAF: 5.5, LKA: 22, TCD: 18,
  CHL: 19.5, CHN: 1410, TWN: 23.5, COL: 52, COG: 6, COD: 100, CRI: 5.2, HRV: 3.9, CUB: 11.2,
  CYP: 1.2, CZE: 10.5, BEN: 13, DNK: 5.9, DOM: 11.2, ECU: 18, SLV: 6.3, GNQ: 1.6, ETH: 125, ERI: 3.7,
  EST: 1.3, FLK: 0.004, FJI: 0.9, FIN: 5.5, FRA: 68, DJI: 1.1, GAB: 2.4, GEO: 3.7, GMB: 2.7, PSE: 5.3,
  DEU: 84, GHA: 33, GRC: 10.4, GRL: 0.06, GTM: 17.6, GIN: 14, GUY: 0.8, HTI: 11.6, HND: 10.5, HUN: 9.7,
  ISL: 0.38, IND: 1420, IDN: 275, IRN: 88, IRQ: 44, IRL: 5.1, ISR: 9.7, ITA: 59, CIV: 28, JAM: 3,
  JPN: 124, KAZ: 19.5, JOR: 11.3, KEN: 54, PRK: 26, KOR: 52, KWT: 4.3, KGZ: 6.7, LAO: 7.5, LBN: 5.5,
  LSO: 2.3, LVA: 1.8, LBR: 5.3, LBY: 7, LTU: 2.8, LUX: 0.65, MDG: 29, MWI: 20, MYS: 33, MLI: 22,
  MRT: 4.7, MEX: 128, MNG: 3.4, MDA: 2.5, MNE: 0.62, MAR: 37, MOZ: 33, OMN: 4.6, NAM: 2.6, NPL: 30,
  NLD: 17.7, NCL: 0.29, VUT: 0.32, NZL: 5.1, NIC: 7, NER: 26, NGA: 220, NOR: 5.5, PAK: 235, PAN: 4.4,
  PNG: 10, PRY: 6.8, PER: 34, PHL: 115, POL: 37, PRT: 10.3, GNB: 2.1, TLS: 1.3, PRI: 3.2, QAT: 2.7,
  ROU: 19, RUS: 144, RWA: 14, SAU: 36, SEN: 17.5, SRB: 6.6, SLE: 8.6, SVK: 5.4, VNM: 99, SVN: 2.1,
  SOM: 18, ZAF: 60, ZWE: 16.5, ESP: 48, SSD: 11, SDN: 48, ESH: 0.6, SUR: 0.6, SWZ: 1.2, SWE: 10.5,
  CHE: 8.8, SYR: 22, TJK: 10, THA: 72, TGO: 8.8, TTO: 1.4, ARE: 9.9, TUN: 12.4, TUR: 85, TKM: 6.3,
  UGA: 47, UKR: 37, MKD: 1.8, EGY: 110, GBR: 68, TZA: 65, USA: 335, BFA: 22.5, URY: 3.4, UZB: 35,
  VEN: 28, YEM: 34, ZMB: 20, KOS: 1.8, NCY: 0.3, SML: 5.5,
}

// Development multiplier: how industrialized a region is relative to baseline (industry per capita).
const DEV_HI = ['USA', 'GBR', 'DEU', 'FRA', 'NLD', 'BEL', 'CHE', 'AUT', 'SWE', 'NOR', 'DNK', 'JPN', 'CZE',
  'ITA', 'CAN', 'AUS', 'NZL', 'IRL', 'ISL', 'LUX', 'SVN', 'EST', 'FIN', 'KOR', 'TWN', 'ESP', 'PRT', 'POL',
  'SVK', 'HUN', 'HRV', 'RUS', 'UKR', 'KAZ', 'BLR', 'GRC', 'ISR', 'ARE', 'QAT', 'KWT', 'SAU', 'MEX', 'ARG',
  'CHL', 'URY', 'BRA', 'ZAF', 'CHN', 'TUR', 'IRN', 'MYS', 'THA', 'VNM', 'IND', 'IDN', 'EGY', 'MAR', 'TUN',
  'DZA', 'LBY', 'IRQ', 'VEN', 'COL', 'PER', 'ECU', 'GAB', 'BWA', 'NAM', 'NGA', 'AGO', 'COG', 'GEO', 'ARM', 'AZE', 'SRB', 'ROU', 'BGR', 'LTU', 'LVA', 'MDA', 'MKD', 'BIH', 'MNE', 'ALB', 'TTO', 'BRN', 'OMN', 'JOR', 'LBN', 'CYP', 'PHL', 'PAK', 'BGD', 'LKA', 'KEN', 'GHA', 'CIV', 'SEN', 'CMR', 'CUB', 'DOM', 'PRI', 'JAM', 'PAN', 'CRI', 'SLB', 'FJI']
export const DEV: Record<string, number> = {}
for (const r of DEV_HI) DEV[r] = r === 'USA' || r === 'DEU' || r === 'GBR' || r === 'JPN' ? 3 : 1.8

// Landlocked regions (cannot be invaded by sea; reduced trade income)
export const LANDLOCKED = new Set(['AFG', 'ARM', 'AUT', 'BDI', 'BFA', 'BLR', 'BOL', 'BWA', 'CAF', 'CHE', 'CZE',
  'ETH', 'HUN', 'KGZ', 'LAO', 'LSO', 'LUX', 'MDA', 'MKD', 'MLI', 'MNG', 'MWI', 'NEP', 'NER', 'PRY', 'RWA',
  'SRB', 'SVK', 'SSD', 'SWZ', 'TCD', 'TJK', 'TKM', 'UGA', 'UZB', 'ZMB', 'ZWE', 'KOS', 'BTN', 'MNE'])
