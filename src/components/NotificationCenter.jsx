import React, { useEffect, useState } from 'react';
import { sb } from '../utils/supabaseClient';
import '../styles/notificationCenter.css';

export default function NotificationCenter({ currentUser }) {
  const [channels, setChannels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const st = String(currentUser?.station_code || '').trim().toUpperCase();

  // Pull all pending transfer tasks for this terminal node
  const fetchActiveChannels = async () => {
    if (!st) return;
    const { data } = await sb.from('station_requests')
      .select('*')
      .eq('holding_station', st)
      .eq('status', 'Pending')
      .order('updated_at', { ascending: false });
    if (data) {
      setChannels(data);
      if (data.length && !activeId) setActiveId(data[0].id);
    }
  };

  useEffect(() => {
    if (!st) return;
    fetchActiveChannels();

    const ch = sb.channel('st_alerts_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'station_requests' }, () => {
        fetchActiveChannels();
      })
      .subscribe();

    return () => { try { sb.removeChannel(ch); } catch(e) {} };
  }, [st]);

  const activeChat = channels.find(c => c.id === activeId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;

    const history = Array.isArray(activeChat.chat_history) ? activeChat.chat_history : [];
    const newMsg = { sender: st, text: replyText.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    const { error } = await sb.from('station_requests')
      .update({ chat_history: [...history, newMsg] })
      .eq('id', activeChat.id);

    if (!error) {
      setReplyText('');
      fetchActiveChannels();
    }
  };

  const closeTask = async (id) => {
    if (!window.confirm("Archive this transfer session?")) return;
    const { error } = await sb.from('station_requests').update({ status: 'Closed' }).eq('id', id);
    if (!error) {
      setActiveId(null);
      fetchActiveChannels();
    }
  };

  if (!channels.length) {
    return (
      <div className="chat-page-empty">
        <div className="empty-graphic">📥</div>
        <h3>No Open Transfers</h3>
        <p>Your station workspace is currently clear.</p>
      </div>
    );
  }

  return (
    <div className="chat-page-container">
      {/* 📁 Left Channels Panel Master Track */}
      <div className="chat-sidebar">
        <div className="sidebar-header">Active Baggage Claims ({channels.length})</div>
        <div className="sidebar-list">
          {channels.map(c => (
            <div key={c.id} className={`sidebar-item ${c.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
              <div className="item-meta">
                <span className="node-pill">{c.requesting_station} ➔ {c.holding_station}</span>
              </div>
              <div className="item-tag">TAG: {c.bag_tag_number}</div>
              <div className="item-preview">"{c.agent_message || 'No initial comment.'}"</div>
            </div>
          ))}
        </div>
      </div>

      {/* 💬 Right Chat Interface Workspace */}
      <div className="chat-main-window">
        {activeChat ? (
          <>
            <div className="chat-window-header">
              <div className="header-details">
                <h3>Baggage Tag: {activeChat.bag_tag_number}</h3>
                <p>Origin Terminal Request: <b>{activeChat.requesting_station}</b></p>
              </div>
              <button onClick={() => closeTask(activeChat.id)} className="btn-resolve-archive">✓ Mark Resolved</button>
            </div>

            {/* Universal Alignment Viewport (Receiver Left, Responder Right) */}
            <div className="chat-history-viewport">
              {/* Receiver (Requesting Agent Initial Context Block on Left) */}
              <div className="chat-bubble-row receiver">
                <div className="chat-avatar">{activeChat.requesting_station}</div>
                <div className="chat-bubble-wrapper">
                  <div className="chat-bubble-sender">Station {activeChat.requesting_station} Handler</div>
                  <div className="chat-bubble-body">{activeChat.agent_message || "Luggage transfer request initiated."}</div>
                </div>
              </div>

              {/* Chat Thread Loop */}
              {(Array.isArray(activeChat.chat_history) ? activeChat.chat_history : []).map((m, i) => {
                const isResponder = String(m.sender).toUpperCase() === st;
                return (
                  <div key={i} className={`chat-bubble-row ${isResponder ? 'responder' : 'receiver'}`}>
                    {!isResponder && <div className="chat-avatar">{m.sender}</div>}
                    <div className="chat-bubble-wrapper">
                      <div className="chat-bubble-sender">{isResponder ? 'Your Terminal' : `Station ${m.sender}`}</div>
                      <div className="chat-bubble-body">{m.text}</div>
                      {m.time && <div className="chat-bubble-time">{m.time}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="chat-footer-form">
              <input 
                type="text" 
                value={replyText} 
                onChange={e => setReplyText(e.target.value)} 
                placeholder="Type your response instructions..." 
                className="chat-footer-input"
                required 
              />
              <button type="submit" className="chat-footer-btn-send">Send Message</button>
            </form>
          </>
        ) : (
          <div className="chat-window-blank">Select a claim from the roster tray to engage.</div>
        )}
      </div>
    </div>
  );
}
