// Converts world-atlas topojson -> game geojson with ISO3 ids + adjacency + centroids
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { feature } from 'topojson-client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const topo = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-110m.json'), 'utf8'))
const fc = feature(topo, topo.objects.countries)

const NUM2ISO3 = {
  '004': 'AFG', '008': 'ALB', '012': 'ALG', '024': 'AGO', '031': 'AZE', '032': 'ARG', '036': 'AUS', '040': 'AUT',
  '044': 'BHS', '050': 'BGD', '051': 'ARM', '056': 'BEL', '064': 'BTN', '068': 'BOL', '070': 'BIH', '072': 'BWA',
  '076': 'BRA', '084': 'BLZ', '090': 'SLB', '096': 'BRN', '100': 'BGR', '104': 'MMR', '108': 'BDI', '112': 'BLR',
  '116': 'KHM', '120': 'CMR', '124': 'CAN', '140': 'CAF', '144': 'LKA', '148': 'TCD', '152': 'CHL', '156': 'CHN',
  '158': 'TWN', '170': 'COL', '178': 'COG', '180': 'COD', '188': 'CRI', '191': 'HRV', '192': 'CUB', '196': 'CYP',
  '203': 'CZE', '204': 'BEN', '208': 'DNK', '214': 'DOM', '218': 'ECU', '222': 'SLV', '226': 'GNQ', '231': 'ETH',
  '232': 'ERI', '233': 'EST', '238': 'FLK', '242': 'FJI', '246': 'FIN', '250': 'FRA', '262': 'DJI', '266': 'GAB',
  '268': 'GEO', '270': 'GMB', '275': 'PSE', '276': 'GER', '288': 'GHA', '300': 'GRE', '304': 'GRL', '320': 'GTM',
  '324': 'GUI', '328': 'GUY', '332': 'HAI', '340': 'HON', '348': 'HUN', '352': 'ICE', '356': 'IND', '360': 'INS',
  '364': 'IRN', '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '384': 'IVO', '388': 'JAM', '392': 'JAP',
  '398': 'KAZ', '400': 'JOR', '404': 'KEN', '408': 'NKO', '410': 'SKO', '414': 'KUW', '417': 'KYR', '418': 'LAO',
  '422': 'LEB', '426': 'LES', '428': 'LAT', '430': 'LIB', '434': 'LBY', '440': 'LIT', '442': 'LUX', '450': 'MAD',
  '454': 'MAW', '458': 'MAL', '466': 'MLI', '478': 'MAU', '484': 'MEX', '496': 'MON', '498': 'MOL', '499': 'MNE',
  '504': 'MOR', '508': 'MOZ', '512': 'OMA', '516': 'NAM', '524': 'NEP', '528': 'NET', '540': 'NCA', '548': 'VAN',
  '554': 'NZL', '558': 'NIC', '562': 'NIG', '566': 'NIGERIA', '578': 'NOR', '586': 'PAK', '591': 'PAN', '598': 'PNG',
  '600': 'PAR', '604': 'PER', '608': 'PHI', '616': 'POL', '620': 'POR', '624': 'GUB', '626': 'TIM', '630': 'PUR',
  '634': 'QAT', '642': 'ROM', '643': 'RUS', '646': 'RWA', '682': 'SAU', '686': 'SEN', '688': 'SER', '694': 'SIE',
  '703': 'SLO', '704': 'VIE', '705': 'SLV2', '706': 'SOM', '710': 'RSA', '716': 'ZIM', '724': 'SPA', '728': 'SSD',
  '729': 'SUD', '732': 'WSA', '740': 'SUR', '748': 'SWA', '752': 'SWE', '756': 'SWI', '760': 'SYR', '762': 'TAJ',
  '764': 'THA', '768': 'TOG', '780': 'TRI', '784': 'UAE', '788': 'TUN', '792': 'TUR', '795': 'TKM', '800': 'UGA',
  '804': 'UKR', '807': 'MAC', '818': 'EGY', '826': 'GBR', '834': 'TAN', '840': 'USA', '854': 'BUF', '858': 'URU',
  '860': 'UZB', '862': 'VEN', '887': 'YEM', '894': 'ZAM',
}
// custom ids for territories without numeric codes
const NAME2ISO3 = { 'Kosovo': 'KOS', 'N. Cyprus': 'NCY', 'Somaliland': 'SML' }
// friendlier ISO-ish codes for major countries used in game data
const RENAME = {
  ALG: 'DZA', GER: 'DEU', GRE: 'GRC', GUI: 'GIN', HAI: 'HTI', HON: 'HND', ICE: 'ISL', INS: 'IDN', JAP: 'JPN',
  NKO: 'PRK', SKO: 'KOR', KUW: 'KWT', KYR: 'KGZ', LEB: 'LBN', LIB: 'LBR', LIT: 'LTU', MAD: 'MDG', MAW: 'MWI',
  MAL: 'MYS', MAU: 'MRT', MON: 'MNG', MOL: 'MDA', MOZ: 'MOZB', OMA: 'OMN', NET: 'NLD', NCA: 'NCL', NIG: 'NER',
  NIGERIA: 'NGA', PAR: 'PRY', PHI: 'PHL', POL: 'POL', ROM: 'ROU', RUS: 'RUS', RWA: 'RWA', SAU: 'SAU', SEN: 'SEN',
  SER: 'SRB', SIE: 'SLE', SLO: 'SVK', VIE: 'VNM', SLV2: 'SVN', SOM: 'SOM', RSA: 'ZAF', ZIM: 'ZWE', SPA: 'ESP',
  SWA: 'SWZ', SWI: 'CHE', SYR: 'SYR', TAJ: 'TJK', TOG: 'TGO', TRI: 'TTO', TAN: 'TZA', BUF: 'BFA', URU: 'URY',
  VEN: 'VEN', YEM: 'YEM', ZAM: 'ZMB', MO: null,
}
// Note: MOZ collides with Morocco MAR; fix: Morocco 504 -> MAR (no rename), Mozambique 508 -> MOZ
// Rebuild clean numeric -> final id map directly:
const FINAL = {}
const RAW = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '024': 'AGO', '031': 'AZE', '032': 'ARG', '036': 'AUS', '040': 'AUT',
  '044': 'BHS', '050': 'BGD', '051': 'ARM', '056': 'BEL', '064': 'BTN', '068': 'BOL', '070': 'BIH', '072': 'BWA',
  '076': 'BRA', '084': 'BLZ', '090': 'SLB', '096': 'BRN', '100': 'BGR', '104': 'MMR', '108': 'BDI', '112': 'BLR',
  '116': 'KHM', '120': 'CMR', '124': 'CAN', '140': 'CAF', '144': 'LKA', '148': 'TCD', '152': 'CHL', '156': 'CHN',
  '158': 'TWN', '170': 'COL', '178': 'COG', '180': 'COD', '188': 'CRI', '191': 'HRV', '192': 'CUB', '196': 'CYP',
  '203': 'CZE', '204': 'BEN', '208': 'DNK', '214': 'DOM', '218': 'ECU', '222': 'SLV', '226': 'GNQ', '231': 'ETH',
  '232': 'ERI', '233': 'EST', '238': 'FLK', '242': 'FJI', '246': 'FIN', '250': 'FRA', '262': 'DJI', '266': 'GAB',
  '268': 'GEO', '270': 'GMB', '275': 'PSE', '276': 'DEU', '288': 'GHA', '300': 'GRC', '304': 'GRL', '320': 'GTM',
  '324': 'GIN', '328': 'GUY', '332': 'HTI', '340': 'HND', '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN',
  '364': 'IRN', '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '384': 'CIV', '388': 'JAM', '392': 'JPN',
  '398': 'KAZ', '400': 'JOR', '404': 'KEN', '408': 'PRK', '410': 'KOR', '414': 'KWT', '417': 'KGZ', '418': 'LAO',
  '422': 'LBN', '426': 'LSO', '428': 'LVA', '430': 'LBR', '434': 'LBY', '440': 'LTU', '442': 'LUX', '450': 'MDG',
  '454': 'MWI', '458': 'MYS', '466': 'MLI', '478': 'MRT', '484': 'MEX', '496': 'MNG', '498': 'MDA', '499': 'MNE',
  '504': 'MAR', '508': 'MOZ', '512': 'OMN', '516': 'NAM', '524': 'NPL', '528': 'NLD', '540': 'NCL', '548': 'VUT',
  '554': 'NZL', '558': 'NIC', '562': 'NER', '566': 'NGA', '578': 'NOR', '586': 'PAK', '591': 'PAN', '598': 'PNG',
  '600': 'PRY', '604': 'PER', '608': 'PHL', '616': 'POL', '620': 'PRT', '624': 'GNB', '626': 'TLS', '630': 'PRI',
  '634': 'QAT', '642': 'ROU', '643': 'RUS', '646': 'RWA', '682': 'SAU', '686': 'SEN', '688': 'SRB', '694': 'SLE',
  '703': 'SVK', '704': 'VNM', '705': 'SVN', '706': 'SOM', '710': 'ZAF', '716': 'ZWE', '724': 'ESP', '728': 'SSD',
  '729': 'SDN', '732': 'ESH', '740': 'SUR', '748': 'SWZ', '752': 'SWE', '756': 'CHE', '760': 'SYR', '762': 'TJK',
  '764': 'THA', '768': 'TGO', '780': 'TTO', '784': 'ARE', '788': 'TUN', '792': 'TUR', '795': 'TKM', '800': 'UGA',
  '804': 'UKR', '807': 'MKD', '818': 'EGY', '826': 'GBR', '834': 'TZA', '840': 'USA', '854': 'BFA', '858': 'URY',
  '860': 'UZB', '862': 'VEN', '887': 'YEM', '894': 'ZMB',
}
Object.assign(FINAL, RAW)

