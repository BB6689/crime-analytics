#!/usr/bin/env python3
"""Script to update SCRBBoard.jsx with Station-wise & Officer-wise Reports and rename SCRB tab in App.jsx"""
import os

scrb_content = r"""import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  FileText, Search, CheckCircle, XCircle, AlertTriangle,
  Users, Scale, TrendingUp, TrendingDown, RefreshCw,
  Building2, UserCheck, Shield, Filter, Download
} from 'lucide-react';

const CHARGESHEET_LABELS = { A: 'Chargesheeted', B: 'False Case', C: 'Undetected' };
const CHARGESHEET_COLORS = { A: '#10b981', B: '#ef4444', C: '#f97316' };
const PIE_PALETTE = ['#00f0ff','#ccff00','#a855f7','#f97316','#ef4444','#10b981','#eab308','#005eb8'];
const GENDER_COLORS = { Male: '#005eb8', Female: '#a855f7', Transgender: '#f97316' };
const TOOLTIP_STYLE = { background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, color: '#f8fafc' };
const MONTH_MAP = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };

function formatMonth(m) {
  if (!m) return m;
  const [y, mo] = m.split('-');
  return (MONTH_MAP[mo] || mo) + ' ' + y;
}

function KPITile({ icon: Icon, label, value, sub, color = '#00f0ff', trend, trendUp }) {
  return (
    <div style={{ background:'var(--bg-surface)', border:`1px solid ${color}33`, borderLeft:`4px solid ${color}`, borderRadius:'var(--radius-md)', padding:'1rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.35rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-10px', right:'-10px', opacity:0.06 }}><Icon size={70} color={color} /></div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize:'1.9rem', fontWeight:900, color, fontFamily:'var(--font-mono)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)' }}>{sub}</div>}
      {trend && (
        <div style={{ fontSize:'0.68rem', color:trendUp?'#10b981':'#f97316', display:'flex', alignItems:'center', gap:'3px' }}>
          {trendUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>} {trend}
        </div>
      )}
    </div>
  );
}

function SCard({ title, children, style = {} }) {
  return (
    <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1rem', ...style }}>
      <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem', marginBottom:'0.75rem' }}>{title}</div>
      {children}
    </div>
  );
}

function EmptyState({ message, sub, small }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:small?'0.5rem':'1.5rem', color:'var(--text-secondary)', gap:'4px' }}>
      <div style={{ fontSize:small?'0.68rem':'0.78rem', fontWeight:600 }}>{message}</div>
      {sub && <div style={{ fontSize:'0.65rem', color:'#475569', textAlign:'center' }}>{sub}</div>}
    </div>
  );
}

function computeFromIncidents(list) {
  const byStatus = {}, byCrimeHead = {}, byMonth = {};
  list.forEach(inc => {
    const s = inc.Status || inc.status || 'Under Investigation';
    byStatus[s] = (byStatus[s] || 0) + 1;
    const head = inc.MajorHead || inc.type || 'Unknown';
    byCrimeHead[head] = (byCrimeHead[head] || 0) + 1;
    const d = new Date(inc.CrimeRegisteredDate || inc.crimeRegisteredDate || inc.date);
    if (!isNaN(d)) {
      const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      byMonth[k] = (byMonth[k] || 0) + 1;
    }
  });
  return {
    totalCases: list.length,
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    byCrimeHead: Object.entries(byCrimeHead).map(([name, count]) => ({ name, count })),
    byGravity: [], byCrimeSubHead: [],
    byMonth: Object.entries(byMonth).sort((a,b) => b[0].localeCompare(a[0])).slice(0,12).map(([month, count]) => ({ month, count })),
    victimGender: [], victimAge: [], accusedGender: [], accusedAge: [],
    topSections: [], chargesheetTypes: [], totalArrests: 0,
    complainantOccupation: [], complainantReligion: []
  };
}

export default function SCRBBoard({ lang = 'en', incidentsList = [] }) {
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'station' | 'officer'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stationFilter, setStationFilter] = useState('');
  const [officerSearch, setOfficerSearch] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/server/police_fir_api/api/analytics');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setAnalytics(await res.json());
    } catch (e) {
      console.warn('Analytics API unavailable:', e.message);
      setAnalytics(computeFromIncidents(incidentsList));
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);
  useEffect(() => { if (incidentsList.length > 0 && !analytics) setAnalytics(computeFromIncidents(incidentsList)); }, [incidentsList]);

  // Compute Station-Wise Aggregation Report
  const stationReports = useMemo(() => {
    const map = new Map();
    incidentsList.forEach(inc => {
      const stName = inc.PoliceStation || inc.UnitName || inc.policeStationName || 'Station Headquarters';
      if (!map.has(stName)) {
        map.set(stName, {
          station: stName,
          total: 0,
          underInv: 0,
          chargesheeted: 0,
          closed: 0,
          heinous: 0,
          arrests: 0
        });
      }
      const item = map.get(stName);
      item.total++;
      const st = inc.Status || inc.status || '';
      if (st.includes('Investigation') || st === 'Active') item.underInv++;
      else if (st.includes('Charge')) item.chargesheeted++;
      else if (st.includes('Closed') || st.includes('Disposed')) item.closed++;

      if ((inc.Gravity || '').includes('Heinous') && !(inc.Gravity || '').includes('Non')) item.heinous++;
      if (inc.accused && inc.accused.name) item.arrests++;
    });

    return Array.from(map.values()).map(s => ({
      ...s,
      detectionRate: s.total > 0 ? Math.round((s.chargesheeted / s.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [incidentsList]);

  // Compute Officer-Wise Aggregation Report
  const officerReports = useMemo(() => {
    const map = new Map();
    incidentsList.forEach(inc => {
      const officer = inc.OfficerName || inc.policePersonName || inc.officer || 'PSI Officer';
      const stName = inc.PoliceStation || inc.UnitName || 'Precinct Command';
      if (!map.has(officer)) {
        map.set(officer, {
          officer,
          station: stName,
          total: 0,
          underInv: 0,
          chargesheeted: 0,
          closed: 0,
          arrests: 0
        });
      }
      const item = map.get(officer);
      item.total++;
      const st = inc.Status || inc.status || '';
      if (st.includes('Investigation') || st === 'Active') item.underInv++;
      else if (st.includes('Charge')) item.chargesheeted++;
      else if (st.includes('Closed') || st.includes('Disposed')) item.closed++;

      if (inc.accused && inc.accused.name) item.arrests++;
    });

    return Array.from(map.values()).map(o => ({
      ...o,
      detectionRate: o.total > 0 ? Math.round((o.chargesheeted / o.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [incidentsList]);

  const filteredStations = useMemo(() => {
    if (!stationFilter) return stationReports;
    return stationReports.filter(s => s.station.toLowerCase().includes(stationFilter.toLowerCase()));
  }, [stationReports, stationFilter]);

  const filteredOfficers = useMemo(() => {
    if (!officerSearch) return officerReports;
    const q = officerSearch.toLowerCase();
    return officerReports.filter(o => o.officer.toLowerCase().includes(q) || o.station.toLowerCase().includes(q));
  }, [officerReports, officerSearch]);

  const kpis = useMemo(() => {
    if (!analytics) return null;
    const { byStatus = [], chargesheetTypes = [], totalCases, totalArrests } = analytics;
    const findCount = (arr, pred) => { const found = arr.find(pred); return found ? found.count : 0; };
    const underInv = findCount(byStatus, s => s.status && s.status.includes('Investigation'));
    const chargesheeted = findCount(byStatus, s => s.status && s.status.includes('Charge'));
    const closed = findCount(byStatus, s => s.status && (s.status.includes('Closed') || s.status.includes('Disposed')));
    const falseCase = findCount(chargesheetTypes, c => c.cstype === 'B');
    const detectionRate = totalCases > 0 ? Math.round((chargesheeted / totalCases) * 100) : 0;
    const heinous = analytics.byGravity ? findCount(analytics.byGravity, g => g.gravity && g.gravity.includes('Heinous') && !g.gravity.includes('Non')) : 0;
    return { underInv, chargesheeted, closed, totalArrests: totalArrests || 0, detectionRate, falseCase, heinous };
  }, [analytics]);

  const monthlyData = useMemo(() => {
    if (!analytics || !analytics.byMonth) return [];
    return [...analytics.byMonth].reverse().map(m => ({ ...m, month: formatMonth(m.month) }));
  }, [analytics]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTop:'3px solid #00f0ff', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <span style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>Loading SCRB Intelligence Board...</span>
    </div>
  );
  if (!analytics) return null;

  const statusFunnelData = [
    { name:'Registered', count:analytics.totalCases, color:'#00f0ff' },
    ...(analytics.byStatus || []).map(s => ({
      name: s.status, count: s.count,
      color: s.status && s.status.includes('Investigation') ? '#eab308' : s.status && s.status.includes('Charge') ? '#a855f7' : '#10b981'
    }))
  ];
  const crimeHeadData = analytics.byCrimeHead || [];
  const victimGenderData = (analytics.victimGender || []).map(g => ({ name: g.gender, value: g.count }));
  const accusedGenderData = (analytics.accusedGender || []).map(g => ({ name: g.gender, value: g.count }));
  const chargesheetData = (analytics.chargesheetTypes || []).map(c => ({
    name: CHARGESHEET_LABELS[c.cstype] || c.cstype,
    value: c.count,
    color: CHARGESHEET_COLORS[c.cstype] || '#64748b'
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem', padding:'1rem', overflowY:'auto', height:'100%' }}>
      {/* Top Controls Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <h2 style={{ fontSize:'0.95rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-primary)', fontFamily:'var(--font-title)', margin:0 }}>SCRB Intelligence Dashboard</h2>
          <p style={{ fontSize:'0.68rem', color:'var(--text-secondary)', margin:'2px 0 0' }}>
            State Crime Records Bureau Aggregated Analytics
            {lastUpdated && (' · Updated ' + lastUpdated.toLocaleTimeString())}
          </p>
        </div>

        {/* View Mode Switcher Buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'3px' }}>
          <button
            onClick={() => setViewMode('overview')}
            style={{ background: viewMode === 'overview' ? 'var(--primary)' : 'transparent', color: viewMode === 'overview' ? '#000' : 'var(--text-secondary)', border:'none', borderRadius:4, padding:'0.35rem 0.85rem', fontSize:'0.72rem', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.15s' }}
          >
            <Shield size={13}/> State Overview
          </button>
          <button
            onClick={() => setViewMode('station')}
            style={{ background: viewMode === 'station' ? 'var(--primary)' : 'transparent', color: viewMode === 'station' ? '#000' : 'var(--text-secondary)', border:'none', borderRadius:4, padding:'0.35rem 0.85rem', fontSize:'0.72rem', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.15s' }}
          >
            <Building2 size={13}/> Station-Wise Report
          </button>
          <button
            onClick={() => setViewMode('officer')}
            style={{ background: viewMode === 'officer' ? 'var(--primary)' : 'transparent', color: viewMode === 'officer' ? '#000' : 'var(--text-secondary)', border:'none', borderRadius:4, padding:'0.35rem 0.85rem', fontSize:'0.72rem', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.15s' }}
          >
            <UserCheck size={13}/> Police-Wise Report
          </button>
        </div>

        <button onClick={fetchAnalytics} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'0.35rem 0.75rem', color:'var(--text-secondary)', fontSize:'0.72rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>

      {/* VIEW MODE 1: STATE OVERVIEW */}
      {viewMode === 'overview' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem' }}>
            <KPITile icon={FileText}      label="Total FIRs"          value={analytics.totalCases}                        sub="All registered cases"    color="#00f0ff"/>
            <KPITile icon={Search}        label="Under Investigation"  value={kpis ? kpis.underInv : 0}                   sub="Pending resolution"      color="#eab308"/>
            <KPITile icon={Scale}         label="Charge Sheeted"       value={kpis ? kpis.chargesheeted : 0}              sub="Filed before court"      color="#a855f7"/>
            <KPITile icon={CheckCircle}   label="Closed/Disposed"      value={kpis ? kpis.closed : 0}                     sub="Final resolution"        color="#10b981"/>
            <KPITile icon={AlertTriangle} label="Heinous Crimes"       value={kpis ? kpis.heinous : 0}                    sub="High gravity offences"   color="#ef4444"/>
            <KPITile icon={Users}         label="Arrests Made"         value={kpis ? kpis.totalArrests : 0}               sub="ArrestSurrender records" color="#005eb8"/>
            <KPITile icon={TrendingUp}    label="Detection Rate"       value={(kpis ? kpis.detectionRate : 0) + '%'}      sub="Chargesheeted / Total"   color="#ccff00" trend={(kpis && kpis.detectionRate > 50) ? 'Above target' : 'Below 50% target'} trendUp={!!(kpis && kpis.detectionRate > 50)}/>
            <KPITile icon={XCircle}       label="False Cases"          value={kpis ? kpis.falseCase : 0}                  sub="Chargesheet type B"      color="#f97316"/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr', gap:'1rem', minHeight:'270px' }}>
            <SCard title="Case Status Pipeline">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={statusFunnelData} layout="vertical" margin={{ left:10, right:30, top:5, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                  <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={125}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                  <Bar dataKey="count" radius={[0,3,3,0]} label={{ position:'right', fill:'#94a3b8', fontSize:10 }}>
                    {statusFunnelData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SCard>

            <SCard title="Crime Group Breakdown">
              {crimeHeadData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={crimeHeadData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="count" nameKey="name">
                        {crimeHeadData.map((_,i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {crimeHeadData.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.67rem', color:'var(--text-secondary)', marginBottom:3 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:PIE_PALETTE[i % PIE_PALETTE.length], flexShrink:0 }}/>
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                      <strong style={{ color:'var(--text-primary)' }}>{d.count}</strong>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No crime group data"/>}
            </SCard>

            <SCard title="Final Report Outcomes">
              {chargesheetData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={chargesheetData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" nameKey="name">
                        {chargesheetData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {chargesheetData.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.67rem', color:'var(--text-secondary)', marginBottom:3 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:d.color, flexShrink:0 }}/>
                      <span style={{ flex:1 }}>{d.name}</span>
                      <strong style={{ color:'var(--text-primary)' }}>{d.value}</strong>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No chargesheet data yet" sub="Final reports appear after chargesheet filing"/>}
            </SCard>
          </div>

          <SCard title="Monthly FIR Registration Trend">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyData} margin={{ left:0, right:20, top:5, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE}/>
                  <Line type="monotone" dataKey="count" stroke="#00f0ff" strokeWidth={2} dot={{ fill:'#00f0ff', r:3 }} name="FIRs"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No monthly trend data" sub="Trend appears as FIRs are registered over multiple months"/>}
          </SCard>
        </>
      )}

      {/* VIEW MODE 2: STATION-WISE REPORT */}
      {viewMode === 'station' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'0.75rem 1rem', display:'flex', gap:'1rem', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1, maxWidth:360 }}>
              <Search size={14} color="var(--text-secondary)"/>
              <input
                className="form-input"
                style={{ fontSize:'0.75rem', padding:'0.35rem 0.6rem' }}
                placeholder="Search Police Station..."
                value={stationFilter}
                onChange={e => setStationFilter(e.target.value)}
              />
            </div>
            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
              Showing <strong>{filteredStations.length}</strong> Police Station Reports
            </span>
          </div>

          <SCard title="Station-Wise Performance & Case Disposal Report">
            {filteredStations.length > 0 ? (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
                      {['Police Station Name', 'Total FIRs', 'Under Investigation', 'Chargesheeted', 'Closed', 'Heinous Crimes', 'Detection Rate'].map(h => (
                        <th key={h} style={{ padding:'0.6rem 0.8rem', textAlign:'left', fontSize:'0.66rem', fontWeight:800, textTransform:'uppercase', color:'var(--text-secondary)', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStations.map((s, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', fontWeight:700, color:'#00f0ff' }}>
                          <Building2 size={13} style={{ verticalAlign:'middle', marginRight:6, color:'#005eb8' }}/>
                          {s.station}
                        </td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', fontWeight:800, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{s.total}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#eab308', fontFamily:'var(--font-mono)' }}>{s.underInv}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#a855f7', fontFamily:'var(--font-mono)' }}>{s.chargesheeted}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#10b981', fontFamily:'var(--font-mono)' }}>{s.closed}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#ef4444', fontFamily:'var(--font-mono)' }}>{s.heinous}</td>
                        <td style={{ padding:'0.6rem 0.8rem' }}>
                          <span style={{ background: s.detectionRate >= 50 ? '#10b98122' : '#f9731622', border: `1px solid ${s.detectionRate >= 50 ? '#10b98155' : '#f9731655'}`, color: s.detectionRate >= 50 ? '#10b981' : '#f97316', borderRadius:4, padding:'2px 8px', fontSize:'0.68rem', fontWeight:800, fontFamily:'var(--font-mono)' }}>
                            {s.detectionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState message="No station reports match filter" sub="Register FIRs or adjust search"/>}
          </SCard>
        </div>
      )}

      {/* VIEW MODE 3: POLICE / OFFICER-WISE REPORT */}
      {viewMode === 'officer' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'0.75rem 1rem', display:'flex', gap:'1rem', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1, maxWidth:360 }}>
              <Search size={14} color="var(--text-secondary)"/>
              <input
                className="form-input"
                style={{ fontSize:'0.75rem', padding:'0.35rem 0.6rem' }}
                placeholder="Search Investigating Officer / Station..."
                value={officerSearch}
                onChange={e => setOfficerSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
              Showing <strong>{filteredOfficers.length}</strong> Police Officers
            </span>
          </div>

          <SCard title="Investigating Officer Performance & Case Workload Report">
            {filteredOfficers.length > 0 ? (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
                      {['Officer Name (IO)', 'Assigned Station', 'Cases Assigned', 'Under Investigation', 'Chargesheeted', 'Closed', 'Detection Rate'].map(h => (
                        <th key={h} style={{ padding:'0.6rem 0.8rem', textAlign:'left', fontSize:'0.66rem', fontWeight:800, textTransform:'uppercase', color:'var(--text-secondary)', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficers.map((o, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', fontWeight:700, color:'var(--text-primary)' }}>
                          <UserCheck size={13} style={{ verticalAlign:'middle', marginRight:6, color:'#00f0ff' }}/>
                          {o.officer}
                        </td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.72rem', color:'var(--text-secondary)' }}>{o.station}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', fontWeight:800, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{o.total}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#eab308', fontFamily:'var(--font-mono)' }}>{o.underInv}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#a855f7', fontFamily:'var(--font-mono)' }}>{o.chargesheeted}</td>
                        <td style={{ padding:'0.6rem 0.8rem', fontSize:'0.75rem', color:'#10b981', fontFamily:'var(--font-mono)' }}>{o.closed}</td>
                        <td style={{ padding:'0.6rem 0.8rem' }}>
                          <span style={{ background: o.detectionRate >= 50 ? '#10b98122' : '#f9731622', border: `1px solid ${o.detectionRate >= 50 ? '#10b98155' : '#f9731655'}`, color: o.detectionRate >= 50 ? '#10b981' : '#f97316', borderRadius:4, padding:'2px 8px', fontSize:'0.68rem', fontWeight:800, fontFamily:'var(--font-mono)' }}>
                            {o.detectionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState message="No officer reports match filter" sub="Register FIRs or adjust search"/>}
          </SCard>
        </div>
      )}
    </div>
  );
}
"""

with open('src/components/SCRBBoard/SCRBBoard.jsx', 'w', encoding='utf-8') as f:
    f.write(scrb_content)

print('Updated SCRBBoard.jsx with Station-wise & Officer-wise Reports')
