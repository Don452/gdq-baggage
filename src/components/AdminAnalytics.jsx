import React, { useState } from 'react';
import { sb } from '../utils/supabaseClient';
import '../styles/analytics.css';

export default function AdminAnalytics({ recs = [], stations = [], fetchStations }) {
  const [nst, setNst] = useState({ station_code: '', station_name: '', admin_passcode: '' }), [delCode, setDelCode] = useState(''), [edCode, setEdCode] = useState(''), [edF, setEdF] = useState({ station_name: '', admin_passcode: '' }), [flt, setFlt] = useState(''), now = new Date(), day = 86400000;
  const f = (arr, t) => arr.filter(r => r.irregularity_type === t).length, sc = (arr, s) => arr.filter(r => (r.bag_status === 'File Closed' ? 'Closed' : (r.bag_status || 'Open')) === s).length;
  
  const stats = stations.map(st => {
    const s = recs.filter(r => r.station_code === st.station_code), cl = s.filter(r => ['Delivered', 'File Closed'].includes(r.bag_status)).length, w = s.filter(r => (now - new Date(r.created_at)) <= 7 * day), m = s.filter(r => (now - new Date(r.created_at)) <= 30 * day), d = s.filter(r => (now - new Date(r.created_at)) <= day);
    return { 
      code: st.station_code, name: st.station_name, pass: st.admin_passcode || '', total: s.length, score: s.length ? Math.round((cl / s.length) * 100) : 0,
      
      // 🎯 DAILY DATA MATRICES LOOKUP (Tagless column injected)
      d_tot: d.length, d_del: f(d, 'Delayed'), d_dam: f(d, 'Damaged'), d_oh: f(d, 'Onhand'), d_tgl: f(d, 'Tagless'), d_cl: d.filter(r => ['Delivered', 'File Closed'].includes(r.bag_status)).length,
      
      // 🎯 WEEKLY DATA MATRICES LOOKUP (Tagless column injected)
      w_tot: w.length, w_del: f(w, 'Delayed'), w_dam: f(w, 'Damaged'), w_oh: f(w, 'Onhand'), w_tgl: f(w, 'Tagless'), w_cl: w.filter(r => ['Delivered', 'File Closed'].includes(r.bag_status)).length,
      
      // 🎯 MONTHLY DATA MATRICES LOOKUP (Tagless column injected)
      m_tot: m.length, m_del: f(m, 'Delayed'), m_dam: f(m, 'Damaged'), m_oh: f(m, 'Onhand'), m_tgl: f(m, 'Tagless'), m_cl: m.filter(r => ['Delivered', 'File Closed'].includes(r.bag_status)).length,
      
      open: sc(s, 'Open'), arrived: sc(s, 'Arrived'), delivered: sc(s, 'Delivered'), suspended: sc(s, 'Suspended'), closed: sc(s, 'Closed')
    };
  }), fStats = flt ? stats.filter(s => s.code === flt) : stats;

  const handleSelectEdCode = (code) => {
    setEdCode(code);
    const target = stations.find(st => st.station_code === code);
    setEdF(target ? { station_name: target.station_name, admin_passcode: target.admin_passcode || '' } : { station_name: '', admin_passcode: '' });
  };

  return (
    <div className="admin-container">
      {/* 🛠️ TOP ADMINISTRATIVE OPERATIONS BALANCED MANAGEMENT BAR (FLEX WRAP FOR AUTO-EXPANSION) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', width: '100%' }}>
        
        {/* PANEL 1: VIEW ISOLATION CONTROLLER */}
        <div className="control-panel cp-yellow" style={{ flex: '1 1 220px' }}><label>🔍 Filter Network Target</label><div className="input-row"><select style={{ width: '100%' }} value={flt} onChange={e => setFlt(e.target.value)}><option value="">All Active Hubs</option>{stations.map(st => <option key={st.station_code} value={st.station_code}>{st.station_code} — {st.station_name}</option>)}</select></div></div>
        
        {/* PANEL 2: PROVISION NEW HUB STATION */}
        <form onSubmit={async (e) => { e.preventDefault(); const c = nst.station_code.toUpperCase().trim(); if (c.length !== 3) return alert('Must be 3 letters.'); const { error } = await sb.from('stations').insert([{ station_code: c, station_name: nst.station_name.trim(), admin_passcode: nst.admin_passcode.trim() }]); if (error) return alert(error.message); setNst({ station_code: '', station_name: '', admin_passcode: '' }); fetchStations(); }} className="control-panel cp-green" style={{ flex: '1.2 1 280px' }}><label>➕ Add New Station Node</label><div className="input-row"><input style={{ width: '50px', textAlign: 'center', fontWeight: '700' }} placeholder="CODE" maxLength={3} value={nst.station_code} onChange={e => setNst({...nst, station_code: e.target.value})} required /><input style={{ flex: 1.5 }} placeholder="City Name" value={nst.station_name} onChange={e => setNst({...nst, station_name: e.target.value})} required /><input style={{ flex: 1, background: 'var(--snow)', fontFamily: 'monospace' }} placeholder="Pass" value={nst.admin_passcode} onChange={e => setNst({...nst, admin_passcode: e.target.value})} required /><button type="submit" className="btn-primary" style={{ padding: '0 8px' }}>Deploy</button></div></form>
        
        {/* PANEL 3: MASTER CONFIGURATION PANEL OVERSEE */}
        <div className="control-panel cp-green" style={{ borderTopColor: '#3b6e2d', flex: '1.2 1 280px' }}><label>⚙️ Config Station Parameters</label><div className="input-row"><select style={{ width: '68px', fontWeight: '700' }} value={edCode} onChange={e => handleSelectEdCode(e.target.value)}><option value="">Target</option>{stations.map(st => <option key={st.station_code} value={st.station_code}>{st.station_code}</option>)}</select><input style={{ flex: 1.5 }} value={edF.station_name} onChange={e => setEdF({...edF, station_name: e.target.value})} placeholder="City Name" disabled={!edCode} /><input style={{ flex: 1, background: 'var(--snow)', fontFamily: 'monospace' }} value={edF.admin_passcode} onChange={e => setEdF({...edF, admin_passcode: e.target.value})} placeholder="Pass" disabled={!edCode} /><button onClick={async () => { if (!edCode) return; const { error } = await sb.from('stations').update({ station_name: edF.station_name.trim(), admin_passcode: edF.admin_passcode.trim() }).eq('station_code', edCode); if (error) return alert(error.message); setEdCode(''); setEdF({ station_name: '', admin_passcode: '' }); fetchStations(); }} className="btn-primary" style={{ padding: '0 8px' }} disabled={!edCode}>Save</button></div></div>
        
        {/* PANEL 4: DECOMMISSION HUB STATION */}
        <div className="control-panel cp-red" style={{ flex: '1 1 220px' }}><label>❌ Decommission Station</label><div className="input-row"><select style={{ flex: 1 }} value={delCode} onChange={e => setDelCode(e.target.value)}><option value="">Select target...</option>{stations.map(st => <option key={st.station_code} value={st.station_code}>{st.station_code} — {st.station_name}</option>)}</select><button onClick={async () => { if (delCode && window.confirm(`Decommission hub [${delCode}] safely?`)) { await sb.from('stations').delete().eq('station_code', delCode); setDelCode(''); fetchStations(); } }} className="btn-danger" style={{ padding: '0 12px' }}>Wipe</button></div></div>
      </div>

      {/* 🏛️ CLEAN CORE MONITORING LEDGER MATRIX */}
      <div className="master-card">
        <h2>🔄 Terminal Node Station Periodic Status Ledger Matrix</h2>
        <div className="stations-grid">
          {fStats.map(s => (
            <div key={s.code} className="station-cell" style={{ border: edCode === s.code ? '2px solid var(--ethiopian-yellow)' : '' }}>
              <div className="station-header"><div><span className="station-badge">{s.code}</span><span className="station-name">{s.name}</span></div></div>
              <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${s.score}%` }} /></div>
              <div className="status-counters">{[['OPN', s.open, 'badge-open'], ['ARV', s.arrived, 'badge-arrived'], ['DLV', s.delivered, 'badge-delivered'], ['SUS', s.suspended, 'badge-suspended'], ['CLS', s.closed, 'badge-closed']].map(([l, v, c]) => <span key={l} className={`status-badge ${c}`}>{l}: {v}</span>)}</div>
              
              {/* 🎯 INJECTED WORKSPACE: Dynamic array injection containing the newly integrated 'tgl' tagless value field */}
              <div className="reports-block">
                {[
                  { n: 'Daily', t: s.d_tot, dl: s.d_del, dm: s.d_dam, oh: s.d_oh, tgl: s.d_tgl, cl: s.d_cl, cls: 'daily' }, 
                  { n: 'Weekly', t: s.w_tot, dl: s.w_del, dm: s.w_dam, oh: s.w_oh, tgl: s.w_tgl, cl: s.w_cl, cls: 'weekly' }, 
                  { n: 'Monthly', t: s.m_tot, dl: s.m_del, dm: s.m_dam, oh: s.m_oh, tgl: s.m_tgl, cl: s.m_cl, cls: 'monthly' }
                ].map((p, i) => (
                  <div key={i} className={`report-column ${p.cls}`}>
                    <div className="report-title">{p.n}</div>
                    <div className="report-gross">Gross: <b>{p.t}</b></div>
                    <div className="report-mono" style={{ color: 'var(--ethiopian-red)' }}>⏳ DLY: {p.dl}</div>
                    <div className="report-mono">💥 DMG: {p.dm}</div>
                    <div className="report-mono" style={{ color: 'var(--ethiopian-green)' }}>🧳 OH: {p.oh}</div>
                    {/* 🎯 INJECTED WORKSPACE: Renders the absolute Tagless metric counters to layout dashboard nodes */}
                    <div className="report-mono" style={{ color: '#d97706' }}>🏷️ TGL: {p.tgl}</div>
                    <div className="report-efficiency">Res: {p.t ? `${Math.round((p.cl / p.t) * 100)}%` : '0%'}</div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
