import React from 'react';
import { Shield, TrendingUp, HelpCircle, Eye, AlertTriangle } from 'lucide-react';
import { translations } from '../../translations';

export default function MetricCards({ lang = 'en', incidentsList = [] }) {
  const total = incidentsList.length;
  
  // Calculate stats
  const violentCount = incidentsList.filter(inc => {
    const type = inc.crimeMajorHeadId || inc.type;
    return type === 'ASSAULT' || type === 'HOMICIDE' || type === 'DRUG_TRAFFICKING';
  }).length;
  const violentPercentage = total > 0 ? Math.round((violentCount / total) * 100) : 0;

  const activeCases = incidentsList.filter(inc => 
    inc.caseStatusId === 1 || inc.status === 'Active' || inc.status === 'Investigating'
  ).length;

  return (
    <div className="dashboard-grid" style={{ fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      <div className="glass-panel metric-card cyan">
        <div className="metric-header">
          <span>{translations[lang].metricCards.activeLoad}</span>
          <Shield size={16} className="trend-down" />
        </div>
        <div className="metric-val">{total}</div>
        <div className="metric-trend trend-down">
          <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />
          <span>-4.2% {translations[lang].metricCards.vsLastMonth}</span>
        </div>
      </div>

      <div className="glass-panel metric-card red">
        <div className="metric-header">
          <span>{translations[lang].metricCards.violentRatio}</span>
          <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
        </div>
        <div className="metric-val">{violentPercentage}%</div>
        <div className="metric-trend trend-up">
          <TrendingUp size={12} />
          <span>+2.1% {translations[lang].metricCards.violentIncidents}</span>
        </div>
      </div>

      <div className="glass-panel metric-card amber">
        <div className="metric-header">
          <span>{translations[lang].metricCards.openInvestigations}</span>
          <Eye size={16} style={{ color: 'var(--accent-amber)' }} />
        </div>
        <div className="metric-val">{activeCases}</div>
        <div className="metric-trend trend-down">
          <span>{translations[lang].metricCards.pendingForensics}</span>
        </div>
      </div>

      <div className="glass-panel metric-card purple">
        <div className="metric-header">
          <span>{translations[lang].metricCards.anomalyAlerts}</span>
          <TrendingUp size={16} style={{ color: 'var(--accent-purple)' }} />
        </div>
        <div className="metric-val">2</div>
        <div className="metric-trend trend-up">
          <span>{translations[lang].metricCards.unresolvedSpikes}</span>
        </div>
      </div>
    </div>
  );
}
