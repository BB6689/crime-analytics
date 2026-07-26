import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { INCIDENTS, DISTRICTS, POLICE_STATIONS, CRIME_TYPES } from '../../mockData/incidentData';
import { translations } from '../../translations';

const GEOJSON_NAME_TO_DISTRICT_KEY = {
  'Bagalkote': 'BAGALKOT',
  'Ballari': 'BALLARI',
  'Belagavi': 'BELAGAVI_DIST',
  'Bengaluru Urban': 'BENGALURU_CITY',
  'Bengaluru Rural': 'BENGALURU_DIST',
  'Bidar': 'BIDAR',
  'Chamarajanagara': 'CHAMARAJANAGAR',
  'Chikkaballapura': 'CHICKBALLAPURA',
  'Chikkamagaluru': 'CHIKKAMAGALURU',
  'Chitradurga': 'CHITRADURGA',
  'Chikballapur': 'CHICKBALLAPURA',
  'Kolar': 'KOLAR',
  'Ramanagara': 'BENGALURU_SOUTH',
  'Tumakuru': 'TUMAKURU',
  'Davanagere': 'DAVANAGERE',
  'Shivamogga': 'SHIVAMOGGA',
  'Dakshina Kannada': 'DAKSHINA_KANNADA',
  'Udupi': 'UDUPI',
  'Uttara Kannada': 'UTTARA_KANNADA',
  'Kalaburagi': 'KALABURAGI',
  'Yadgir': 'Yadgir',
  'Raichur': 'RAICHUR',
  'Koppal': 'KOPPAL',
  'Vijayapura': 'VIJAYAPUR',
  'Hassan': 'HASSAN',
  'Haveri': 'HAVERI',
  'Dharwad': 'DHARWAD',
  'Gadag': 'GADAG',
  'Mandya': 'MANDYA',
  'Mysuru': 'MYSURU_DIST',
  'Kodagu': 'KODAGU',
};



