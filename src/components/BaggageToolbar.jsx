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
      {/* 🎯 HEADER LABEL SECTION WITH PREMIUM PLACEMENT STRIP */}
      <div className="toolbar-header-strip">
        <h3 className="toolbar-section-title">🎯 Record Filters</h3>
      </div>
      
      {/* 🧱 MAIN CONTROL HUB FORCED BENEATH THE LABEL SECTION BOUNDARY */}
      <div className="toolbar-workspace-body">
        
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
                <option key={st.station_code} value={st.station_code}>{st.station_code} Airport Station</option>
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
       

        {/* Search Bar Input & Calendar Windows */}
        <div className="toolbar-filter-group-row">
          <input 
            type="text" 
            className="toolbar-input-text"
            placeholder="🔍 Search tag, file ID..." 
            value={srch} 
            onChange={e => setSrch(e.target.value)} 
          />
          <div className="toolbar-date-range-wrapper">
            <input 
              type="date" 
              className="toolbar-input-date" 
              value={sd} 
              onChange={e => setSd(e.target.value)} 
            />
            <span className="toolbar-date-separator">to</span>
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
                className="toolbar-date-clear-btn"
              >
                &times;
              </button>
              
            )}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
