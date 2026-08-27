import React, { useState, useEffect } from 'react';
import { sb } from '../utils/supabaseClient';
import { hPrnt } from '../utils/printEngine';
import '../styles/dashboardtable.css';
import '../styles/stationDrop.css';
import StationTransferRequest from './StationTransferRequest';
import StationRequests from './StationRequests';

export default function DashboardTable({ fil = [], u, edId, setEdId, edF, setEdF, fetchRecords }) {

  const getInitials = (agentNameStr) => {
    const nameStr = String(agentNameStr || '').trim();
    
    // Checks if the entry was logged by the system matrix loop automatically
    if (!nameStr || nameStr.toLowerCase() === 'system') return 'SYS';

    // Splits the text cleanly by space blocks into separate name strings inside an array
    const nameParts = nameStr.split(/\s+/);

    // 🎯 THE FIX: Extract index [0] first letter and index [1] first letter cleanly
    const firstInitial = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() : '';
    const secondInitial = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() : '';

    const exactInitials = `${firstInitial}${secondInitial}`;

    // Fallback: If there is no middle name word found, return the first 2 letters of the first name
    return exactInitials.length === 2
      ? exactInitials
      : nameStr.substring(0, 2).toUpperCase();
  };



  const [actBag, setActBag] = useState(null), [notifs, setNotifs] = useState([]), [showDrop, setShowDrop] = useState(false), [replyTexts, setReplyTexts] = useState({});
  // Place this next to your [actBag, setActBag] or [notifs, setNotifs] states

  const [expTl, setExpTl] = useState({});

  const stCode = String(u?.station_code || '').trim().toUpperCase(), cls = (c) => ['red', 'green'].includes((c || '').toLowerCase()) ? `color-badge-${c.toLowerCase()}` : 'color-badge-fallback';

  const sync = async () => {
    if (!stCode) return;
    const { data } = await sb.from('station_requests').select('*').eq('status', 'Pending').or(`holding_station.eq.${stCode},requesting_station.eq.${stCode}`);
    if (data) setNotifs(data);
  };

  useEffect(() => {
    if (!stCode) return;
    sync();
    const ch = sb.channel('table_transfers_stream').on('postgres_changes', { event: '*', schema: 'public', table: 'station_requests' }, p => {
      const row = p.new || p.old || {}, hold = String(row.holding_station || '').toUpperCase(), req = String(row.requesting_station || '').toUpperCase();
      if (hold === stCode || req === stCode) {
        if (p.eventType === 'INSERT' && p.new.status === 'Pending') {
          setNotifs(prev => [p.new, ...prev]);
          if (hold === stCode) try { new Audio('https://mixkit.co').play(); } catch { }
        } else if (p.eventType === 'UPDATE') {
          if (p.new.status !== 'Pending') setNotifs(p => p.filter(i => String(i.id) !== String(row.id)));
          else setNotifs(p => p.map(i => String(i.id) === String(p.new.id) ? p.new : i));
        }
      }
    }).subscribe();
    return () => { try { sb.removeChannel(ch); } catch { } };
  }, [stCode]);

  const reply = async (e, n) => {
    e.preventDefault();
    const txt = replyTexts[n.id]?.trim();
    if (!txt) return;
    const history = Array.isArray(n.chat_history) ? n.chat_history : [];
    const { error } = await sb.from('station_requests').update({ chat_history: [...history, { sender: stCode, text: txt }] }).eq('id', n.id);
    if (!error) { setReplyTexts(p => ({ ...p, [n.id]: '' })); sync(); }
  };

  const closeReq = async (id, tag) => {
    if (!window.confirm(`Close Tag ${tag}?`)) return;
    const { error } = await sb.from('station_requests').update({ status: 'Closed' }).eq('id', id);
    if (!error) { setNotifs(p => p.filter(i => i.id !== id)); fetchRecords?.(); }
  };

  return (
    <>
      <div className="station-req-wrapper" >
        <button onClick={() => setShowDrop(!showDrop)} className="station-req-btn"><span>📬 Station Requests</span> {notifs.length > 0 ? <span className="station-badge-new">{notifs.length} NEW</span> : <span className="station-badge-empty">Empty</span>}</button>
        {showDrop && (
          <div className="station-dropdown-panel">
            <div className="station-dropdown-header">📥 Incoming Claims Inbox</div>
            <div className="station-dropdown-scroll">
              {!notifs.length ? <div className="station-empty-msg">No claims found.</div> : notifs.map((n, idx) => (
                <div key={n.id || idx}>
                  <div className="station-item-top"><span className="station-item-origin">🛫 From: {n.requesting_station}</span><button onClick={() => closeReq(n.id, n.bag_tag_number)} className="station-item-close-x">&times;</button></div>
                  <div className="bag-tag-mono">ET: {n.bag_tag_number}</div>
                  <p className="station-item-msg">"{n.agent_message || n.message || n.notes || 'No notes.'}"</p>
                  <div className="station-chat-viewport" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(Array.isArray(n.chat_history) ? n.chat_history : []).map((m, i) => {
                      const isMe = m.sender === stCode;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            width: '100%',
                            justifyContent: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div
                            className={isMe ? 'station-chat-bubble-me' : 'station-chat-bubble-them'}
                            style={{
                              background: isMe ? '#f0fdf4' : '#f1f5f9',
                              padding: '12px 14px',
                              borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                              maxWidth: '70%',
                              width: 'max-content',
                              height: 'auto',
                              wordBreak: 'break-word',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <b>[{m.sender}]:</b> {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={e => reply(e, n)} className="station-chat-form"><input type="text" value={replyTexts?.[n.id] || ''} onChange={e => setReplyTexts({ ...replyTexts, [n.id]: e.target.value })} placeholder="Reply..." required /><button type="submit" className="btn-sm btn-row-print">✈️</button></form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-table-card"><div className="table-scroll-container"><div className="grid-table">
        <div className="grid-row grid-header">{['Origin', 'Tag', 'Last Name', 'First Name', 'File Ref', 'Ticket', 'Phone', 'Color', 'Weight', 'Incident', 'Agent', 'Tracer', 'Status', 'Actions'].map(c => <div key={c} className="grid-cell">{c}</div>)}</div>
        {!fil.length ? <div className="grid-cell" style={{ padding: '40px', textAlign: 'center', gridColumn: 'span 14', color: 'var(--text-muted)' }}>🛄 No matching records.</div> : fil.map(b => {
          const isEd = edId && String(edId) === String(b.id), it = isEd ? edF : b, cM = u?.is_admin || u?.station_code === b.station_code;
          const colorCls = cls(b.bag_color), irType = String(b.irregularity_type || 'Delayed').toLowerCase(), irrCls = ['delayed', 'damaged', 'onhand'].includes(irType) ? `irregularity-${irType}` : 'irregularity-delayed';
          return (
            <div key={b.id || b.bag_tag_number} className={`grid-row ${isEd ? 'row-active-edit' : cM ? 'row-scope-open' : 'row-scope-locked'}`}>
              <div className="grid-cell"><span className="station-node-badge">{b.station_code || ''}</span></div>
              <div className="grid-cell">{isEd ? <input value={it.bag_tag_number || ''} onChange={e => setEdF({ ...edF, bag_tag_number: e.target.value })} /> : <span className="bag-tag-mono">{b.bag_tag_number}</span>}</div>
              <div className="grid-cell">{isEd ? <input value={it.passenger_last_name || ''} onChange={e => setEdF({ ...edF, passenger_last_name: e.target.value })} /> : b.passenger_last_name}</div>
              <div className="grid-cell">{isEd ? <input value={it.passenger_first_name || ''} onChange={e => setEdF({ ...edF, passenger_first_name: e.target.value })} /> : b.passenger_first_name}</div>
              <div className="grid-cell">{isEd ? <input value={it.file_number || ''} onChange={e => setEdF({ ...edF, file_number: e.target.value })} /> : b.file_number || '—'}</div>
              <div className="grid-cell">{isEd ? <input maxLength={13} value={it.ticket_number || ''} onChange={e => setEdF({ ...edF, ticket_number: e.target.value })} /> : b.ticket_number || '—'}</div>
              <div className="grid-cell">{isEd ? <input maxLength={13} value={it.phone_number || ''} onChange={e => setEdF({ ...edF, phone_number: e.target.value })} /> : b.phone_number || '—'}</div>
              <div className="grid-cell">{isEd ? <select value={it.bag_color || ''} onChange={e => setEdF({ ...edF, bag_color: e.target.value })}>{['', 'Black', 'Red', 'Blue', 'Brown', 'Grey', 'Green'].map(c => <option key={c} value={c}>{c || 'None'}</option>)}</select> : <span className={`color-attribute-badge ${colorCls}`}>{b.bag_color || '—'}</span>}</div>
              <div className="grid-cell">{isEd ? <input type="number" value={it.bag_kilos || ''} onChange={e => setEdF({ ...edF, bag_kilos: e.target.value })} /> : (b.bag_kilos ? <b>{b.bag_kilos} KG</b> : '—')}</div>
              <div className="grid-cell">{isEd ? <select value={it.irregularity_type || ''} onChange={e => setEdF({ ...edF, irregularity_type: e.target.value })}>{['Delayed', 'Damaged', 'Onhand'].map(t => <option key={t} value={t}>{t}</option>)}</select> : <span className={`irregularity-status-tag ${irrCls}`}>{b.irregularity_type}</span>}</div>
              <div className="grid-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
                👤 {getInitials(b.agent_name)}
              </div>

              <div className="grid-cell wt-cell-container">
                <a
                  href="https://desktop.worldtracer.aero/desktop/index.html#!/index/landing"
                  target="_blank"
                  rel="noreferrer"
                  className="wt-action-button-link"
                >
                  Trace
                </a>

              </div>
              <div className="grid-cell status-select-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>

                {/* 🎯 TARGET INTEGRATED: Dynamic Animated Pulsing Radar Indicator Dot Element */}
                {(() => {
                  const currentStatus = isEd ? edF.bag_status : (b.bag_status || 'Open');
                  const sLower = String(currentStatus).toLowerCase();

                  // Hide indicator dot entirely if the file record is permanently closed
                  if (sLower === 'closed') return null;

                  return (
                    <span
                      className={`status-pulse-radar pulse-type-${sLower}`}
                      title={`Status tracking flag: File is currently ${currentStatus}`}
                    />
                  );
                })()}

                <select
                  disabled={!isEd && !u?.is_admin}
                  value={isEd ? edF.bag_status : (b.bag_status || 'Open')}
                  className={`status-dropdown-control ${isEd ? 'mode-editing' : 'mode-static'} ${(() => {
                    const s = isEd ? edF.bag_status : (b.bag_status || 'Open');
                    return `status-color-${String(s).toLowerCase()}`;
                  })()
                    }`}
                  style={{ flex: 1, minWidth: '0' }} /* Ensures proper sharing of cell horizontal track room */
                  onChange={async (e) => {
                    const selectedValue = e.target.value;

                    if (isEd) {
                      setEdF({ ...edF, bag_status: selectedValue });
                    } else {
                      if (!window.confirm(`Are you certain you want to update status to: ${selectedValue}?`)) return;

                      const { error } = await sb
                        .from('bagaage_records')
                        .update({ bag_status: selectedValue })
                        .eq('id', b.id);

                      if (error) {
                        alert(`🚫 Operational sync fault: ${error.message}`);
                      } else if (typeof fetchRecords === 'function') {
                        fetchRecords();
                      }
                    }
                  }}
                >
                  <option value="Open" className="opt-open">Open</option>
                  <option value="Arrived" className="opt-arrived">Arrived</option>
                  <option value="Delivered" className="opt-delivered">Delivered</option>
                  <option value="Suspended" className="opt-suspended">Suspended</option>
                  <option value="Closed" className="opt-closed">Closed</option>
                </select>
              </div>






              <div className="grid-cell">
                {isEd ? (
                  <>
                    <button onClick={async () => { if (!(await sb.from('baggage_records').update(edF).eq('id', b.id)).error) { setEdId(null); fetchRecords(); } }} className="btn-sm btn-save-check" style={{ flex: '1 1 auto' }}>Save</button>
                    <button onClick={() => setEdId(null)} className="btn-sm" style={{ background: 'var(--text-muted)', color: '#fff', flex: '1 1 auto' }}>X</button>
                  </>
                ) : (
                  <>
                    {cM ? (
                      <button onClick={() => { setEdId(b.id); setEdF({ ...b }); }} className="btn-sm btn-row-edit" style={{ flex: '1 1 auto' }}>Edit</button>
                    ) : (
                      <button disabled className="btn-sm btn-row-edit-disabled" style={{ flex: '1 1 auto', opacity: 0.3 }}>Edit</button>
                    )}

                    <button onClick={() => hPrnt(b)} className="btn-sm btn-row-print" style={{ flex: '1 1 auto' }}>🖨️</button>

                    {((b.irregularity_type === 'Onhand' || b.irregularity_type === 'Tagless') && String(b.station_code).toUpperCase() !== stCode) && (
                      <button
                        onClick={() => setActBag(b)}
                        className="btn-sm"
                        style={{ background: 'var(--ethiopian-red)', color: '#fff', flex: '1 1 auto' }}
                      >
                        Request
                      </button>
                    )}


                    {/* 🔒 Strict Mode Deletion validation element safely tucked inside action workflow limits */}
                    <button
                      className="btn-sm"
                      style={{ background: '#ef4444', color: '#fff', fontWeight: '700', flex: '1 1 auto' }}
                      onClick={async () => {
                        // 🛡️ Ground Guard Check Validation: Compare secure unique ID strings instead of mutable first/middle name strings
                        const currentAgentCode = String(u?.agent_code || '').trim().toUpperCase();
                        const recordCreatorCode = String(b.custom_agent_id || '').trim().toUpperCase();

                        if (currentAgentCode !== recordCreatorCode) {
                          return alert(`🚫 Action Blocked: Deletions limited to creator. Creator: ${b.agent_name || 'System Authorized'}`);
                        }

                        if (window.confirm('Are you certain you want to purge this record file permanently?')) {
                          const { error } = await sb.from('baggage_records').delete().eq('id', b.id);

                          if (error) {
                            alert(`🚫 Delete failed: ${error.message}`);
                          } else {
                            if (typeof fetchRecords === 'function') fetchRecords();
                          }
                        }
                      }}
                    >
                      Del
                    </button>

                  </>
                )}
              </div>

            </div>
          );
        })}
      </div></div></div>


      {actBag && <StationTransferRequest bag={actBag} currentUser={u} onClose={() => setActBag(null)} onComplete={() => { sync(); fetchRecords(); }} />}
    </>
  );
}
