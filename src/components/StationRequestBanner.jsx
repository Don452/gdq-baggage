import React, { useState, useEffect } from 'react';
import { sb } from '../utils/supabaseClient';
import '../styles/stationRequestBanner.css';

export default function StationRequestBanner({ currentUser, fetchRecords }) {
  const [notifs, setNotifs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [replyTexts, setReplyTexts] = useState({});
  const stCode = String(currentUser?.station_code || '').trim().toUpperCase();

  const syncData = async () => {
    if (!stCode) return;
    const { data } = await sb.from('station_requests')
      .select('*')
      .eq('status', 'Pending')
      .eq('holding_station', stCode);
    if (data) setNotifs(data);
  };

  useEffect(() => {
    if (!stCode) return;
    syncData();

    const ch = sb.channel('banner_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'station_requests' }, p => {
        const row = p.new || {};
        const hold = String(row.holding_station || '').toUpperCase();
        const id = p.new?.id || p.old?.id;

        if (p.eventType === 'INSERT' && hold === stCode && p.new.status === 'Pending') {
          setNotifs(prev => [p.new, ...prev]);
          try { new Audio('https://mixkit.co').play(); } catch(e) {}
        } else if (p.eventType === 'UPDATE') {
          if (p.new.status !== 'Pending') {
            setNotifs(prev => prev.filter(i => String(i.id) !== String(id)));
          } else if (hold === stCode) {
            setNotifs(prev => prev.map(i => String(i.id) === String(p.new.id) ? p.new : i));
          }
        }
      })
      .subscribe();

    return () => { try { sb.removeChannel(ch); } catch(e) {} };
  }, [stCode]);

  if (!notifs.length) return null;

  return (
    <div className="modern-request-banner">
      {/* 🚨 Modern Header Track Controls Component */}
      <div className={`modern-banner-header ${isOpen ? 'is-open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="banner-header-left">
          <span className="live-pulse-dot"></span>
          <span className="banner-count-badge">{notifs.length}</span>
          <h2 className="banner-main-title">Incoming Station Transfer Workspaces</h2>
        </div>
        <button className="banner-tray-toggle">
          {isOpen ? 'Minimize Live Workspace' : 'Expand Inter-Station Hub'}
          <span className={`banner-arrow-icon ${isOpen ? 'rotate-up' : ''}`}>▾</span>
        </button>
      </div>

      {/* 📥 Content Chat Viewports Frame Matrix Section */}
      {isOpen && (
        <div className="modern-banner-body">
          {notifs.map(n => (
            <div key={n.id} className="modern-workspace-grid">
              
              {/* Left Column: Baggage Metadata Sheet */}
              <div className="workspace-meta-sidebar">
                <div className="sidebar-section-label">Baggage Details</div>
                <div className="meta-tag-wrapper">
                  <span className="meta-label">Tag Number</span>
                  <span className="meta-value-tag">{n.bag_tag_number}</span>
                </div>
                <div className="meta-route-flow">
                  <div className="route-node-block">
                    <span className="node-indicator req">REQ</span>
                    <span className="node-code">{n.requesting_station}</span>
                  </div>
                  <div className="route-line-arrow">➔</div>
                  <div className="route-node-block">
                    <span className="node-indicator hold">HOLD</span>
                    <span className="node-code">{n.holding_station}</span>
                  </div>
                </div>
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation();
                    if (window.confirm(`Mark Tag ${n.bag_tag_number} request as resolved?`)) { 
                      const { error } = await sb.from('station_requests').update({ status: 'Closed' }).eq('id', n.id); 
                      if (!error) {
                        setNotifs(p => p.filter(i => i.id !== n.id)); 
                        fetchRecords?.(); 
                      }
                    } 
                  }} 
                  className="modern-btn-resolve"
                >
                  ✓ Close & Resolve File
                </button>
              </div>

              {/* Right Column: Wide Communications Terminal Area */}
              <div className="workspace-chat-container">
                <div className="chat-window-header">
                  💬 Secure Routing Terminal Channel — Active Session
                </div>

                <div className="modern-chat-viewport">
                  {/* Originating System/Agent Notification Message Box */}
                  <div className="chat-bubble-row is-system">
                    <div className="chat-bubble-wrapper">
                      <div className="bubble-meta">Originating Broadcast &bull; Agent [{n.requesting_station}]</div>
                      <div className="chat-bubble">
                        {n.agent_message || 'Initiated luggage claim action.'}
                      </div>
                    </div>
                  </div>

                  {/* Operational Chat History Threads Matrix */}
                  {(Array.isArray(n.chat_history) ? n.chat_history : []).map((m, i) => { 
                    const isMe = String(m.sender).toUpperCase() === stCode; 
                    return (
                      <div key={i} className={`chat-bubble-row ${isMe ? 'is-outgoing' : 'is-incoming'}`}>
                        <div className="chat-bubble-wrapper">
                          <div className="bubble-meta">
                            {isMe ? `Your Terminal [${m.sender}]` : `Handler Node [${m.sender}]`}
                          </div>
                          <div className="chat-bubble">
                            {m.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Wide Message Input Submissions Form Element */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const txt = replyTexts[n.id]?.trim();
                  if (!txt) return;
                  const history = Array.isArray(n.chat_history) ? n.chat_history : [];
                  const { error } = await sb.from('station_requests').update({ chat_history: [...history, { sender: stCode, text: txt }] }).eq('id', n.id);
                  if (!error) {
                    setReplyTexts(p => ({ ...p, [n.id]: '' }));
                    syncData();
                  }
                }} className="modern-chat-form">
                  <input 
                    type="text" 
                    value={replyTexts[n.id] || ''} 
                    onChange={e => setReplyTexts(p => ({ ...p, [n.id]: e.target.value }))} 
                    placeholder="Type dispatch updates or routing remarks back to handler terminal..." 
                    className="modern-chat-input"
                    required
                  />
                  <button type="submit" className="modern-btn-send">Send Dispatch ✈️</button>
                </form>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
