import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_JSON = path.join(__dirname, 'karnataka_police_osm.json');
const OUT_JS   = path.join(__dirname, 'src', 'mockData', 'realPoliceStations.js');

const query = '[out:json][timeout:120];(node["amenity"="police"](11.5,73.8,18.5,78.6);way["amenity"="police"](11.5,73.8,18.5,78.6););out center;';
const encoded = encodeURIComponent(query);

const servers = [
  'https://overpass.kumi.systems/api/interpreter?data=' + encoded,
  'https://overpass-api.de/api/interpreter?data=' + encoded,
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=' + encoded,
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log('Trying:', url.substring(0, 70) + '...');
    const req = https.get(url, { timeout: 120000 }, (res) => {
      console.log('Status:', res.statusCode);
      if (res.statusCode !== 200) { reject(new Error('Status ' + res.statusCode)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function processAndWrite(rawJson) {
  const parsed = JSON.parse(rawJson);
  console.log('Total OSM elements:', parsed.elements.length);

  // Save raw OSM JSON
  fs.writeFileSync(OUT_JSON, rawJson, 'utf8');
  console.log('Saved raw JSON to:', OUT_JSON);

  // STRICT Karnataka filter:
  // Karnataka longitude range: 74.05E (Karwar coast) to 78.6E (Kolar)
  // Karnataka latitude range:  11.5N (Chamarajanagar) to 18.45N (Bidar)
  // Exclude Kerala (lon < 74.05), Maharashtra (lat > 18.4), Telangana (lon > 78.5 & lat > 17)
  // Also exclude Goa (lat > 14.9 & lon < 73.9)
  const stations = parsed.elements
    .filter(el => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) return false;
      // Strict Karnataka bounding box
      if (lat < 11.5 || lat > 18.4) return false;
      if (lon < 74.05 || lon > 78.6) return false;
      // Exclude Kerala coastal belt (these sneak in via lon 74.x–75.x when lat < 13.0)
      // Kerala states are roughly lon < 76.0 AND lat < 12.5 (excluding Coorg/Kodagu border)
      if (lon < 76.0 && lat < 12.3 && lon < 74.8) return false; // deep Kerala
      // Exclude Maharashtra (Latur, Solapur etc): lat > 17.8
      if (lat > 17.9 && lon > 75.5) return false;
      // Exclude Telangana (Hyderabad etc): lat > 17.0 && lon > 78.3
      if (lat > 17.0 && lon > 78.4) return false;
      // Exclude Andhra Pradesh: lat < 13.5 && lon > 78.5
      if (lon > 78.5 && lat < 14.0) return false;
      return true;
    })
    .map(el => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      let name = (tags.name || tags['name:en'] || 'Police Station').trim();
      // Normalize casing
      if (name === name.toUpperCase()) {
        name = name.charAt(0) + name.slice(1).toLowerCase();
      }
      return {
        osmId: el.id,
        name,
        nameKn: tags['name:kn'] || null,
        lat: Math.round(lat * 1e6) / 1e6,
        lon: Math.round(lon * 1e6) / 1e6,
        phone: tags.phone || tags['contact:phone'] || null,
        address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || null,
      };
    });

  console.log('Karnataka-only stations after strict filter:', stations.length);

  // Region breakdown
  const byRegion = {};
  stations.forEach(s => {
    let r = 'Other Karnataka';
    const {lat, lon} = s;
    if (lat > 12.6 && lat < 13.4 && lon > 77.3 && lon < 78.0) r = 'Bengaluru';
    else if (lat > 12.1 && lat < 12.5 && lon > 76.4 && lon < 76.8) r = 'Mysuru';
    else if (lat > 14.8 && lat < 15.5 && lon > 74.9 && lon < 75.3) r = 'Hubballi-Dharwad';
    else if (lat > 15.5 && lat < 16.2 && lon > 74.3 && lon < 74.9) r = 'Belagavi';
    else if (lat > 12.8 && lat < 13.1 && lon > 74.7 && lon < 75.1) r = 'Mangaluru';
    else if (lat > 13.2 && lat < 13.6 && lon > 77.0 && lon < 77.5) r = 'Tumkur';
    byRegion[r] = (byRegion[r] || 0) + 1;
  });
  console.log('\nBy region:');
  Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  // Write JS module
  const jsContent = `// Real Karnataka Police Stations sourced from OpenStreetMap (Overpass API)
// ${stations.length} stations with verified GPS coordinates
// Fetched: ${new Date().toISOString().split('T')[0]}
// Coverage: All mapped amenity=police nodes in Karnataka bounding box (11.5N-18.5N, 74.0E-78.6E)

export const realPoliceStations = ${JSON.stringify(stations, null, 2)};

export default realPoliceStations;
`;
  fs.writeFileSync(OUT_JS, jsContent, 'utf8');
  console.log('\nWrote JS module to:', OUT_JS);
  console.log('\nSample (first 15):');
  stations.slice(0, 15).forEach((s,i) => console.log(`  ${i+1}. [${s.lat}, ${s.lon}] ${s.name}`));
  return stations.length;
}

async function main() {
  for (const url of servers) {
    try {
      const data = await fetchUrl(url);
      const count = processAndWrite(data);
      console.log(`\nDone! ${count} real stations with GPS coordinates written.`);
      return;
    } catch (e) {
      console.error('Failed:', e.message);
    }
  }
  console.error('All servers failed.');
}

main();