const EXCLUDE = new Set(['010', '260']) // Antarctica, Fr. S. Antarctic Lands

function round2(x) { return Math.round(x * 100) / 100 }

// Split rings that cross the antimeridian (|dx| > 180) into closed rings
function splitRing(ring) {
  const jumps = []
  for (let i = 0; i < ring.length - 1; i++) {
    if (Math.abs(ring[i + 1][0] - ring[i][0]) > 180) jumps.push(i)
  }
  if (!jumps.length) return [ring]
  const chains = []
  let cur = [ring[0]]
  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = ring[i], p2 = ring[i + 1]
    cur.push(p2)
    if (Math.abs(p2[0] - p1[0]) > 180) {
      const x1 = p1[0], x2 = p2[0] < 0 ? p2[0] + 360 : p2[0]
      const t = (180 - x1) / (x2 - x1)
      const yC = round2(p1[1] + t * (p2[1] - p1[1]))
      const s1 = p1[0] > 0 ? 180 : -180
      const s2 = p2[0] > 0 ? 180 : -180
      cur[cur.length - 1] = [s1, yC]
      chains.push(cur)
      cur = [[s2, yC]]
    }
  }
  // close the cycle: tail joins head
  const merged = cur.concat(chains[0])
  const out = [merged, ...chains.slice(1)]
  return out.map(r => {
    const c = r.slice()
    if (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1]) c.push(c[0])
    return c
  })
}

