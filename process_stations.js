import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('karnataka_police_osm.json', 'utf8'));
const elements = raw.elements;

console.log('Total OSM elements:', elements.length);

// Filter to only Karnataka bounding box and valid coords
// Karnataka: roughly 11.5-18.5N, 74.0-78.6E
const karnatakaBounds = { minLat: 11.5, maxLat: 18.5, minLon: 74.0, maxLon: 78.6 };

// Also filter out stations clearly outside Karnataka (like Hyderabad/Telangana)
// Telangana is roughly east of 78.5 or north of 18.5
const stations = elements
  .filter(el => {
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    if (!lat || !lon) return false;
    // Filter to Karnataka proper (exclude Telangana cities like Hyderabad)
    // Hyderabad is at ~17.4N, 78.5E - outside Karnataka
    if (lon > 78.4 && lat > 17.0) return false; // Telangana region
    return lat >= karnatakaBounds.minLat && lat <= karnatakaBounds.maxLat &&
           lon >= karnatakaBounds.minLon && lon <= karnatakaBounds.maxLon;
  })
  .map(el => {
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    const tags = el.tags || {};
    return {
      osmId: el.id,
      name: tags.name || tags['name:en'] || 'Police Station',
      nameKn: tags['name:kn'] || null,
      lat: parseFloat(lat.toFixed(6)),
      lon: parseFloat(lon.toFixed(6)),
      operator: tags.operator || null,
      phone: tags.phone || tags['contact:phone'] || null,
      address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || null,
      website: tags.website || null,
    };
  });

console.log('Filtered Karnataka stations:', stations.length);

// Show distribution by rough district
const byRegion = {};
stations.forEach(s => {
  let region = 'Other';
  if (s.lat > 12.5 && s.lat < 13.5 && s.lon > 77.3 && s.lon < 77.9) region = 'Bengaluru';
  else if (s.lat > 12.2 && s.lat < 12.5 && s.lon > 76.5 && s.lon < 76.9) region = 'Mysuru';
  else if (s.lat > 14.9 && s.lat < 15.5 && s.lon > 75.0 && s.lon < 75.4) region = 'Dharwad/Hubballi';
  else if (s.lat > 15.3 && s.lat < 16.2 && s.lon > 74.8 && s.lon < 75.3) region = 'Belagavi';
  else if (s.lat > 13.1 && s.lat < 13.5 && s.lon > 77.5 && s.lon < 77.7) region = 'Tumkur';
  else if (s.lat > 14.0 && s.lat < 14.8 && s.lon > 76.0 && s.lon < 76.5) region = 'Chitradurga';
  else if (s.lat > 13.3 && s.lat < 13.8 && s.lon > 74.7 && s.lon < 75.1) region = 'Mangaluru/Coastal';
  byRegion[region] = (byRegion[region] || 0) + 1;
});

console.log('\nBy region:');
Object.entries(byRegion).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(' ', k, ':', v));

// Output to JS file for use in app
const output = `// Real Karnataka Police Stations - sourced from OpenStreetMap via Overpass API
// Total: ${stations.length} stations with actual GPS coordinates
// Last updated: ${new Date().toISOString().split('T')[0]}

export const realPoliceStations = ${JSON.stringify(stations, null, 2)};
`;

fs.writeFileSync('src/mockData/realPoliceStations.js', output, 'utf8');
console.log('\nWrote src/mockData/realPoliceStations.js');
console.log('Sample stations:');
stations.slice(0, 5).forEach(s => console.log(` - ${s.name} [${s.lat}, ${s.lon}]`));
