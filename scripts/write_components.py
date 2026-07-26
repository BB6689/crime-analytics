#!/usr/bin/env python3
"""Write React component files with proper UTF-8 encoding."""
import os

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f'Written: {path}')

SCRB = r"""import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  FileText, Search, CheckCircle, XCircle, AlertTriangle,
  Users, Scale, TrendingUp, TrendingDown, RefreshCw
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
    const s = inc.Status || 'Under Investigation';
    byStatus[s] = (byStatus[s] || 0) + 1;
    const head = inc.MajorHead || 'Unknown';
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
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:'0.9rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-primary)', fontFamily:'var(--font-title)', margin:0 }}>SCRB Intelligence Board</h2>
          <p style={{ fontSize:'0.68rem', color:'var(--text-secondary)', margin:'2px 0 0' }}>
            State Crime Records Bureau Aggregated Analytics
            {lastUpdated && (' Updated ' + lastUpdated.toLocaleTimeString())}
          </p>
        </div>
        <button onClick={fetchAnalytics} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'0.35rem 0.75rem', color:'var(--text-secondary)', fontSize:'0.72rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>

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

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <SCard title="Victim Demographics">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <div style={{ fontSize:'0.64rem', color:'var(--text-secondary)', marginBottom:'0.4rem', fontWeight:700, textTransform:'uppercase' }}>Gender Split</div>
              {victimGenderData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={90}><PieChart><Pie data={victimGenderData} cx="50%" cy="50%" outerRadius={38} dataKey="value" nameKey="name">{victimGenderData.map((d,i) => <Cell key={i} fill={GENDER_COLORS[d.name] || PIE_PALETTE[i]}/>)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE}/></PieChart></ResponsiveContainer>
                  {victimGenderData.map((d,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.67rem', color:'var(--text-secondary)', marginTop:2 }}><div style={{ width:7, height:7, borderRadius:'50%', background:GENDER_COLORS[d.name] || PIE_PALETTE[i] }}/>{d.name}: <strong style={{ color:'var(--text-primary)' }}>{d.value}</strong></div>)}
                </div>
              ) : <EmptyState message="No data" small/>}
            </div>
            <div>
              <div style={{ fontSize:'0.64rem', color:'var(--text-secondary)', marginBottom:'0.4rem', fontWeight:700, textTransform:'uppercase' }}>Age Groups</div>
              {(analytics.victimAge || []).filter(d => d.count > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={120}><BarChart data={(analytics.victimAge || []).filter(d => d.count > 0)} layout="vertical" margin={{ left:0, right:5 }}><XAxis type="number" tick={false} axisLine={false}/><YAxis type="category" dataKey="ageGroup" tick={{ fill:'#64748b', fontSize:9 }} axisLine={false} tickLine={false} width={95}/><Tooltip contentStyle={TOOLTIP_STYLE}/><Bar dataKey="count" fill="#a855f7" radius={[0,2,2,0]}/></BarChart></ResponsiveContainer>
              ) : <EmptyState message="No data" small/>}
            </div>
          </div>
        </SCard>
        <SCard title="Accused Demographics">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <div style={{ fontSize:'0.64rem', color:'var(--text-secondary)', marginBottom:'0.4rem', fontWeight:700, textTransform:'uppercase' }}>Gender Split</div>
              {accusedGenderData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={90}><PieChart><Pie data={accusedGenderData} cx="50%" cy="50%" outerRadius={38} dataKey="value" nameKey="name">{accusedGenderData.map((d,i) => <Cell key={i} fill={GENDER_COLORS[d.name] || PIE_PALETTE[i]}/>)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE}/></PieChart></ResponsiveContainer>
                  {accusedGenderData.map((d,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.67rem', color:'var(--text-secondary)', marginTop:2 }}><div style={{ width:7, height:7, borderRadius:'50%', background:GENDER_COLORS[d.name] || PIE_PALETTE[i] }}/>{d.name}: <strong style={{ color:'var(--text-primary)' }}>{d.value}</strong></div>)}
                </div>
              ) : <EmptyState message="No data" small/>}
            </div>
            <div>
              <div style={{ fontSize:'0.64rem', color:'var(--text-secondary)', marginBottom:'0.4rem', fontWeight:700, textTransform:'uppercase' }}>Age Groups</div>
              {(analytics.accusedAge || []).filter(d => d.count > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={120}><BarChart data={(analytics.accusedAge || []).filter(d => d.count > 0)} layout="vertical" margin={{ left:0, right:5 }}><XAxis type="number" tick={false} axisLine={false}/><YAxis type="category" dataKey="ageGroup" tick={{ fill:'#64748b', fontSize:9 }} axisLine={false} tickLine={false} width={95}/><Tooltip contentStyle={TOOLTIP_STYLE}/><Bar dataKey="count" fill="#ef4444" radius={[0,2,2,0]}/></BarChart></ResponsiveContainer>
              ) : <EmptyState message="No data" small/>}
            </div>
          </div>
        </SCard>
      </div>

      <SCard title="Top Legal Sections Invoked">
        {analytics.topSections && analytics.topSections.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'1rem', alignItems:'start' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.topSections.map(s => ({ name: s.actCode + ' S.' + s.sectionCode, count: s.count }))} layout="vertical" margin={{ left:10, right:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={80}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                <Bar dataKey="count" fill="#ccff00" radius={[0,3,3,0]} label={{ position:'right', fill:'#94a3b8', fontSize:9 }}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {analytics.topSections.map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'6px 8px', background:'var(--bg-elevated)', borderRadius:4, borderLeft:'3px solid ' + PIE_PALETTE[i % PIE_PALETTE.length] }}>
                  <div style={{ fontWeight:900, fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:PIE_PALETTE[i % PIE_PALETTE.length], minWidth:'80px' }}>{s.actCode} S.{s.sectionCode}</div>
                  <div style={{ flex:1, fontSize:'0.67rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{s.description || 'Section'}</div>
                  <div style={{ fontWeight:900, fontSize:'0.8rem', color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        ) : <EmptyState message="No legal section data" sub="Sections appear after FIRs are registered with Act/Section associations"/>}
      </SCard>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'1rem' }}>
        <SCard title="Crime Sub-Head Frequency">
          {analytics.byCrimeSubHead && analytics.byCrimeSubHead.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.byCrimeSubHead} layout="vertical" margin={{ left:10, right:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} width={110}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                <Bar dataKey="count" radius={[0,3,3,0]} label={{ position:'right', fill:'#94a3b8', fontSize:9 }}>
                  {analytics.byCrimeSubHead.map((_,i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No sub-head data"/>}
        </SCard>
        <SCard title="Complainant Profile">
          {analytics.complainantOccupation && analytics.complainantOccupation.length > 0 ? (
            <div>
              <div style={{ fontSize:'0.64rem', color:'var(--text-secondary)', marginBottom:'0.4rem', fontWeight:700, textTransform:'uppercase' }}>By Occupation</div>
              {analytics.complainantOccupation.map((d,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:5 }}>
                  <div style={{ flex:1, height:14, background:'var(--bg-elevated)', borderRadius:2, overflow:'hidden', position:'relative' }}>
                    <div style={{ position:'absolute', left:0, top:0, bottom:0, width: Math.round((d.count / (analytics.totalCases || 1)) * 100) + '%', background:PIE_PALETTE[i % PIE_PALETTE.length], borderRadius:2, minWidth:2 }}/>
                  </div>
                  <span style={{ fontSize:'0.67rem', color:'var(--text-secondary)', minWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                  <strong style={{ fontSize:'0.72rem', color:'var(--text-primary)', minWidth:20, textAlign:'right' }}>{d.count}</strong>
                </div>
              ))}
              {analytics.complainantReligion && analytics.complainantReligion.length > 0 && (
                <div>
                  <div style={{ fontSize:'0.64rem', color:'var(--text-secondary)', marginTop:'0.75rem', marginBottom:'0.4rem', fontWeight:700, textTransform:'uppercase' }}>By Religion</div>
                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    {analytics.complainantReligion.map((d,i) => (
                      <div key={i} style={{ background:PIE_PALETTE[i%PIE_PALETTE.length]+'22', border:'1px solid '+PIE_PALETTE[i%PIE_PALETTE.length]+'55', borderRadius:4, padding:'3px 8px', fontSize:'0.67rem', color:'var(--text-primary)' }}>{d.name}: <strong>{d.count}</strong></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <EmptyState message="No complainant data" sub="Appears after FIRs are registered with full demographics"/>}
        </SCard>
      </div>
    </div>
  );
}
"""

