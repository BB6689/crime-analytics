import React, { useState, useMemo } from 'react';
import { Search, Shield, Phone, User, Navigation, CheckCircle2, ShieldAlert } from 'lucide-react';
import { POLICE_STATIONS, DISTRICTS } from '../../mockData/incidentData';
import { translations } from '../../translations';

export default function StationBrowser({ lang = 'en', onLocate }) {
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [minSolvedRate, setMinSolvedRate] = useState('');
  const [minStaff, setMinStaff] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filtered list memoization
  const filteredStations = useMemo(() => {
    // Reset page on filter change
    setCurrentPage(1);

    return Object.values(POLICE_STATIONS).filter((station) => {
      // 1. Text Search (Name, Officer, Phone)
      const matchesSearch = 
        station.name.toLowerCase().includes(search.toLowerCase()) ||
        (station.officerInCharge && station.officerInCharge.toLowerCase().includes(search.toLowerCase())) ||
        (station.phone && station.phone.includes(search));

      // 2. District filter
      const matchesDistrict = !selectedDistrict || station.district === selectedDistrict;

      // 3. Solved Rate filter
      const rateNum = parseInt(station.solvedRate);
      const matchesRate = !minSolvedRate || rateNum >= parseInt(minSolvedRate);

      // 4. Staff Count filter
      const matchesStaff = !minStaff || station.activeStaff >= parseInt(minStaff);

      return matchesSearch && matchesDistrict && matchesRate && matchesStaff;
    });
  }, [search, selectedDistrict, minSolvedRate, minStaff]);

  // Paginated list memoization
  const paginatedStations = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredStations.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredStations, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredStations.length / itemsPerPage));

  // Sort districts alphabetically for select dropdown
  const sortedDistricts = useMemo(() => {
    return Object.keys(DISTRICTS).sort((a, b) => {
      const nameA = translations[lang].districts[a] || DISTRICTS[a].name;
      const nameB = translations[lang].districts[b] || DISTRICTS[b].name;
      return nameA.localeCompare(nameB);
    });
  }, [lang]);

  return (
    <div className="visualizer-split" style={{ fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      {/* Sidebar: Filters & Stats */}
      <div className="control-sidebar">
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
            <Search size={16} className="brand-logo" />
            {translations[lang].stationBrowser.title}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Text Search */}
            <div className="filter-group" style={{ position: 'relative' }}>
              <label className="filter-label">{translations[lang].stationBrowser.nameOfficerPhone}</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.1rem', fontSize: '0.8rem' }}
                  placeholder={translations[lang].stationBrowser.placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* District Select */}
            <div className="filter-group">
              <label className="filter-label">{translations[lang].stationBrowser.divisionDistrict}</label>
              <select
                className="form-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">{translations[lang].stationBrowser.allDivisions} ({sortedDistricts.length})</option>
                {sortedDistricts.map(key => (
                  <option key={key} value={key}>
                    {translations[lang].districts[key] || DISTRICTS[key].name.replace(' (District)', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Case Solved Rate Filter */}
            <div className="filter-group">
              <label className="filter-label">{translations[lang].stationBrowser.minSolved}</label>
              <select
                className="form-select"
                value={minSolvedRate}
                onChange={(e) => setMinSolvedRate(e.target.value)}
              >
                <option value="">{translations[lang].stationBrowser.anySolveRate}</option>
                <option value="75">75% {translations[lang].stationBrowser.orHigher}</option>
                <option value="80">80% {translations[lang].stationBrowser.orHigher}</option>
                <option value="85">85% {translations[lang].stationBrowser.orHigher}</option>
                <option value="90">90% {translations[lang].stationBrowser.orHigher}</option>
              </select>
            </div>

            {/* Personnel Count Filter */}
            <div className="filter-group">
              <label className="filter-label">{translations[lang].stationBrowser.activeDuty}</label>
              <select
                className="form-select"
                value={minStaff}
                onChange={(e) => setMinStaff(e.target.value)}
              >
                <option value="">{translations[lang].stationBrowser.anyStaff}</option>
                <option value="20">20+ {translations[lang].stationBrowser.personnel}</option>
                <option value="30">30+ {translations[lang].stationBrowser.personnel}</option>
                <option value="35">35+ {translations[lang].stationBrowser.personnel}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database Stats Panel */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--primary)' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={14} />
            {translations[lang].stationBrowser.commandDb}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div>{translations[lang].stationBrowser.totalLoaded} <strong style={{ color: 'var(--text-primary)' }}>{Object.keys(POLICE_STATIONS).length}</strong></div>
            <div>{translations[lang].stationBrowser.matchesFilter} <strong style={{ color: 'var(--text-primary)' }}>{filteredStations.length}</strong></div>
            <div>{translations[lang].stationBrowser.displayingPage} <strong style={{ color: 'var(--text-primary)' }}>{currentPage} {translations[lang].stationBrowser.of} {totalPages}</strong></div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Structure: <strong>ParentUnit → Child Stations</strong> (ER Hierarchy)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="glass-panel scrollable">
        <div className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} style={{ color: 'var(--primary-light)' }} />
            {translations[lang].stationBrowser.directoryTitle}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
            {translations[lang].stationBrowser.showing} {filteredStations.length} {translations[lang].stationBrowser.stationsKarnataka}
          </span>
        </div>

        <div className="panel-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
          {/* Cards Grid */}
          {filteredStations.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
              gap: '1rem', 
              overflowY: 'auto',
              flex: 1,
              alignContent: 'start',
              paddingBottom: '1rem'
            }}>
              {paginatedStations.map((station) => {
                const distName = translations[lang].districts[station.district] || DISTRICTS[station.district]?.name.replace(' (District)', '') || station.district;
                
                return (
                  <div 
                    key={station.id} 
                    className="station-card-interactive" 
                    onClick={() => onLocate(station)}
                    style={{ 
                      padding: '1rem', 
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease-in-out'
                    }}
                  >
                    {/* Card Header - Clean Title without Icon */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', minHeight: '26px' }}>
                        <h4 style={{ 
                          fontSize: '0.88rem', 
                          fontWeight: 700, 
                          color: 'var(--text-primary)', 
                          fontFamily: 'var(--font-title)',
                          margin: 0,
                          padding: 0,
                          lineHeight: 1.4
                        }}>
                          {station.name}
                        </h4>
                        <span style={{ 
                          fontSize: '0.58rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          color: 'var(--primary-light)', 
                          backgroundColor: 'var(--primary-dim)', 
                          border: '1px solid var(--border)',
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '10px',
                          letterSpacing: '0.04em',
                          flexShrink: 0
                        }}>
                          {distName}
                        </span>
                      </div>
                      
                      {/* Officer and Contact */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {station.officerInCharge && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={12} style={{ color: 'var(--text-muted)' }} />
                            <span>{station.officerInCharge}</span>
                          </div>
                        )}
                        {station.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{station.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Curated Meta Stats list */}
                    {station.source === 'curated' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem 0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.7rem' }}>
                        <div>{lang === 'kn' ? 'ಸಿಬ್ಬಂದಿ:' : 'Staff:'} <strong style={{ color: 'var(--text-primary)' }}>{station.activeStaff}</strong></div>
                        <div>{lang === 'kn' ? 'ವಾಹನಗಳು:' : 'Vehicles:'} <strong style={{ color: 'var(--text-primary)' }}>{station.patrolVehicles}</strong></div>
                      </div>
                    )}

                    {/* OSM Meta Coordinates list */}
                    {station.source === 'openstreetmap' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.5rem 0.6rem', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <div>{translations[lang].mapControls.gpsCoords} <strong style={{ color: 'var(--accent-cyan)' }}>{station.coords[0].toFixed(5)}, {station.coords[1].toFixed(5)}</strong></div>
                        <div>{translations[lang].mapControls.source} <span style={{ color: 'var(--text-muted)' }}>{translations[lang].stationBrowser.verifiedOsm}</span></div>
                      </div>
                    )}

                    {/* Curated Solve Rate Progress bar */}
                    {station.source === 'curated' && station.solvedRate && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.22rem', fontSize: '0.7rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].stationBrowser.solvedRateLabel}</span>
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{station.solvedRate}</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: station.solvedRate, background: 'var(--green)', borderRadius: '2px' }} />
                        </div>
                      </div>
                    )}

                    {/* Locate Button */}
                    <button 
                      className="btn btn-secondary btn-full" 
                      style={{ minHeight: '32px', fontSize: '0.72rem', padding: '0.3rem', gap: '0.35rem', marginTop: '0.2rem', pointerEvents: 'none' }}
                    >
                      <Navigation size={11} style={{ transform: 'rotate(45deg)' }} />
                      {translations[lang].stationBrowser.locateMap}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
              <ShieldAlert size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.85rem' }}>{lang === 'kn' ? 'ಪ್ರಸ್ತುತ ಫಿಲ್ಟರ್ ಮಾನದಂಡಗಳಿಗೆ ಯಾವುದೇ ಪೊಲೀಸ್ ಠಾಣೆಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.' : 'No police stations match the current filter criteria.'}</p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredStations.length > itemsPerPage && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid var(--border)',
              marginTop: '0.75rem',
              flexShrink: 0
            }}>
              <button
                className="btn btn-secondary"
                style={{ minHeight: '32px', padding: '0 0.75rem', fontSize: '0.75rem' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                {translations[lang].stationBrowser.previous}
              </button>
              
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {translations[lang].stationBrowser.page} <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> {translations[lang].stationBrowser.of} <strong>{totalPages}</strong>
              </span>
              
              <button
                className="btn btn-secondary"
                style={{ minHeight: '32px', padding: '0 0.75rem', fontSize: '0.75rem' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                {translations[lang].stationBrowser.next}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