export default function CrimeMap({
  lang = 'en',
  theme = 'dark',
  selectedDistrict,
  setSelectedDistrict,
  selectedPoliceStationId,
  setSelectedPoliceStationId,
  selectedIncident,
  setSelectedIncident,
  activeFilters,
  incidentsList
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(L.layerGroup());
  const districtsLayerRef = useRef(L.layerGroup());
  const stateOutlineLayerRef = useRef(L.layerGroup());
  const policeStationsLayerRef = useRef(L.layerGroup());
  const trajectoryLayerRef = useRef(L.layerGroup());
  const tileLayerRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [geojsonData, setGeojsonData] = useState(null);
  const [stateOutlineData, setStateOutlineData] = useState(null);

  // Load GeoJSONs (Districts + Dedicated State Outer Perimeter)
  useEffect(() => {
    fetch('./karnataka.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && data.features) setGeojsonData(data);
      })
      .catch(err => console.error('Error loading karnataka.geojson:', err));

    fetch('./karnataka_state_outline.geojson')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && data.features) setStateOutlineData(data);
      })
      .catch(err => console.error('Error loading karnataka_state_outline.geojson:', err));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [15.3173, 75.7139],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
      preferCanvas: true
    });

    const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
      subdomains: 'abcd'
    });

    const lightTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
      subdomains: 'abcd'
    });

    const currentTile = theme === 'dark' ? darkTile : lightTile;
    currentTile.addTo(map);
    tileLayerRef.current = { dark: darkTile, light: lightTile, current: currentTile };

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    stateOutlineLayerRef.current.addTo(map);
    districtsLayerRef.current.addTo(map);
    policeStationsLayerRef.current.addTo(map);
    markersLayerRef.current.addTo(map);
    trajectoryLayerRef.current.addTo(map);

    setMapReady(true);
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Theme Tile Swap
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const { dark, light, current } = tileLayerRef.current;
    const next = theme === 'dark' ? dark : light;
    if (next !== current) {
      mapRef.current.removeLayer(current);
      next.addTo(mapRef.current);
      tileLayerRef.current.current = next;
    }
  }, [theme]);

  // Render State Perimeter Boundary & District Outlines
  useEffect(() => {
    if (!mapReady) return;
    districtsLayerRef.current.clearLayers();
    stateOutlineLayerRef.current.clearLayers();

    const isDark = theme === 'dark';

    // 1. STATE OUTER PERIMETER BOUNDARY (Karnataka State Boundary)
    if (stateOutlineData) {
      // Outer ambient glow border for Karnataka state
      const stateGlowLayer = L.geoJSON(stateOutlineData, {
        style: () => ({
          fill: false,
          weight: isDark ? 7 : 6,
          color: isDark ? '#0284c7' : '#2563eb',
          opacity: isDark ? 0.55 : 0.40,
          lineCap: 'round',
          lineJoin: 'round'
        })
      });

      // Sharp high-contrast Karnataka State outer border stroke
      const stateBorderLayer = L.geoJSON(stateOutlineData, {
        style: () => ({
          fill: false,
          weight: isDark ? 3.5 : 2.8,
          color: isDark ? '#00f5ff' : '#1d4ed8',
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        })
      });

      stateOutlineLayerRef.current.addLayer(stateGlowLayer);
      stateOutlineLayerRef.current.addLayer(stateBorderLayer);
    }

    // 2. INTERIOR DISTRICT BOUNDARIES
    let selectedFeatureLayer = null;

    if (geojsonData) {
      const geoJsonLayer = L.geoJSON(geojsonData, {
        style: (feature) => {
          const geojsonName = feature.properties.district;
          const distKey = GEOJSON_NAME_TO_DISTRICT_KEY[geojsonName];
          const isSelected = selectedDistrict === distKey;

          return {
            fillColor: isSelected ? '#0ea5e9' : (isDark ? '#0f172a' : '#cbd5e1'),
            weight: isSelected ? 3.5 : 1.4,
            opacity: isSelected ? 1 : 0.75,
            color: isSelected ? '#f59e0b' : (isDark ? '#38bdf8' : '#0284c7'),
            fillOpacity: isSelected ? 0.32 : 0.08
          };
        },
        onEachFeature: (feature, layer) => {
          const geojsonName = feature.properties.district;
          const distKey = GEOJSON_NAME_TO_DISTRICT_KEY[geojsonName];

          if (selectedDistrict && distKey === selectedDistrict) {
            selectedFeatureLayer = layer;
          }

          const distDisplayName = (geojsonName || distKey || '').toUpperCase();
          layer.bindTooltip(`
            <div style="font-family: var(--font-title); font-weight: 700; font-size: 11px; letter-spacing: 0.03em;">
              📍 ${distDisplayName} DISTRICT
            </div>
          `, {
            sticky: true,
            direction: 'top',
            opacity: 0.9,
            className: 'district-hover-tooltip'
          });

          layer.on({
            click: () => {
              if (distKey) {
                const nextDistrict = distKey === selectedDistrict ? null : distKey;
                setSelectedDistrict(nextDistrict);
                setSelectedPoliceStationId(null);
              }
            },
            mouseover: (e) => {
              if (selectedDistrict !== distKey) {
                e.target.setStyle({
                  fillOpacity: 0.24,
                  weight: 2.5,
                  color: '#00f5ff',
                  opacity: 1
                });
                e.target.bringToFront();
              }
            },
            mouseout: (e) => {
              if (selectedDistrict !== distKey) {
                geoJsonLayer.resetStyle(e.target);
              }
            }
          });
        }
      });

      districtsLayerRef.current.addLayer(geoJsonLayer);
    }

    // Auto-fly map to selected district region
    if (mapRef.current) {
      if (selectedFeatureLayer) {
        const bounds = selectedFeatureLayer.getBounds();
        mapRef.current.flyToBounds(bounds, { padding: [30, 30], maxZoom: 12, duration: 0.8 });
      } else if (!selectedDistrict) {
        mapRef.current.flyTo([15.3173, 75.7139], 7, { duration: 0.8 });
      }
    }
  }, [mapReady, geojsonData, stateOutlineData, selectedDistrict, theme]);

  // Main Police Stations Rendering & Regional Highlighting
  useEffect(() => {
    if (!mapReady) return;
    policeStationsLayerRef.current.clearLayers();

    const stationEntries = Object.entries(POLICE_STATIONS);

    // Collect coords for district auto-fit if GeoJSON feature wasn't matched
    const highlightedCoords = [];

    stationEntries.forEach(([stationId, station]) => {
      if (!station || !station.coords || !Array.isArray(station.coords) || station.coords.length !== 2) return;
      if (isNaN(station.coords[0]) || isNaN(station.coords[1])) return;

      const isDistrictSelected = Boolean(selectedDistrict);
      const isDistrictMatch = isDistrictSelected && station.district === selectedDistrict;
      const isStationSelected = selectedPoliceStationId === stationId;

      if (isDistrictMatch) {
        highlightedCoords.push(station.coords);
      }

      // Styling: Highlight matching district stations, dim non-matching ones
      let radius = 6;
      let fillColor = '#0066ff';
      let strokeColor = '#ffffff';
      let strokeWidth = 1.5;
      let fillOpacity = 0.9;

      if (isDistrictSelected) {
        if (isDistrictMatch) {
          radius = isStationSelected ? 10 : 8;
          fillColor = isStationSelected ? '#f59e0b' : '#00f5ff';
          strokeColor = '#ffffff';
          strokeWidth = 2.5;
          fillOpacity = 1.0;
        } else {
          // Dim non-selected district stations
          radius = 3.5;
          fillColor = '#475569';
          strokeColor = '#1e293b';
          strokeWidth = 0.8;
          fillOpacity = 0.25;
        }
      } else if (isStationSelected) {
        radius = 9;
        fillColor = '#f59e0b';
        strokeColor = '#ffffff';
        strokeWidth = 2.5;
        fillOpacity = 1.0;
      }

      const marker = L.circleMarker(station.coords, {
        radius,
        fillColor,
        color: strokeColor,
        weight: strokeWidth,
        opacity: fillOpacity,
        fillOpacity
      });

      const popupHtml = `
        <div style="font-family: var(--font-body); padding: 4px; min-width: 180px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <strong style="font-size:12px;color:var(--text-primary)">🏢 ${station.name || 'Police Station'}</strong>
          </div>
          <div style="font-size:11px;color:var(--primary);font-weight:600;margin-bottom:3px;">
            Unit ID: ${station.unitId || stationId}
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">
            District: <strong>${(station.district || '').replace('_', ' ')}</strong>
          </div>
          ${station.phone ? `<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">📞 ${station.phone}</div>` : ''}
          ${station.officerInCharge ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">In-Charge: ${station.officerInCharge}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 240 });

      // Add a tooltip for highlighted district stations
      if (isDistrictMatch) {
        marker.bindTooltip(station.name, {
          permanent: false,
          direction: 'top',
          className: 'station-map-tooltip'
        });
      }

      marker.on('click', () => {
        setSelectedPoliceStationId(stationId);
      });

      policeStationsLayerRef.current.addLayer(marker);

      if (isDistrictMatch || isStationSelected) {
        marker.bringToFront();
      }
    });

    // If GeoJSON didn't fly map, fly to highlighted station bounds
    if (mapRef.current && selectedDistrict && highlightedCoords.length > 0) {
      const bounds = L.latLngBounds(highlightedCoords);
      mapRef.current.flyToBounds(bounds, { padding: [40, 40], maxZoom: 12, duration: 0.8 });
    }
  }, [mapReady, selectedDistrict, selectedPoliceStationId, lang]);

  // Incident markers
  useEffect(() => {
    if (!mapReady) return;
    markersLayerRef.current.clearLayers();
    trajectoryLayerRef.current.clearLayers();

    const activeList = incidentsList && incidentsList.length > 0 ? incidentsList : INCIDENTS;

    const filtered = activeList.filter(inc => {
      if (selectedDistrict && inc.district !== selectedDistrict) return false;
      if (selectedPoliceStationId && inc.policeStationId !== selectedPoliceStationId) return false;
      if (activeFilters.type !== 'ALL' && inc.type !== activeFilters.type) return false;
      if (activeFilters.status !== 'ALL' && inc.status !== activeFilters.status) return false;
      if (activeFilters.timeRange && activeFilters.timeRange !== 'ALL') {
        const rawDate = inc.date || inc.crimeRegisteredDate || inc.RegisteredDate || inc.IncidentFromDate;
        if (rawDate) {
          const incTime = new Date(rawDate).getTime();
          if (!isNaN(incTime)) {
            if (activeFilters.timeRange === 'CUSTOM') {
              if (activeFilters.customFrom) {
                const f = new Date(activeFilters.customFrom).getTime();
                if (!isNaN(f) && incTime < f) return false;
              }
              if (activeFilters.customTo) {
                const t = new Date(activeFilters.customTo).getTime() + (24 * 60 * 60 * 1000 - 1);
                if (!isNaN(t) && incTime > t) return false;
              }
            } else {
              const diffDays = (Date.now() - incTime) / (1000 * 60 * 60 * 24);
              if (activeFilters.timeRange === '7D' && diffDays > 7) return false;
              if (activeFilters.timeRange === '30D' && diffDays > 30) return false;
              if (activeFilters.timeRange === '90D' && diffDays > 90) return false;
              if (activeFilters.timeRange === '180D' && diffDays > 180) return false;
              if ((activeFilters.timeRange === '1Y' || activeFilters.timeRange === '365D') && diffDays > 365) return false;
            }
          }
        }
      }
      return true;
    });

    filtered.forEach(inc => {
      if (!inc.lat || !inc.lng || isNaN(inc.lat) || isNaN(inc.lng)) return;
      const isSelected = selectedIncident && selectedIncident.id === inc.id;
      const typeInfo = CRIME_TYPES[inc.type] || { color: '#3b82f6', label: inc.type };

      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: isSelected ? 10 : 6,
        fillColor: typeInfo.color,
        color: isSelected ? '#ffffff' : typeInfo.color,
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        fillOpacity: 0.88
      });

      const popupHtml = `
        <div style="font-family: var(--font-body); padding: 4px; min-width: 170px;">
          <div style="font-size:11px;font-weight:700;color:${typeInfo.color};margin-bottom:5px;font-family:var(--font-title);text-transform:uppercase;letter-spacing:0.04em">
            ${typeInfo.label || inc.type}
          </div>
          <div style="font-weight:700;font-size:12px;color:var(--text-primary);margin-bottom:4px">
            ${inc.crimeNo ? 'Crime #' + inc.crimeNo : 'Case #' + inc.id}
          </div>
          <p style="font-size:11px;color:var(--text-secondary);margin:0 0 5px 0;line-height:1.4">
            ${(inc.briefFacts || inc.description || 'No description.').slice(0, 80)}…
          </p>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted)">
            <span>${inc.date || 'N/A'}</span>
            <span style="font-weight:700;color:${inc.status === 'Active' ? 'var(--red)' : 'var(--green)'}">${inc.status}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 220 });
      marker.on('click', () => setSelectedIncident(inc));
      markersLayerRef.current.addLayer(marker);

      if (isSelected) {
        marker.bringToFront();
      }
    });

    // Trajectory for selected incident
    if (selectedIncident && selectedIncident.locations && selectedIncident.locations.length > 1) {
      const coords = selectedIncident.locations
        .filter(loc => loc && !isNaN(parseFloat(loc.lat)) && !isNaN(parseFloat(loc.lng)))
        .map(loc => [parseFloat(loc.lat), parseFloat(loc.lng)]);
      if (coords.length > 1) {
        const polyline = L.polyline(coords, {
          color: '#0ea5e9',
          weight: 2.5,
          dashArray: '6 5',
          opacity: 0.85
        });
        trajectoryLayerRef.current.addLayer(polyline);
      }
    }
  }, [mapReady, selectedDistrict, selectedPoliceStationId, selectedIncident, activeFilters, incidentsList]);

  const isDark = theme === 'dark';
  const t = translations[lang] || translations.en;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', background: isDark ? '#181818' : '#f0f0f3' }}
      />

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: '1.1rem',
        left: '1rem',
        zIndex: 999,
        background: isDark ? 'rgba(30,30,30,0.90)' : 'rgba(248,248,249,0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.55rem 0.85rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.85rem',
        alignItems: 'center',
        boxShadow: 'var(--shadow)',
        fontSize: '0.68rem',
        fontFamily: 'var(--font-body)',
        maxWidth: '460px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '14px', height: '4px', background: isDark ? '#38bdf8' : '#1d4ed8', borderRadius: '2px', display: 'inline-block', boxShadow: '0 0 6px rgba(56, 189, 248, 0.6)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t.mapLegend?.stateBoundary || 'State Boundary'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '2px', background: isDark ? '#38bdf8' : '#0284c7', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t.mapLegend?.districtOutlines || 'District Outlines'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0066ff', border: '1.5px solid #fff', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t.mapLegend?.policeStation || 'Police Station'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f5ff', border: '1.5px solid #fff', display: 'inline-block' }} />
          <span style={{ color: '#00f5ff', fontWeight: 700 }}>{t.mapLegend?.selectedRegion || 'Selected Region'}</span>
        </div>
        {Object.entries(CRIME_TYPES).slice(0, 2).map(([key, ct]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ct.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{t.crimeTypes?.[key] || ct.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}