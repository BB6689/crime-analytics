import React, { useState, useEffect } from 'react';
import { Shield, Network, UserCheck, Eye, Search, User } from 'lucide-react';
import CriminalNetwork from './CriminalNetwork';
import NetworkInspector from './NetworkInspector';
import RiskProfiler from '../OffenderTracker/RiskProfiler';

export default function CriminalIntelligence({
  lang = 'en',
  networkData,
  setNetworkData,
  selectedNetworkNode,
  setSelectedNetworkNode,
  offenderProfiles = [],
  selectedOffenderId,
  setSelectedOffenderId
}) {
  const [inspectorMode, setInspectorMode] = useState('dossier'); // 'dossier' or 'profiler'
  const isKn = lang === 'kn';
  const isHi = lang === 'hi';

  // Sync selected offender when network node changes
  useEffect(() => {
    if (selectedNetworkNode) {
      // Check if selected node matches an offender profile ID or label
      const matched = offenderProfiles.find(
        p => p.id === selectedNetworkNode.id || p.name.toLowerCase() === selectedNetworkNode.label.toLowerCase()
      );
      if (matched) {
        setSelectedOffenderId(matched.id);
      }
    }
  }, [selectedNetworkNode, offenderProfiles, setSelectedOffenderId]);

  // Handle selecting an offender from the right panel quick dropdown
  const handleSelectOffenderFromDropdown = (id) => {
    setSelectedOffenderId(id);
    const targetNode = (networkData?.nodes || []).find(n => n.id === id);
    if (targetNode) {
      setSelectedNetworkNode(targetNode);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '0.5rem' }}>
      {/* Top Intelligence Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.4rem 0.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} style={{ color: 'var(--primary)' }} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-title)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {isKn ? 'ಅಪರಾಧಿಗಳ ಜಾಲ ಮತ್ತು ಪ್ರೊಫೈಲಿಂಗ್ ಏಕೀಕೃತ ಡೆಸ್ಕ್' : isHi ? 'अपराधी नेटवर्क एवं प्रोफाइलिंग एकीकृत डेस्क' : 'Criminal Link & Offender Intelligence Workspace'}
          </span>
        </div>

        {/* Quick Offender Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={13} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={selectedOffenderId || ''}
              onChange={(e) => handleSelectOffenderFromDropdown(e.target.value)}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.5rem',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">{isKn ? '-- ಹವ್ಯಾಸಿ ಅಪರಾಧಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ --' : isHi ? '-- अभ्यस्त अपराधी चुनें --' : '-- Select Offender Profile --'}</option>
              {offenderProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.alias}) - {p.riskScore}% {isKn ? 'ಅಪಾಯ' : 'Risk'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Dual-Panel Layout (Left Graph + Right Integrated Profiler) */}
      <div className="visualizer-split" style={{ height: '100%', flex: 1, minHeight: 0 }}>
        {/* Left Column: Criminal Link & Association Graph */}
        <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
          <CriminalNetwork
            lang={lang}
            selectedNode={selectedNetworkNode}
            setSelectedNode={setSelectedNetworkNode}
            networkData={networkData}
            setNetworkData={setNetworkData}
          />
        </div>

        {/* Right Column: Integrated Dossier & Risk Profiler Inspector Panel */}
        <div style={{ width: '380px', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Panel Mode Switcher Header */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            gap: '3px'
          }}>
            <button
              onClick={() => setInspectorMode('dossier')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '0.35rem',
                padding: '0.35rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: inspectorMode === 'dossier' ? '1px solid var(--primary)' : '1px solid transparent',
                background: inspectorMode === 'dossier' ? 'var(--primary-dim)' : 'transparent',
                color: inspectorMode === 'dossier' ? 'var(--primary-light)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Eye size={13} />
              <span>{isKn ? 'ಲಿಂಕ್ ಮಾಹಿತಿ ದೋಸಿಯರ್' : isHi ? 'लिंक डोजियर' : 'LINK DOSSIER'}</span>
            </button>

            <button
              onClick={() => setInspectorMode('profiler')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '0.35rem',
                padding: '0.35rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: inspectorMode === 'profiler' ? '1px solid var(--primary)' : '1px solid transparent',
                background: inspectorMode === 'profiler' ? 'var(--primary-dim)' : 'transparent',
                color: inspectorMode === 'profiler' ? 'var(--primary-light)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <UserCheck size={13} />
              <span>{isKn ? 'ಅಪಾಯ ಪ್ರೊಫೈಲರ್' : isHi ? 'जोखिम प्रोफाइलर' : 'RISK PROFILER'}</span>
            </button>
          </div>

          {/* Panel Body */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {inspectorMode === 'dossier' ? (
              <NetworkInspector
                lang={lang}
                selectedNode={selectedNetworkNode}
                onViewProfile={(offenderId) => {
                  setSelectedOffenderId(offenderId);
                  setInspectorMode('profiler');
                }}
                networkData={networkData}
              />
            ) : (
              <RiskProfiler
                lang={lang}
                offenderId={selectedOffenderId || selectedNetworkNode?.id}
                offenderProfiles={offenderProfiles}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