function ringArea(ring) {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return Math.abs(a / 2)
}

const features = []
const antarcticaRings = []
for (const f of fc.features) {
  const numId = f.id ? String(f.id) : undefined
  const id = numId && FINAL[numId] !== undefined ? FINAL[numId] : NAME2ISO3[f.properties.name]
  if (numId === '010') {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const poly of polys) antarcticaRings.push(poly.map(r => r.map(([x, y]) => [round2(x), round2(y)])))
    continue
  }
  if (!id || EXCLUDE.has(numId || '')) continue
  const srcPolys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const newPolys = []
  for (const poly of srcPolys) {
    const outer = poly[0].map(([x, y]) => [round2(x), round2(y)])
    const parts = splitRing(outer)
    for (const part of parts) newPolys.push([part])
  }
  features.push({
    type: 'Feature', id, properties: { name: f.properties.name },
    geometry: newPolys.length === 1 ? { type: 'Polygon', coordinates: newPolys[0] } : { type: 'MultiPolygon', coordinates: newPolys },
  })
}

const out = { type: 'FeatureCollection', features }
const outDir = path.join(root, 'src', 'data')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'world.geo.json'), JSON.stringify(out))

// ---- adjacency via shared vertices ----
const vmap = new Map()
for (const f of features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
    const k = x + ',' + y
    if (!vmap.has(k)) vmap.set(k, new Set())
    vmap.get(k).add(f.id)
  }
}
const edges = new Set()
for (const set of vmap.values()) {
  if (set.size >= 2) {
    const arr = [...set]
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) edges.add([arr[i], arr[j]].sort().join('-'))
  }
}
// manual adjacencies (straits & short sea crossings that matter for gameplay)
const MANUAL = [
  ['GBR', 'FRA'], ['ESP', 'MAR'], ['DNK', 'SWE'], ['ITA', 'GRC'], ['USA', 'CUB'], ['RUS', 'JPN'],
  ['CHN', 'JPN'], ['SKO', 'JPN'], ['NKO', 'JPN'], ['CHN', 'KOR'], ['IND', 'LKA'], ['IRN', 'SAU'],
  ['QAT', 'IRN'], ['ARE', 'IRN'], ['BHR', 'IRN'], ['YEM', 'DJI'], ['YEM', 'ERI'], ['SAU', 'EGY'],
  ['JOR', 'EGY'], ['ISR', 'EGY'], ['TUN', 'ITA'], ['LBY', 'GRC'], ['TUR', 'ROU'], ['TUR', 'UKR'],
  ['RUS', 'SWE'], ['RUS', 'DNK'], ['FIN', 'EST'], ['NOR', 'DNK'], ['GBR', 'IRL'], ['CAN', 'GRL'],
  ['GRL', 'ISL'], ['ISL', 'NOR'], ['ISL', 'GBR'], ['FRA', 'GBR'], ['PHL', 'CHN'], ['PHL', 'VNM'],
  ['MYS', 'VNM'], ['MYS', 'IDN'], ['AUS', 'IDN'], ['AUS', 'PNG'], ['NZL', 'AUS'], ['JPN', 'NKO'],
  ['USA', 'RUS'], ['FJI', 'VUT'], ['USA', 'BHS'], ['CUB', 'MEX'], ['CUB', 'HTI'], ['HAI', 'DOM'],
  ['JAM', 'CUB'], ['GNB', 'SEN'], ['BRN', 'MYS'], ['TLS', 'AUS'], ['CYP', 'TUR'], ['CYP', 'GRC'],
  ['MLT', 'ITA'], ['SGP', 'MYS'], ['KWT', 'IRN'], ['OMN', 'IRN'], ['OMN', 'PAK'], ['MDV', 'LKA'],
  ['ESH', 'MRT'], ['MAR', 'ESP'], ['GMB', 'SEN'], ['LSO', 'ZAF'], ['SWZ', 'ZAF'], ['SWZ', 'MOZ'],
]
for (const [a, b] of MANUAL) edges.add([a, b].sort().join('-'))