CASE_REGISTER = r"""import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, X, Users, Scale, FileCheck, Clock, AlertTriangle, User, Shield, BookOpen, Handshake } from 'lucide-react';

const STATUS_COLORS = {
  'Under Investigation': { text: '#eab308' },
  'Charge Sheeted': { text: '#a855f7' },
  'Closed': { text: '#10b981' },
};
const GRAVITY_COLORS = {
  'Heinous': { text: '#ef4444' },
  'Non-Heinous': { text: '#94a3b8' },
};

function Badge({ label, color = '#64748b' }) {
  return (
    <span style={{ background: color + '22', border: '1px solid ' + color + '55', color, borderRadius: 4, padding: '1px 6px', fontSize: '0.64rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
  );
}

function DetailSection({ icon: Icon, title, children, iconColor = '#00f0ff' }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
        <Icon size={13} color={iconColor}/>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '4px' }}>
      <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', minWidth: '110px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{String(value)}</span>
    </div>
  );
}

function PersonCard({ person, color = '#00f0ff', label }) {
  if (!person) return null;
  const name = person.name || person.VictimName || person.AccusedName || person.ComplainantName || '';
  const age = person.age || person.AgeYear;
  const gender = person.gender || (person.GenderID === 2 ? 'Female' : person.GenderID === 3 ? 'Transgender' : 'Male');
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid ' + color + '33', borderLeft: '3px solid ' + color, borderRadius: 6, padding: '0.6rem 0.75rem', marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color, marginBottom: '4px' }}>{label || ''} {name}</div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {age && <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Age: <strong style={{ color: 'var(--text-primary)' }}>{age}</strong></span>}
        {gender && <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Gender: <strong style={{ color: 'var(--text-primary)' }}>{gender}</strong></span>}
        {person.occupation && <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Occ: <strong style={{ color: 'var(--text-primary)' }}>{person.occupation}</strong></span>}
        {person.isPolice === 'Yes' && <Badge label="Police Victim" color="#ef4444"/>}
      </div>
    </div>
  );
}

function CaseDossier({ caseItem, onClose }) {
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  React.useEffect(() => {
    if (!caseItem) return;
    setDetailLoading(true);
    setDetail(null);
    fetch('/server/police_fir_api/api/cases/' + caseItem.CaseMasterID)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => { setDetailLoading(false); });
  }, [caseItem && caseItem.CaseMasterID]);

  if (!caseItem) return null;
  const statusColor = (STATUS_COLORS[caseItem.Status] || { text: '#94a3b8' }).text;
  const gravityColor = (GRAVITY_COLORS[caseItem.Gravity] || GRAVITY_COLORS['Non-Heinous']).text;
  const cs = detail && detail.chargesheet;
  const csTypeLabel = cs ? (cs.cstype === 'A' ? 'Chargesheeted' : cs.cstype === 'B' ? 'False Case' : cs.cstype === 'C' ? 'Undetected' : null) : null;
  const csTypeColor = cs ? (cs.cstype === 'A' ? '#10b981' : cs.cstype === 'B' ? '#ef4444' : '#f97316') : '#64748b';

  return (
    <div style={{ width: '380px', flexShrink: 0, height: '100%', overflowY: 'auto', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>{caseItem.CrimeNo}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Case No. {caseItem.CaseNo}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}><X size={16}/></button>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {caseItem.Category && <Badge label={caseItem.Category} color="#00f0ff"/>}
          {caseItem.Gravity && <Badge label={caseItem.Gravity} color={gravityColor}/>}
          {caseItem.Status && <Badge label={caseItem.Status} color={statusColor}/>}
          {csTypeLabel && <Badge label={csTypeLabel} color={csTypeColor}/>}
        </div>
      </div>

      <div style={{ padding: '1rem', flex: 1 }}>
        <DetailSection icon={Clock} title="Case Timeline" iconColor="#eab308">
          <InfoRow label="FIR Registered" value={caseItem.CrimeRegisteredDate ? new Date(caseItem.CrimeRegisteredDate).toLocaleDateString('en-IN') : ''}/>
          <InfoRow label="Incident From" value={caseItem.IncidentFromDate ? new Date(caseItem.IncidentFromDate).toLocaleString('en-IN') : ''}/>
          <InfoRow label="Incident To" value={caseItem.IncidentToDate ? new Date(caseItem.IncidentToDate).toLocaleString('en-IN') : ''}/>
          {cs && cs.csdate && <InfoRow label="Chargesheet Date" value={new Date(cs.csdate).toLocaleDateString('en-IN')}/>}
        </DetailSection>

        <DetailSection icon={Shield} title="Jurisdiction" iconColor="#005eb8">
          <InfoRow label="Police Station" value={caseItem.PoliceStation}/>
          <InfoRow label="Investigating Officer" value={caseItem.OfficerName}/>
          <InfoRow label="Court" value={caseItem.Court}/>
          {caseItem.latitude && caseItem.longitude && <InfoRow label="Coordinates" value={parseFloat(caseItem.latitude).toFixed(5) + ', ' + parseFloat(caseItem.longitude).toFixed(5)}/>}
        </DetailSection>

        <DetailSection icon={BookOpen} title="Crime Classification" iconColor="#a855f7">
          <InfoRow label="Major Head" value={caseItem.MajorHead}/>
          <InfoRow label="Minor Head" value={caseItem.MinorHead}/>
          {caseItem.BriefFacts && (
            <div style={{ marginTop: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 4, padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderLeft: '3px solid #a855f7' }}>
              {caseItem.BriefFacts}
            </div>
          )}
        </DetailSection>

        {detailLoading && <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>Loading details...</div>}

        {detail && (
          <div>
            {detail.complainant && (
              <DetailSection icon={User} title="Complainant" iconColor="#00f0ff">
                <PersonCard person={detail.complainant} color="#00f0ff"/>
              </DetailSection>
            )}

            {detail.victims && detail.victims.length > 0 && (
              <DetailSection icon={Users} title={'Victims (' + detail.victims.length + ')'} iconColor="#ef4444">
                {detail.victims.map((v,i) => <PersonCard key={i} person={v} color="#ef4444" label={'Victim ' + (i+1) + ':'}/>)}
              </DetailSection>
            )}

            {detail.accused && detail.accused.length > 0 && (
              <DetailSection icon={AlertTriangle} title={'Accused (' + detail.accused.length + ')'} iconColor="#f97316">
                {detail.accused.map((a,i) => (
                  <PersonCard key={i} person={{ ...a, name: a.AccusedName, age: a.AgeYear, gender: a.GenderID === 2 ? 'Female' : a.GenderID === 3 ? 'Transgender' : 'Male' }} color="#f97316" label={a.PersonID || ('A' + (i+1))}/>
                ))}
              </DetailSection>
            )}

            {detail.actsAndSections && detail.actsAndSections.length > 0 && (
              <DetailSection icon={Scale} title="Acts and Sections Invoked" iconColor="#ccff00">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {detail.actsAndSections.map((as,i) => (
                    <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '5px 8px', display: 'flex', alignItems: 'flex-start', gap: '8px', borderLeft: '3px solid #ccff00' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 900, color: '#ccff00', minWidth: '80px' }}>{as.ShortName || as.ActCode} S.{as.SectionCode}</span>
                      <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.4 }}>{as.SectionDescription || ''}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {detail.arrests && detail.arrests.length > 0 && (
              <DetailSection icon={Handshake} title={'Arrests / Surrenders (' + detail.arrests.length + ')'} iconColor="#10b981">
                {detail.arrests.map((arr,i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid #10b98133', borderLeft: '3px solid #10b981', borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', marginBottom: '3px' }}>
                      {arr.ArrestSurrenderTypeID === 2 ? 'Surrender' : 'Arrest'} {arr.ArrestSurrenderDate ? new Date(arr.ArrestSurrenderDate).toLocaleDateString('en-IN') : ''}
                    </div>
                    {arr.AccusedName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Accused: <strong style={{ color: 'var(--text-primary)' }}>{arr.AccusedName}</strong></div>}
                    {arr.OfficerName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>IO: <strong style={{ color: 'var(--text-primary)' }}>{arr.OfficerName}</strong></div>}
                  </div>
                ))}
              </DetailSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseRegister({ lang = 'en', incidentsList = [] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGravity, setFilterGravity] = useState('');
  const [filterHead, setFilterHead] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const crimeHeads = useMemo(() => {
    const heads = new Set(incidentsList.map(i => i.MajorHead).filter(Boolean));
    return Array.from(heads).sort();
  }, [incidentsList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return incidentsList.filter(c => {
      const matchSearch = !q || [c.CrimeNo, c.CaseNo, c.MajorHead, c.MinorHead, c.PoliceStation, c.OfficerName, c.BriefFacts].some(v => v && String(v).toLowerCase().includes(q));
      const matchStatus = !filterStatus || c.Status === filterStatus;
      const matchGravity = !filterGravity || c.Gravity === filterGravity;
      const matchHead = !filterHead || c.MajorHead === filterHead;
      return matchSearch && matchStatus && matchGravity && matchHead;
    });
  }, [incidentsList, search, filterStatus, filterGravity, filterHead]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}/>
            <input className="form-input" style={{ paddingLeft: '2rem', width: '100%', fontSize: '0.75rem' }} placeholder="Search CrimeNo, station, crime type, officer..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Under Investigation</option>
            <option>Charge Sheeted</option>
            <option>Closed</option>
          </select>
          <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }} value={filterGravity} onChange={e => setFilterGravity(e.target.value)}>
            <option value="">All Gravity</option>
            <option>Heinous</option>
            <option>Non-Heinous</option>
          </select>
          {crimeHeads.length > 0 && (
            <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem', maxWidth: '160px' }} value={filterHead} onChange={e => setFilterHead(e.target.value)}>
              <option value="">All Crime Heads</option>
              {crimeHeads.map(h => <option key={h}>{h}</option>)}
            </select>
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{filtered.length} cases</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '0.5rem' }}>
              <FileCheck size={36} color="var(--text-secondary)" strokeWidth={1}/>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {incidentsList.length === 0 ? 'No cases registered yet' : 'No cases match filters'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                {incidentsList.length === 0 ? 'Register an FIR to see it appear here' : 'Adjust your search or filters'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 5 }}>
                  {['Crime No.', 'Date', 'Station', 'Crime Type', 'Sub-Type', 'Gravity', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const statusColor = (STATUS_COLORS[c.Status] || { text: '#94a3b8' }).text;
                  const gravityColor = (GRAVITY_COLORS[c.Gravity] || GRAVITY_COLORS['Non-Heinous']).text;
                  const isSelected = selectedCase && selectedCase.CaseMasterID === c.CaseMasterID;
                  return (
                    <tr key={c.CaseMasterID} onClick={() => setSelectedCase(isSelected ? null : c)}
                      style={{ background: isSelected ? 'rgba(0,240,255,0.06)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderLeft: isSelected ? '3px solid #00f0ff' : '3px solid transparent', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--primary-light)', whiteSpace: 'nowrap' }}>{c.CrimeNo}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.CrimeRegisteredDate ? new Date(c.CrimeRegisteredDate).toLocaleDateString('en-IN') : ''}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-primary)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.PoliceStation}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.MajorHead}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-secondary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.MinorHead}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}><Badge label={c.Gravity || 'Unknown'} color={gravityColor}/></td>
                      <td style={{ padding: '0.5rem 0.75rem' }}><Badge label={c.Status || 'Unknown'} color={statusColor}/></td>
                      <td style={{ padding: '0.5rem 0.5rem', color: 'var(--text-secondary)' }}><ChevronRight size={14} style={{ opacity: isSelected ? 1 : 0.4 }}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selectedCase && <CaseDossier caseItem={selectedCase} onClose={() => setSelectedCase(null)}/>}
    </div>
  );
}
"""

