import https from 'https';
import fs from 'fs';

const query = '[out:json][timeout:120];(node["amenity"="police"](11.5,73.8,18.5,78.6);way["amenity"="police"](11.5,73.8,18.5,78.6););out center;';
const encoded = encodeURIComponent(query);

const servers = [
  'https://overpass.kumi.systems/api/interpreter?data=' + encoded,
  'https://overpass-api.de/api/interpreter?data=' + encoded,
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    console.log('Trying:', url.substring(0, 70) + '...');
    const req = https.get(url, { timeout: 120000 }, (res) => {
      console.log('Status:', res.statusCode);
      if (res.statusCode !== 200) {
        reject(new Error('Status ' + res.statusCode));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  for (const url of servers) {
    try {
      const data = await fetchUrl(url);
      fs.writeFileSync('karnataka_police_osm.json', data, 'utf8');
      const parsed = JSON.parse(data);
      console.log('SUCCESS! Total elements:', parsed.elements.length);
      console.log('File size:', data.length, 'bytes');
      parsed.elements.slice(0, 10).forEach((el, i) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        console.log(i+1, '|', el.id, '|', lat, '|', lon, '|', el.tags?.name || 'Unnamed');
      });
      return;
    } catch (e) {
      console.error('Failed:', e.message);
    }
  }
  console.error('All servers failed');
}

main();
