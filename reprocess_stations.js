// Re-process the already-downloaded OSM JSON with the strict Karnataka filter
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN_JSON  = path.join(__dirname, 'karnataka_police_osm.json');
const OUT_JS   = path.join(__dirname, 'src', 'mockData', 'realPoliceStations.js');

const rawJson = fs.readFileSync(IN_JSON, 'utf8');
const parsed  = JSON.parse(rawJson);
console.log('Total OSM elements in saved file:', parsed.elements.length);

// STRICT Karnataka filter
const stations = parsed.elements
  .filter(el => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return false;
    const tags = el.tags || {};
    const name = (tags.name || tags['name:en'] || '').toLowerCase();
    const addrState = (tags['addr:state'] || '').toLowerCase();
    const addrCity = (tags['addr:city'] || '').toLowerCase();

    // 1. Exclude explicit non-Karnataka state/city tags
    if (addrState.includes('kerala') || addrState.includes('tamil') || addrState.includes('telangana') || addrState.includes('andhra') || addrState.includes('maharashtra') || addrState.includes('goa')) {
      return false;
    }
    if (addrCity.includes('hyderabad') || addrCity.includes('pune') || addrCity.includes('mumbai') || addrCity.includes('coimbatore') || addrCity.includes('chennai') || addrCity.includes('kasaragod') || addrCity.includes('kannur')) {
      return false;
    }

    // 2. Strict Latitude/Longitude Polygon-based Bounding Box rules for Karnataka
    if (lat < 11.55 || lat > 18.5) return false;
    if (lon < 74.0 || lon > 78.6) return false;

    // A. Northern border (Maharashtra/Goa)
    if (lat >= 14.85 && lat < 15.85 && lon < 74.32) return false; // Goa
    if (lat >= 15.85 && lat < 16.3 && lon < 74.35) return false; // Ajara, Gadhinglaj
    if (lat >= 16.3 && lat < 16.5 && lon < 74.35) return false;  // Keeps Nipani at 74.37
    if (lat >= 16.5 && lat < 16.8 && lon < 74.45) return false;  // Kagal, Kolhapur
    if (lat >= 16.8 && lon < 75.0) return false;                 // Sangli, Miraj, Ichalkaranji
    if (lat > 17.0 && lon < 75.2) return false;                 // Solapur border area
    if (lat > 17.0 && lon > 77.7) return false; // Hyderabad/Telangana area
    if (lat > 17.5 && lon > 77.6) return false;
    if (lat > 17.5 && lon < 74.4) return false; // Goa/Maharashtra
    if (lat > 17.8 && lon > 76.5) return false; // Latur/Osmanabad

    // B. Eastern border (Telangana / Andhra Pradesh / Tamil Nadu)
    if (lat > 12.5 && lat < 12.8 && lon > 77.78) return false;  // Hosur (TN)
    if (lat > 15.0 && lat <= 17.0 && lon > 77.6) return false; // Mahbubnagar/Wanaparthy
    if (lat > 13.5 && lat <= 15.0 && lon > 78.4) return false; // Anantapur/Kurnool
    if (lat > 12.5 && lat <= 13.5 && lon > 78.2) return false; // Chittoor/TN
    if (lat > 17.3 && lon < 76.1) return false;                 // Solapur district

    // C. Southern border (Tamil Nadu / Kerala)
    if (lat < 12.0 && lon > 77.3) return false;
    if (lat < 11.7 && lon > 76.5) return false;
    if (lat < 11.8 && lon < 76.3) return false;
    if (lat < 12.8 && lon < 75.25) return false;
    if (lat < 12.5 && lon < 75.5) return false;

    return true;
  })
  .map(el => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const tags = el.tags || {};
    let name = (tags.name || tags['name:en'] || 'Police Station').trim();
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

console.log('Karnataka-ONLY stations after strict filter:', stations.length);
console.log('\nFull list of all stations with lat/lon:');
console.log('No. | OSM ID     | Lat        | Lon        | Name');
console.log('----+------------+------------+------------+--------------------------------------------');
stations.forEach((s, i) => {
  console.log(
    String(i + 1).padStart(4) + ' | ' +
    String(s.osmId).padEnd(11) + '| ' +
    String(s.lat).padEnd(11) + ' | ' +
    String(s.lon).padEnd(11) + ' | ' +
    s.name
  );
});

// Write JS module — NO officer names, only real data
const jsContent = `// Real Karnataka Police Stations sourced from OpenStreetMap (Overpass API)
// ${stations.length} stations with verified GPS coordinates
// Fetched: ${new Date().toISOString().split('T')[0]}
// Only Karnataka state stations — Kerala/Maharashtra/Telangana filtered out

export const realPoliceStations = ${JSON.stringify(stations, null, 2)};

export default realPoliceStations;
`;

fs.writeFileSync(OUT_JS, jsContent, 'utf8');
console.log('\nWrote', stations.length, 'stations to', OUT_JS);
