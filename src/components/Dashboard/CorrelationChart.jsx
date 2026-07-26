import React, { useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, Label, CartesianGrid } from 'recharts';
import { DISTRICTS } from '../../mockData/incidentData';
import { BarChart2 } from 'lucide-react';
import { translations } from '../../translations';

export default function CorrelationChart({ lang = 'en', incidentsList = [] }) {
  const [indicator, setIndicator] = useState('povertyIndex');

  const indicators = {
    povertyIndex: { 
      label: translations[lang].correlationChart.povertyIndexLabel, 
      color: '#ff4a6b', 
      desc: translations[lang].correlationChart.povertyIndexDesc 
    },
    unemploymentRate: { 
      label: translations[lang].correlationChart.unemploymentRateLabel, 
      color: '#eab308', 
      desc: translations[lang].correlationChart.unemploymentRateDesc 
    },
    gradRate: { 
      label: translations[lang].correlationChart.gradRateLabel, 
      color: '#10b981', 
      desc: translations[lang].correlationChart.gradRateDesc 
    },
    streetlightCoverage: { 
      label: translations[lang].correlationChart.streetlightCoverageLabel, 
      color: '#00f0ff', 
      desc: translations[lang].correlationChart.streetlightCoverageDesc 
    }
  };

  // Compile data from DISTRICTS and incidentsList
  const chartData = Object.keys(DISTRICTS).map((key) => {
    const dist = DISTRICTS[key];
    const crimeCount = incidentsList.filter(inc => inc.district === key).length;
    return {
      district: translations[lang].districts[key] || dist.name,
      x: dist[indicator],
      y: crimeCount,
      z: crimeCount * 10 // Bubble size
    };
  });

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-title)' }}>
          <BarChart2 size={18} style={{ color: 'var(--accent-cyan)' }} />
          {translations[lang].correlationChart.title}
        </h3>
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
          value={indicator}
          onChange={(e) => setIndicator(e.target.value)}
        >
          {Object.keys(indicators).map(key => (
            <option key={key} value={key}>{indicators[key].label}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minHeight: '180px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="95%">
          <ScatterChart margin={{ top: 10, right: 20, left: -25, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              name={indicators[indicator].label}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={indicator.toLowerCase().includes('rate') || indicator.toLowerCase().includes('coverage') ? [0, 100] : ['auto', 'auto']}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={translations[lang].correlationChart.totalIncidents}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[100, 800]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontFamily: 'var(--font-body)',
                boxShadow: 'var(--glass-shadow)'
              }}
              labelStyle={{ fontWeight: '600' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '6px' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{data.district}</strong>
                      <div style={{ marginTop: '0.25rem', fontSize: '10px' }}>
                        <div>{indicators[indicator].label}: <strong>{data.x}</strong></div>
                        <div>{translations[lang].correlationChart.totalIncidents}: <strong>{data.y}</strong></div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name={translations[lang].correlationChart.districtCorrelations} data={chartData}>
              {chartData.map((entry, index) => {
                // Color bubbles depending on their crime density
                const bubbleColor = entry.y > 15 ? 'var(--accent-red)' : entry.y > 8 ? 'var(--accent-amber)' : 'var(--accent-cyan)';
                return <Cell key={`cell-${index}`} fill={bubbleColor} fillOpacity={0.6} stroke={bubbleColor} strokeWidth={1.5} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {translations[lang].correlationChart.insightTitle}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
          {indicators[indicator].desc} {translations[lang].correlationChart.regressionYields} {indicator === 'povertyIndex' || indicator === 'unemploymentRate' ? translations[lang].correlationChart.strongPositive : translations[lang].correlationChart.strongNegative}.
        </p>
      </div>
    </div>
  );
}
