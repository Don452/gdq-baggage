import React, { useState } from 'react';
import '../styles/StationRequests.css'; // Make sure to match your CSS directory path

export default function StationRequests({ notifs = [], stCode, reply, replyTexts, setReplyTexts, closeReq }) {
    const [showDrop, setShowDrop] = useState(false);

    return (
        <div className="station-req-wrapper">
            {/* 📬 MAIN CONTROLLER ACTION ACTION TRIGGER BUTTON */}
            <button onClick={() => setShowDrop(!showDrop)} className="station-req-btn">
                <span>📬 Station Requests</span>
                {notifs.length > 0 ? (
                    <span className="station-badge-new">{notifs.length} NEW</span>
                ) : (
                    <span className="station-badge-empty">Empty</span>
                )}
            </button>

            {/* 📥 DYNAMIC CHAT MANAGEMENT MODAL BOX */}
            {showDrop && (
                <div className="station-dropdown-panel">
                    <div className="station-dropdown-header">📥 Incoming Claims Inbox</div>
                    <div className="station-dropdown-scroll">
                        {!notifs.length ? (
                            <div className="station-empty-msg">No active channel logs found.</div>
                        ) : (
                            notifs.map((n, idx) => {
                                const chatHistoryList = Array.isArray(n.chat_history) ? n.chat_history : [];
                                return (
                                    <div key={n.id || idx} className="station-chat-session-card">

                                        {/* CHANNEL MONITOR HEADER TRACK */}
                                        <div className="station-item-top">
                                            <span className="station-item-origin">🛫 Hub Channel: <b>{n.requesting_station}</b></span>
                                            <button
                                                onClick={() => closeReq(n.id, n.bag_tag_number)}
                                                className="station-item-close-x"
                                                title="Archive Stream"
                                            >
                                                &times;
                                            </button>
                                        </div>

                                        {/* REFERENCE META PILLS */}
                                        <div className="station-chat-meta-bar">
                                            <span className="bag-tag-mono">🏷️ REF: {n.bag_tag_number}</span>
                                            {n.irregularity_type && <span className="chat-type-pill">{n.irregularity_type}</span>}
                                        </div>

                                        {/* ROOT ACTION DISPATCH REPORT DETAIL BUBBLE */}
                                        <div className="station-chat-manifesto-bubble">
                                            <span className="manifesto-label">📌 INITIAL INCIDENT MANIFEST:</span>
                                            <p className="station-item-msg">"{n.agent_message || n.message || n.notes || 'No terminal notes attached.'}"</p>
                                        </div>

                                        {/* UNIVERSAL CHAT VIEWPORT (LEFT / RIGHT FLOATING ALIGNMENT ENGINE) */}
                                        <div className="station-chat-viewport">
                                            {chatHistoryList.map((m, i) => {
                                                const isMe = String(m.sender).toUpperCase() === String(stCode).toUpperCase();
                                                return (
                                                    <div className={`chat-row-container ${isMe ? 'chat-row-me' : 'chat-row-them'}`}>
                                                        <div className="chat-bubble-wrapper">
                                                            {/* 🎯 SPECIFIC CLASSES ASSIGNED DYNAMICALLY PER LANESURFACE */}
                                                            <div className={isMe ? 'station-chat-bubble-me' : 'station-chat-bubble-them'}>
                                                                <span className="chat-bubble-sender-tag">{m.sender}</span>
                                                                <div>{m.text}</div>
                                                                {m.time && (
                                                                    <span className="chat-bubble-timestamp">
                                                                        {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                );
                                            })}

                                        </div>

                                        {/* INTERACTION TRANSMISSION TEXT BAR */}
                                        <form onSubmit={e => reply(e, n)} className="station-chat-form">
                                            <input
                                                type="text"
                                                value={replyTexts?.[n.id] || ''}
                                                onChange={e => setReplyTexts({ ...replyTexts, [n.id]: e.target.value })}
                                                placeholder="Type operational response message..."
                                                required
                                            />
                                            <button type="submit" className="btn-chat-send">Send ⚡</button>
                                        </form>

                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
