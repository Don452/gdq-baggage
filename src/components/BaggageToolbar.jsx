import React from 'react';
import '../styles/BaggageToolbar.css'; // 🔌 Connects the external style definitions sheet

export default function BaggageToolbar({ 
  u, tab, setTab, stationFilter, setStationFilter, stations = [], 
  colorFilter, setColorFilter, srch, setSrch, sd, setSd, ed, setEd 
}) {
  const stCode = String(u?.station_code || '').trim().toUpperCase();

  // Helper routine to apply individual active color rules based on active incident states
  const getTabClass = (currentTypeName) => {
    if (tab !== currentTypeName) return '';
    return `tab-active-${currentTypeName.toLowerCase()}`;
  };

  return (
    <div className="toolbar-utilities-panel">
      
      {/* Tab Incident Class Rows */}
      <div className="tab-filters-row">
        {['All', 'Delayed', 'Damaged', 'Onhand'].map(t => (
          <button 
            key={t} 
            className={`toolbar-tab-btn ${getTabClass(t)}`} 
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Target Parameters Selection Nodes */}
      <div className="toolbar-filter-group-row">
        
        {/* Dynamic Airport Dropdown */}
        <div className="toolbar-field-item">
          <span className="toolbar-field-label">STATION:</span>
          <select className="toolbar-select-menu" value={stationFilter} onChange={e => setStationFilter(e.target.value)}>
            <option value="LOCAL">Mine ({stCode})</option>
            <option value="GLOBAL">ALL ET-EXPRESS</option>
            {stations.map(st => (
              <option key={st.station_code} value={st.station_code}>{st.station_code} Hub</option>
            ))}
          </select>
        </div>

        {/* Color Filtering Menu */}
        <div className="toolbar-field-item">
          <span className="toolbar-field-label">COLOR:</span>
          <select className="toolbar-select-menu" value={colorFilter} onChange={e => setColorFilter(e.target.value)}>
            <option value="ALL">All Colors</option>
            {['Black', 'Red', 'Blue', 'Brown', 'Grey', 'Green'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar Input & Calendar Windows */}
      <div className="toolbar-filter-group-row">
        <input 
          type="text" 
          className="toolbar-input-text"
          placeholder="🔍 Search tag, file ID..." 
          value={srch} 
          onChange={e => setSrch(e.target.value)} 
        />
               <div className="toolbar-date-range-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="date" 
            className="toolbar-input-date" 
            value={sd} 
            onChange={e => setSd(e.target.value)} 
          />
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>to</span>
          <input 
            type="date" 
            className="toolbar-input-date" 
            value={ed} 
            onChange={e => setEd(e.target.value)} 
          />

          {/* 🧹 DYNAMIC CLEANER BUTTON: Renders instantly when either date input is populated */}
          {(sd || ed) && (
            <button
              type="button"
              title="Clear Date Filters"
              onClick={() => {
                setSd('');
                setEd('');
              }}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1',
                transition: 'background 0.1s ease',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
            >
              &times;
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
