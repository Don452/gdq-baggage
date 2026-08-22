import React, { useMemo } from 'react';
import '../styles/stationAnalytics.css';

export default function StationAnalytics({ recs = [], getI, u }) {
  const radius = 50, circ = 2 * Math.PI * radius; let pct = 0;
  const safeI = (n) => typeof getI === 'function' ? getI(n) : (n || 'System Handler');

  // Enforce Scoped Terminal Privacy Matrix Loops Directly
  const fRecs = useMemo(() => recs.filter(r => 
    u?.is_admin || String(r.station_code).toUpperCase() === String(u?.station_code || 'GDQ').toUpperCase()
  ), [recs, u]);

  const tot = fRecs.length || 1, [st, ct, rs, at, as] = useMemo(() => {
    // 🎯 INJECTED WORKSPACE: Added Tagless layer support inside category metric initializations 
    const sM = {}, cM = { Delayed: 0, Damaged: 0, Onhand: 0, Tagless: 0 }, rM = { R: 0, A: 0 }, aT = {}, aS = {};
    fRecs.forEach(r => {
      // 🎯 INJECTED WORKSPACE: Added Tagless to default dynamic evaluation assignments
      const s = r.station_code || 'GDQ', t = r.irregularity_type || 'Delayed', c = ['Delivered', 'File Closed'].includes(r.bag_status), aN = safeI(r.agent_name), bS = r.bag_status === 'File Closed' ? 'Closed' : (r.bag_status || 'Open');
      
      // 🎯 INJECTED WORKSPACE: Added Tagless structure column defaults into the dynamic map loop
      if (!sM[s]) sM[s] = { total: 0, Delayed: 0, Damaged: 0, Onhand: 0, Tagless: 0, closed: 0 };
      sM[s].total++; sM[s][t]++; if (c) sM[s].closed++; if (cM[t] !== undefined) cM[t]++; c ? rM.R++ : rM.A++;
      
      // 🎯 INJECTED WORKSPACE: Added Tagless schema variables mapping onto local handler logs
      if (!aT[aN]) aT[aN] = { total: 0, Delayed: 0, Damaged: 0, Onhand: 0, Tagless: 0 }; aT[aN].total++; if (aT[aN][t] !== undefined) aT[aN][t]++;
      if (!aS[aN]) aS[aN] = { total: 0, Open: 0, Arrived: 0, Delivered: 0, Suspended: 0, Closed: 0 }; aS[aN].total++; if (aS[aN][bS] !== undefined) aS[aN][bS]++;
    });
    return [sM, cM, rM, aT, aS];
  }, [fRecs]);

  const rate = Math.round((rs.R / tot) * 100), mxT = Math.max(...Object.values(at).map(o => o.total), 1), mxS = Math.max(...Object.values(as).map(o => o.total), 1);
  
  // 🎯 INJECTED WORKSPACE: Added Tagless slice configuration to the data charts layer engine
  const slc = [
    { l: 'Delayed ⏳', c: ct.Delayed, clr: 'var(--ethiopian-red)' }, 
    { l: 'Damaged 💥', c: ct.Damaged, clr: 'var(--ethiopian-yellow)' }, 
    { l: 'Onhand 🧳', c: ct.Onhand, clr: 'var(--ethiopian-green)' },
    { l: 'Tagless 🏷️', c: ct.Tagless, clr: '#d97706' } // Premium operational amber signature tone
  ].filter(s => s.c > 0);

  return (
    <div style={{ width: '100%' }} className="an-grid">
      <div className="an-card" style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>1. {u?.is_admin ? "Overall Network Files" : `Station Files Created [${u?.station_code || 'GDQ'}]`}</h4>
        {!fRecs.length ? <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>No records inside terminal domain database.</p> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div className="an-donut-box">
            <svg width="130" height="130" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}><circle cx="70" cy="70" r={radius} fill="transparent" stroke="var(--snow)" strokeWidth="14" />
              {slc.map((s, i) => { const len = (s.c / tot) * circ, off = circ - (pct / 100) * circ; pct += (s.c / tot) * 100; return <circle key={i} cx="70" cy="70" r={radius} fill="transparent" stroke={s.clr} strokeWidth="14" strokeDasharray={`${len} ${circ}`} strokeDashoffset={off} strokeLinecap="round" />; })}
            </svg><div className="an-donut-text">{fRecs.length}</div>
          </div>
          <div className="an-legend">{slc.map((s, i) => <div key={i} style={{ fontWeight: '600' }}><span style={{ color: s.clr }}>●</span> {s.l}: {s.c}</div>)}</div>
        </div>}
      </div>

      <div className="an-card" style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>2. {u?.is_admin ? "Overall Network Performance" : "Station Performance Rate"}</h4>
        <div className="an-rate-num" style={{ color: rate >= 70 ? 'var(--ethiopian-green)' : 'var(--ethiopian-yellow)' }}>{fRecs.length ? rate : 0}%</div>
        <div className="an-progress-track"><div className="an-progress-bar" style={{ width: `${fRecs.length ? rate : 0}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}><span style={{ color: 'var(--ethiopian-green)' }}>✅ Closed: {rs.R}</span><span style={{ color: 'var(--ethiopian-red)' }}>⚠️ Active: {rs.A}</span></div>
      </div>

      <div className="an-card">
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>3. File Categories per Local Agent</h4>
        <div className="an-scroll-box">
          {!Object.keys(at).length ? <p style={{ color: 'var(--text-muted)' }}>Empty scope.</p> : Object.entries(at).map(([k, s]) => <div key={k}>
            <div className="an-row-meta"><span>Agent: {k}</span><span>{s.total} Bags</span></div>
            <div className="an-progress-track" style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', margin: '6px 0', overflow: 'hidden' }}><div style={{ width: `${(s.total / mxT) * 100}%`, background: 'var(--ethiopian-green)', height: '100%' }} /></div>
            {/* 🎯 INJECTED WORKSPACE: Added Tagless text data badge alignment to agent logs view */}
            <div className="an-badge-strip"><span style={{ color: 'var(--ethiopian-red)' }}>⏳DLY:{s.Delayed || 0}</span><span style={{ color: 'var(--text-dark)' }}>💥DMG:{s.Damaged || 0}</span><span style={{ color: 'var(--ethiopian-green)' }}>🧳OH:{s.Onhand || 0}</span><span style={{ color: '#d97706' }}>🏷️TGL:{s.Tagless || 0}</span></div>
          </div>)}
        </div>
      </div>

      <div className="an-card">
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>4. File Status Breakdown per Local Agent</h4>
        <div className="an-scroll-box">
          {!Object.keys(as).length ? <p style={{ color: 'var(--text-muted)' }}>Empty scope.</p> : Object.entries(as).map(([k, s]) => <div key={k}>
            <div className="an-row-meta"><span>Agent: {k}</span><span>{s.total} Profiles</span></div>
            <div className="an-progress-track" style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', margin: '6px 0', overflow: 'hidden' }}><div style={{ width: `${(s.total / mxS) * 100}%`, background: 'var(--ethiopian-green)', height: '100%' }} /></div>
            <div className="an-badge-strip" style={{ gap: '6px' }}><span style={{ color: 'var(--text-dark)' }}>OPN:{s.Open || 0}</span><span style={{ color: 'var(--text-muted)' }}>ARV:{s.Arrived || 0}</span><span style={{ color: 'var(--ethiopian-green)' }}>DLV:{s.Delivered || 0}</span><span style={{ color: 'var(--ethiopian-red)' }}>SUS:{s.Suspended || 0}</span><span style={{ color: 'var(--text-dark)', textDecoration: 'underline' }}>CLS:{s.Closed || 0}</span></div>
          </div>)}
        </div>
      </div>

      <div className="an-card" style={{ gridColumn: '1 / -1' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>5. Terminal Node Station Performance Metrics &amp; Operational Flow</h4>
        <div className="an-node-grid">
          {!Object.keys(st).length ? <p style={{ color: 'var(--text-muted)' }}>No terminal data registered.</p> : Object.entries(st).map(([nm, d]) => {
            const r = Math.round((d.closed / (d.total || 1)) * 100);
            return (
              <div key={nm} className="an-node-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="an-node-badge">📍 Node: {nm}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: r >= 70 ? 'var(--ethiopian-green)' : 'var(--ethiopian-yellow)' }}>Resolution: {r}%</span>
                </div>
                <div>Total Handled Files: <b>{d.total}</b></div>
                {/* 🎯 INJECTED WORKSPACE: Added Tagless tracking metric layout column badge output */}
                <div className="an-badge-strip">
                  <span style={{ color: 'var(--ethiopian-red)' }}>⏳ DLY: {d.Delayed || 0}</span>
                  <span style={{ color: 'var(--text-dark)' }}>💥 DMG: {d.Damaged || 0}</span>
                  <span style={{ color: 'var(--ethiopian-green)' }}>🧳 OH: {d.Onhand || 0}</span>
                  <span style={{ color: '#d97706' }}>🏷️ TGL: {d.Tagless || 0}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ethiopian-green)', marginTop: '2px' }}>✓ Total Closed Issues: {d.closed}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
