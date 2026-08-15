import React from 'react';

export default function BaggageCharts({ recs, getI }) {
  const tot = recs.length || 1, radius = 50, circ = 2 * Math.PI * radius; let pct = 0;
  
  // ⚡ TIME PERIOD ACCUMULATOR ENGINE (WITH CORE STATUS TRACKING)
  const now = new Date();
  const getDaysAgo = (dStr) => {
    if (!dStr) return 999;
    return Math.floor((now - new Date(dStr)) / (1000 * 60 * 60 * 24));
  };

  const periodStats = recs.reduce((a, r) => {
    const daysAgo = getDaysAgo(r.created_at);
    const type = r.irregularity_type || 'Delayed';
    const status = r.bag_status || 'Open';
    
    const updateBucket = (bucket) => {
      bucket.tot += 1;
      bucket[type] = (bucket[type] || 0) + 1;
      if (['Delivered', 'File Closed'].includes(status)) bucket.closed += 1;
      else bucket.active += 1;
    };

    if (daysAgo === 0) updateBucket(a.D);
    if (daysAgo <= 7) updateBucket(a.W);
    if (daysAgo <= 30) updateBucket(a.M);
    return a;
  }, {
    D: { tot: 0, Delayed: 0, Damaged: 0, Onhand: 0, active: 0, closed: 0 },
    W: { tot: 0, Delayed: 0, Damaged: 0, Onhand: 0, active: 0, closed: 0 },
    M: { tot: 0, Delayed: 0, Damaged: 0, Onhand: 0, active: 0, closed: 0 }
  });

  const maxPeriodTot = Math.max(periodStats.D.tot, periodStats.W.tot, periodStats.M.tot, 1);

  // Original Chart Computations (Left completely untouched)
  const cats = recs.reduce((a, r) => { a[r.irregularity_type || 'Delayed'] += 1; return a; }, { Delayed: 0, Damaged: 0, Onhand: 0 });
  const res = recs.reduce((a, r) => { ['Delivered', 'File Closed'].includes(r.bag_status) ? a.R += 1 : a.A += 1; return a; }, { R: 0, A: 0 });
  const rate = Math.round((res.R / tot) * 100);
  const agType = recs.reduce((a, r) => { const c = getI(r.agent_name); if (!a[c]) a[c] = { total: 0, Delayed: 0, Damaged: 0, Onhand: 0 }; a[c].total += 1; a[c][r.irregularity_type || 'Delayed'] += 1; return a; }, {});
  const agStat = recs.reduce((a, r) => { const c = getI(r.agent_name), s = r.bag_status === 'File Closed' ? 'Closed' : (r.bag_status || 'Open'); if (!a[c]) a[c] = { total: 0, Open: 0, Arrived: 0, Delivered: 0, Suspended: 0, Closed: 0 }; a[c].total += 1; if (a[c][s] !== undefined) a[c][s] += 1; return a; }, {});
  const mxT = Math.max(...Object.values(agType).map(o => o.total), 1), mxS = Math.max(...Object.values(agStat).map(o => o.total), 1);
  const slices = [{ l: 'Delayed ⏳', c: cats.Delayed, clr: '#3b82f6' }, { l: 'Damaged 💥', c: cats.Damaged, clr: '#f97316' }, { l: 'Onhand 🧳', c: cats.Onhand, clr: '#10b981' }].filter(s => s.c > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', margin: '15px 0' }}>
      
      {/* 🍩 CHART 1: ORIGINAL GLOBAL BALANCE */}
      <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px', textAlign: 'center' }}>
        <h4>🍩 1. Global Balance</h4>
        {recs.length === 0 ? <p style={{ color: '#64748b', padding: '20px 0' }}>No records inside timeframe.</p> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="130" height="130" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}><circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
              {slices.map((s, i) => { const len = (s.c / tot) * circ, off = circ - (pct / 100) * circ; pct += (s.c / tot) * 100; return <circle key={i} cx="70" cy="70" r={radius} fill="transparent" stroke={s.clr} strokeWidth="14" strokeDasharray={`${len} ${circ}`} strokeDashoffset={off} strokeLinecap="round" />; })}
            </svg><div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '800' }}>{recs.length}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', justifyContent: 'center' }}>{slices.map((s, i) => <div key={i}><span style={{ color: s.clr }}>●</span> {s.l}: {s.c}</div>)}</div>
        </div>}
      </div>

      {/* 📈 CHART 2: ORIGINAL RESOLUTION RATE */}
      <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px', textAlign: 'center' }}>
        <h4>📈 2. Station Resolution Performance</h4>
        <div style={{ fontSize: '36px', fontWeight: '800', color: rate >= 70 ? '#22c55e' : '#eab308' }}>{recs.length ? rate : 0}%</div>
        <div style={{ width: '100%', background: '#fee2e2', borderRadius: '10px', height: '16px', overflow: 'hidden', margin: '15px 0' }}><div style={{ width: `${recs.length ? rate : 0}%`, background: '#22c55e', height: '100%' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}><span>✅ Closed: {res.R}</span><span>⚠️ Active: {res.A}</span></div>
      </div>

      {/* 👤 CHART 3: ORIGINAL CATEGORIES PER AGENT */}
      <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px' }}>
        <h4>👤 3. File Categories per Agent</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
          {Object.keys(agType).length === 0 ? <p style={{ color: '#64748b' }}>Empty scope.</p> : Object.entries(agType).map(([k, s]) => <div key={k}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}><span>Agent: {k}</span><span>{s.total} Bags</span></div>
            <div style={{ background: '#f1f5f9', height: '10px', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${(s.total / mxT) * 100}%`, background: '#0284c7', height: '100%' }} /></div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '10px', fontFamily: 'monospace' }}><span>⏳DLY:{s.Delayed}</span><span>💥DMG:{s.Damaged}</span><span>🧳OH:{s.Onhand}</span></div>
          </div>)}
        </div>
      </div>

      {/* 📊 CHART 4: ORIGINAL STATUS BREAKDOWN PER AGENT */}
      <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px' }}>
        <h4>📊 4. File Status Breakdown per Agent</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
          {Object.keys(agStat).length === 0 ? <p style={{ color: '#64748b' }}>Empty scope.</p> : Object.entries(agStat).map(([k, s]) => <div key={k}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}><span>Agent: {k}</span><span>{s.total} Profiles</span></div>
            <div style={{ background: '#f1f5f9', height: '10px', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${(s.total / mxS) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #4f46e5)', height: '100%' }} /></div>
            <div style={{ display: 'flex', gap: '6px', fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold' }}><span style={{ color: '#ea580c' }}>OPN:{s.Open}</span><span style={{ color: '#06b6d4' }}>ARV:{s.Arrived}</span><span style={{ color: '#16a34a' }}>DLV:{s.Delivered}</span><span style={{ color: '#dc2626' }}>SUS:{s.Suspended}</span><span style={{ color: '#2563eb' }}>CLS:{s.Closed}</span></div>
          </div>)}
        </div>
      </div>

      {/* 📈 CHART 5: DYNAMIC TIME WINDOWS METRIC & STATUS REPORT */}
      <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px', gridColumn: '1 / -1' }}>
        <h4>📊 5. Dynamic Time Windows Metric & Status Report</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {[
            { label: 'Daily Window (Today) 🗓️', data: periodStats.D, barClr: '#3b82f6' },
            { label: 'Weekly Window (Past 7d) 🗓️', data: periodStats.W, barClr: '#6366f1' },
            { label: 'Monthly Window (Past 30d) 🗓️', data: periodStats.M, barClr: '#0284c7' }
          ].map((p, i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>
                <span>{p.label}</span>
                <span style={{ color: p.barClr }}>{p.data.tot} Files</span>
              </div>
              <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ width: `${(p.data.tot / maxPeriodTot) * 100}%`, background: p.barClr, height: '100%', transition: 'width 0.3s' }} />
              </div>
              {/* Type breakdown layer */}
              <div style={{ display: 'flex', gap: '10px', fontSize: '10px', fontFamily: 'monospace', color: '#475569', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '6px' }}>
                <span>⏳DLY: {p.data.Delayed || 0}</span>
                <span>💥DMG: {p.data.Damaged || 0}</span>
                <span>🧳OH: {p.data.Onhand || 0}</span>
              </div>
              {/* Added Real-time Status Breakdown metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                <span style={{ color: '#b45309' }}>⚠️ Active: {p.data.active}</span>
                <span style={{ color: '#15803d' }}>✅ Closed: {p.data.closed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