// filter edges to ids that exist
const ids = new Set(features.map(f => f.id))
const adjacency = [...edges].map(e => e.split('-')).filter(([a, b]) => ids.has(a) && ids.has(b)).sort()
fs.writeFileSync(path.join(outDir, 'adjacency.json'), JSON.stringify(adjacency))

// ---- centroids & landlock ----
const LANDLOCKED = ['AFG', 'ARM', 'AUT', 'BDI', 'BFA', 'BFA', 'BLR', 'BOL', 'BWA', 'CAF', 'CHE', 'CZE', 'ETH',
  'HUN', 'KGZ', 'LAO', 'LSO', 'LUX', 'MDA', 'MKD', 'MLI', 'MNG', 'MWI', 'NEP', 'NER', 'PRY', 'RWA', 'SRB', 'SVK',
  'SSD', 'SWZ', 'TCD', 'TJK', 'TKM', 'UGA', 'UZB', 'ZMB', 'ZWE', 'KOS', 'BTN', 'MNE']
const centroids = {}
for (const f of features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  let best = null, bestArea = -1, totalArea = 0
  for (const poly of polys) {
    const ring = poly[0]
    const area = ringArea(ring)
    totalArea += area
    if (area > bestArea) { bestArea = area; best = ring }
  }
  let cx = 0, cy = 0
  for (const [x, y] of best) { cx += x; cy += y }
  centroids[f.id] = { lon: round2(cx / best.length), lat: round2(cy / best.length), coastal: !LANDLOCKED.includes(f.id), area: Math.round(totalArea) }
}
fs.writeFileSync(path.join(outDir, 'centroids.json'), JSON.stringify(centroids))

// decorative Antarctica (not playable)
const antFeatures = antarcticaRings.map(rings => ({
  type: 'Feature', properties: {},
  geometry: rings.length === 1 ? { type: 'Polygon', coordinates: rings } : { type: 'MultiPolygon', coordinates: rings.map(r => [r]) },
}))
fs.writeFileSync(path.join(outDir, 'antarctica.geo.json'), JSON.stringify({ type: 'FeatureCollection', features: antFeatures }))

console.log('features:', features.length)
console.log('adjacency edges:', adjacency.length)
const check = ['DEU-FRA', 'RUS-CHN', 'ESP-MAR', 'GBR-IRL', 'TUR-GRC', 'IND-PAK', 'USA-CAN', 'MEX-USA', 'CHN-PRK', 'EGY-LBY']
for (const c of check) {
  const [a, b] = c.split('-')
  const ok = adjacency.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  console.log(c, ok ? 'OK' : 'MISSING')
}