FIR_REG = r"""import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, FileText, Users, Scale, Shield, Clock } from 'lucide-react';

const SECTION_STYLE = { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.25rem', marginBottom:'1rem' };
const SECTION_TITLE_STYLE = { fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' };
const GRID2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' };
const GRID3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' };
const LABEL_STYLE = { fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:'4px', letterSpacing:'0.04em', display:'block' };

const GENDER_OPTIONS = [{ value:1, label:'Male'}, { value:2, label:'Female'}, { value:3, label:'Transgender'}];

function FormGroup({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

function emptyVictim() { return { name:'', age:'', genderId:1, isPolice:false }; }
function emptyAccused() { return { name:'', age:'', genderId:1 }; }
function emptySection() { return { actCode:'', sectionCode:'' }; }

function computeSubHeads(lookups, headId) {
  if (!lookups || !headId) return [];
  return (lookups.crimeSubHeads || []).filter(s => String(s.CrimeHeadID) === String(headId));
}

export default function FIRRegistration({ lang = 'en' }) {
  const [lookups, setLookups] = useState(null);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    CaseCategoryID:'1', PoliceStationID:'', PolicePersonID:'', CourtID:'',
    GravityOffenceID:'1', CrimeMajorHeadID:'', CrimeMinorHeadID:'',
    CrimeRegisteredDate: new Date().toISOString().split('T')[0],
    IncidentFromDate:'', IncidentToDate:'', InfoReceivedPSDate:'',
    latitude:'', longitude:'', BriefFacts:'',
    ComplainantName:'', ComplainantAge:'', ComplainantGenderID:'1',
    ComplainantOccupationID:'', ComplainantReligionID:'', ComplainantCasteID:''
  });
  const [victims, setVictims] = useState([emptyVictim()]);
  const [accused, setAccused] = useState([emptyAccused()]);
  const [actsSections, setActsSections] = useState([emptySection()]);

  useEffect(() => {
    fetch('/server/police_fir_api/api/lookups')
      .then(r => r.json())
      .then(data => { setLookups(data); setLookupsLoading(false); })
      .catch(() => { setLookupsLoading(false); });
  }, []);

  const subHeads = computeSubHeads(lookups, form.CrimeMajorHeadID);
  const updateForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateVictim = (i, k, v) => setVictims(p => p.map((item, idx) => idx===i ? {...item,[k]:v} : item));
  const addVictim = () => setVictims(p => [...p, emptyVictim()]);
  const removeVictim = i => setVictims(p => p.filter((_,idx)=>idx!==i));

  const updateAccused = (i, k, v) => setAccused(p => p.map((item,idx)=>idx===i?{...item,[k]:v}:item));
  const addAccused = () => setAccused(p => [...p, emptyAccused()]);
  const removeAccused = i => setAccused(p => p.filter((_,idx)=>idx!==i));

  const updateSection = (i, k, v) => setActsSections(p => p.map((item,idx)=>idx===i?{...item,[k]:v}:item));
  const addSection = () => setActsSections(p => [...p, emptySection()]);
  const removeSection = i => setActsSections(p => p.filter((_,idx)=>idx!==i));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        ...form,
        CaseCategoryID: parseInt(form.CaseCategoryID)||1,
        PoliceStationID: parseInt(form.PoliceStationID)||null,
        PolicePersonID: parseInt(form.PolicePersonID)||null,
        CourtID: parseInt(form.CourtID)||null,
        GravityOffenceID: parseInt(form.GravityOffenceID)||1,
        CrimeMajorHeadID: parseInt(form.CrimeMajorHeadID)||null,
        CrimeMinorHeadID: parseInt(form.CrimeMinorHeadID)||null,
        ComplainantGenderID: parseInt(form.ComplainantGenderID)||1,
        ComplainantOccupationID: parseInt(form.ComplainantOccupationID)||null,
        ComplainantReligionID: parseInt(form.ComplainantReligionID)||null,
        ComplainantCasteID: parseInt(form.ComplainantCasteID)||null,
        victimList: victims.filter(v=>v.name).map(v=>({...v,age:parseInt(v.age)||null,genderId:parseInt(v.genderId)||1})),
        accusedList: accused.filter(a=>a.name).map(a=>({...a,age:parseInt(a.age)||null,genderId:parseInt(a.genderId)||1})),
        actsSections: actsSections.filter(s=>s.actCode&&s.sectionCode).map(s=>({actCode:s.actCode,sectionCode:s.sectionCode}))
      };
      const res = await fetch('/server/police_fir_api/api/cases', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult({ success:true, crimeNo:data.crimeNo, caseNo:data.caseNo });
    } catch(err) {
      setResult({ success:false, error:err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (lookupsLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTop:'3px solid #00f0ff', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <span style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>Loading FIR Registration...</span>
    </div>
  );

  if (result && result.success) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'1.5rem', padding:'2rem' }}>
      <CheckCircle size={56} color="#10b981" strokeWidth={1.5}/>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#10b981', fontFamily:'var(--font-title)' }}>FIR Registered Successfully</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.5rem' }}>Your case has been entered into the Karnataka Police FIR System</div>
      </div>
      <div style={{ background:'var(--bg-surface)', border:'1px solid #10b98144', borderRadius:'var(--radius-md)', padding:'1.5rem 2.5rem', textAlign:'center' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Crime Number</div>
        <div style={{ fontSize:'1.5rem', fontWeight:900, fontFamily:'var(--font-mono)', color:'#00f0ff', letterSpacing:'0.05em', marginTop:'4px' }}>{result.crimeNo}</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'8px' }}>Case No: <strong style={{ color:'var(--text-primary)' }}>{result.caseNo}</strong></div>
      </div>
      <button onClick={() => setResult(null)} style={{ background:'var(--primary)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.6rem 2rem', color:'#000', fontWeight:800, fontSize:'0.8rem', cursor:'pointer' }}>Register Another FIR</button>
    </div>
  );

  const L = lookups || {};

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'1rem 1.25rem' }}>
      <div style={{ maxWidth:'860px', margin:'0 auto' }}>
        <div style={{ marginBottom:'1.25rem' }}>
          <h2 style={{ fontSize:'0.9rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-primary)', fontFamily:'var(--font-title)', margin:0 }}>FIR Registration</h2>
          <p style={{ fontSize:'0.68rem', color:'var(--text-secondary)', margin:'4px 0 0' }}>Register a First Information Report</p>
        </div>

        {result && !result.success && (
          <div style={{ background:'#ef444422', border:'1px solid #ef4444', borderRadius:'var(--radius-sm)', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem', color:'#ef4444' }}>
            <AlertCircle size={14}/> {result.error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={SECTION_STYLE}>
            <div style={SECTION_TITLE_STYLE}><FileText size={13} color="#00f0ff"/> Case Details</div>
            <div style={GRID2}>
              <FormGroup label="Case Category">
                <select className="form-select" value={form.CaseCategoryID} onChange={e=>updateForm('CaseCategoryID',e.target.value)}>
                  {(L.categories||[]).map(c=><option key={c.CaseCategoryID} value={c.CaseCategoryID}>{c.LookupValue}</option>)}
                  {!L.categories?.length && <>
                    <option value="1">FIR</option>
                    <option value="2">UDR</option>
                    <option value="3">Zero FIR</option>
                    <option value="4">PAR</option>
                  </>}
                </select>
              </FormGroup>
              <FormGroup label="FIR Date">
                <input className="form-input" type="date" value={form.CrimeRegisteredDate} onChange={e=>updateForm('CrimeRegisteredDate',e.target.value)} required/>
              </FormGroup>
              <FormGroup label="Police Station">
                <select className="form-select" value={form.PoliceStationID} onChange={e=>updateForm('PoliceStationID',e.target.value)} required>
                  <option value="">Select Station</option>
                  {(L.units||[]).map(u=><option key={u.UnitID} value={u.UnitID}>{u.UnitName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Investigating Officer">
                <select className="form-select" value={form.PolicePersonID} onChange={e=>updateForm('PolicePersonID',e.target.value)}>
                  <option value="">Select Officer</option>
                  {(L.employees||[]).map(emp=><option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FirstName} (KGID: {emp.KGID})</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Gravity of Offence">
                <select className="form-select" value={form.GravityOffenceID} onChange={e=>updateForm('GravityOffenceID',e.target.value)}>
                  {(L.gravities||[]).map(g=><option key={g.GravityOffenceID} value={g.GravityOffenceID}>{g.LookupValue}</option>)}
                  {!L.gravities?.length && <>
                    <option value="1">Heinous</option>
                    <option value="2">Non-Heinous</option>
                  </>}
                </select>
              </FormGroup>
              <FormGroup label="Court">
                <select className="form-select" value={form.CourtID} onChange={e=>updateForm('CourtID',e.target.value)}>
                  <option value="">Select Court</option>
                  {(L.courts||[]).map(c=><option key={c.CourtID} value={c.CourtID}>{c.CourtName}</option>)}
                </select>
              </FormGroup>
            </div>
            <div style={GRID2}>
              <FormGroup label="Major Crime Head">
                <select className="form-select" value={form.CrimeMajorHeadID} onChange={e=>{updateForm('CrimeMajorHeadID',e.target.value);updateForm('CrimeMinorHeadID','');}} required>
                  <option value="">Select Crime Category</option>
                  {(L.crimeHeads||[]).map(h=><option key={h.CrimeHeadID} value={h.CrimeHeadID}>{h.CrimeGroupName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Minor Crime Sub-Head">
                <select className="form-select" value={form.CrimeMinorHeadID} onChange={e=>updateForm('CrimeMinorHeadID',e.target.value)} disabled={!form.CrimeMajorHeadID}>
                  <option value="">Select Sub-Category</option>
                  {subHeads.map(s=><option key={s.CrimeSubHeadID} value={s.CrimeSubHeadID}>{s.CrimeHeadName}</option>)}
                </select>
              </FormGroup>
            </div>
            <FormGroup label="Brief Facts of the Case">
              <textarea className="form-input" rows={3} style={{resize:'vertical'}} value={form.BriefFacts} onChange={e=>updateForm('BriefFacts',e.target.value)} placeholder="Describe the incident briefly..."/>
            </FormGroup>
          </div>

          <div style={SECTION_STYLE}>
            <div style={SECTION_TITLE_STYLE}><Clock size={13} color="#eab308"/> Incident Timeline and Location</div>
            <div style={GRID3}>
              <FormGroup label="Incident From">
                <input className="form-input" type="datetime-local" value={form.IncidentFromDate} onChange={e=>updateForm('IncidentFromDate',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Incident To">
                <input className="form-input" type="datetime-local" value={form.IncidentToDate} onChange={e=>updateForm('IncidentToDate',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Info Received at PS">
                <input className="form-input" type="datetime-local" value={form.InfoReceivedPSDate} onChange={e=>updateForm('InfoReceivedPSDate',e.target.value)}/>
              </FormGroup>
            </div>
            <div style={GRID2}>
              <FormGroup label="Latitude (GPS)">
                <input className="form-input" type="number" step="any" placeholder="e.g. 12.97194" value={form.latitude} onChange={e=>updateForm('latitude',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Longitude (GPS)">
                <input className="form-input" type="number" step="any" placeholder="e.g. 77.59369" value={form.longitude} onChange={e=>updateForm('longitude',e.target.value)}/>
              </FormGroup>
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <div style={SECTION_TITLE_STYLE}><Shield size={13} color="#00f0ff"/> Complainant Details</div>
            <div style={GRID2}>
              <FormGroup label="Full Name">
                <input className="form-input" type="text" placeholder="Complainant full name" value={form.ComplainantName} onChange={e=>updateForm('ComplainantName',e.target.value)} required/>
              </FormGroup>
              <FormGroup label="Age">
                <input className="form-input" type="number" min="0" max="120" placeholder="Age" value={form.ComplainantAge} onChange={e=>updateForm('ComplainantAge',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Gender">
                <select className="form-select" value={form.ComplainantGenderID} onChange={e=>updateForm('ComplainantGenderID',e.target.value)}>
                  {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Occupation">
                <select className="form-select" value={form.ComplainantOccupationID} onChange={e=>updateForm('ComplainantOccupationID',e.target.value)}>
                  <option value="">Select Occupation</option>
                  {(L.occupations||[]).map(o=><option key={o.OccupationID} value={o.OccupationID}>{o.OccupationName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Religion">
                <select className="form-select" value={form.ComplainantReligionID} onChange={e=>updateForm('ComplainantReligionID',e.target.value)}>
                  <option value="">Select Religion</option>
                  {(L.religions||[]).map(r=><option key={r.ReligionID} value={r.ReligionID}>{r.ReligionName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Caste">
                <select className="form-select" value={form.ComplainantCasteID} onChange={e=>updateForm('ComplainantCasteID',e.target.value)}>
                  <option value="">Select Caste</option>
                  {(L.castes||[]).map(c=><option key={c.caste_master_id} value={c.caste_master_id}>{c.caste_master_name}</option>)}
                </select>
              </FormGroup>
            </div>
          </div>

          <div style={SECTION_STYLE}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={SECTION_TITLE_STYLE}><Users size={13} color="#ef4444"/> Victim Details</div>
              <button type="button" onClick={addVictim} style={{ background:'#ef444422', border:'1px solid #ef444466', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Plus size={11}/> Add Victim
              </button>
            </div>
            {victims.map((v,i) => (
              <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'0.75rem', marginBottom:'0.6rem', border:'1px solid var(--border)', borderLeft:'3px solid #ef4444' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#ef4444' }}>Victim {i+1}</span>
                  {victims.length>1 && <button type="button" onClick={()=>removeVictim(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', padding:'2px' }}><Trash2 size={13}/></button>}
                </div>
                <div style={GRID3}>
                  <FormGroup label="Full Name"><input className="form-input" value={v.name} onChange={e=>updateVictim(i,'name',e.target.value)} placeholder="Victim name"/></FormGroup>
                  <FormGroup label="Age"><input className="form-input" type="number" min="0" max="120" value={v.age} onChange={e=>updateVictim(i,'age',e.target.value)} placeholder="Age"/></FormGroup>
                  <FormGroup label="Gender">
                    <select className="form-select" value={v.genderId} onChange={e=>updateVictim(i,'genderId',e.target.value)}>
                      {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </FormGroup>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.7rem', color:'var(--text-secondary)', cursor:'pointer', marginTop:'4px' }}>
                  <input type="checkbox" checked={v.isPolice} onChange={e=>updateVictim(i,'isPolice',e.target.checked)}/>
                  Victim is a Police Officer
                </label>
              </div>
            ))}
          </div>

          <div style={SECTION_STYLE}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={SECTION_TITLE_STYLE}><Users size={13} color="#f97316"/> Accused Details</div>
              <button type="button" onClick={addAccused} style={{ background:'#f9741622', border:'1px solid #f9741666', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', color:'#f97316', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Plus size={11}/> Add Accused
              </button>
            </div>
            {accused.map((a,i) => (
              <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'0.75rem', marginBottom:'0.6rem', border:'1px solid var(--border)', borderLeft:'3px solid #f97316' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#f97316' }}>Accused A{i+1}</span>
                  {accused.length>1 && <button type="button" onClick={()=>removeAccused(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#f97316', padding:'2px' }}><Trash2 size={13}/></button>}
                </div>
                <div style={GRID3}>
                  <FormGroup label="Full Name"><input className="form-input" value={a.name} onChange={e=>updateAccused(i,'name',e.target.value)} placeholder="Accused name"/></FormGroup>
                  <FormGroup label="Age"><input className="form-input" type="number" min="0" max="120" value={a.age} onChange={e=>updateAccused(i,'age',e.target.value)} placeholder="Age"/></FormGroup>
                  <FormGroup label="Gender">
                    <select className="form-select" value={a.genderId} onChange={e=>updateAccused(i,'genderId',e.target.value)}>
                      {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </FormGroup>
                </div>
              </div>
            ))}
          </div>

          <div style={SECTION_STYLE}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={SECTION_TITLE_STYLE}><Scale size={13} color="#ccff00"/> Acts and Sections Invoked</div>
              <button type="button" onClick={addSection} style={{ background:'#ccff0022', border:'1px solid #ccff0066', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', color:'#ccff00', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Plus size={11}/> Add Section
              </button>
            </div>
            {actsSections.map((s,i) => {
              const sectionsForAct = (L.sections||[]).filter(sec => String(sec.ActCode||sec.actCode) === String(s.actCode));
              return (
                <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'0.75rem', marginBottom:'0.6rem', border:'1px solid var(--border)', borderLeft:'3px solid #ccff00' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#ccff00' }}>Section {i+1}</span>
                    {actsSections.length>1 && <button type="button" onClick={()=>removeSection(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748b', padding:'2px' }}><Trash2 size={13}/></button>}
                  </div>
                  <div style={GRID2}>
                    <FormGroup label="Act">
                      <select className="form-select" value={s.actCode} onChange={e=>updateSection(i,'actCode',e.target.value)}>
                        <option value="">Select Act</option>
                        {(L.acts||[]).map(a=><option key={a.ActCode||a.actCode} value={a.ActCode||a.actCode}>{a.ShortName||a.shortName}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Section Code">
                      <select className="form-select" value={s.sectionCode} onChange={e=>updateSection(i,'sectionCode',e.target.value)} disabled={!s.actCode}>
                        <option value="">Select Section</option>
                        {sectionsForAct.map(sec=><option key={sec.SectionCode||sec.sectionCode} value={sec.SectionCode||sec.sectionCode}>{sec.SectionCode||sec.sectionCode} - {sec.SectionDescription||sec.sectionDescription||''}</option>)}
                      </select>
                    </FormGroup>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:'1.5rem' }}>
            <button type="submit" disabled={submitting} style={{ background:'var(--primary)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.65rem 2rem', color:'#000', fontWeight:800, fontSize:'0.8rem', cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.7:1 }}>
              {submitting ? 'Registering...' : 'Register FIR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
"""

write('src/components/SCRBBoard/SCRBBoard.jsx', SCRB)
write('src/components/CaseRegister/CaseRegister.jsx', CASE_REGISTER)
write('src/components/FIRRegistration/FIRRegistration.jsx', FIR_REG)
print('All 3 components written successfully')
