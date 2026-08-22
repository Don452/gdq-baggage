import React, { useState, useEffect } from 'react';
import { sb } from '../utils/supabaseClient';

export default function RowChatTray({ bagRecordId, bagTag, currentUser, fetchRecords }) {
    const [chatData, setChatData] = useState(null);
    const [msgText, setMsgText] = useState('');
    const curSt = String(currentUser?.station_code || '').trim().toUpperCase();

    // 🎯 THE RELATIONAL NUMBER PARSER FIX: Forces clean numerical BigInt casting matches
    const numericRecordId = Number(bagRecordId);

    const loadChat = async () => {
        if (!numericRecordId) return;
        const { data } = await sb
            .from('station_requests')
            .select('*')
            .eq('baggage_record_id', numericRecordId)
            .eq('status', 'Pending')
            .maybeSingle();
        setChatData(data);
    };

    useEffect(() => {
        loadChat();

        // 📡 LIVE REALTIME BROADCAST SOCKET CORNER ENGINE
        const liveChatChannel = sb.channel(`row_chat_${numericRecordId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'station_requests',
                filter: `baggage_record_id=eq.${numericRecordId}`
            }, (payload) => {
                if (payload.new && payload.new.status === 'Pending') {
                    setChatData(payload.new); // Instantly streams live inbound typing directly onto your view
                } else if (payload.new && payload.new.status !== 'Pending') {
                    setChatData(null); // Clear panel frame instantly if connection completes
                    fetchRecords?.();
                }
            })
            .subscribe();

        return () => {
            try { sb.removeChannel(liveChatChannel); } catch (e) { }
        };
    }, [numericRecordId]);

    if (!chatData) return null;
    const logs = Array.isArray(chatData.chat_history) ? chatData.chat_history : [];
    const handleSend = async (e) => {
        e.preventDefault();
        if (!msgText.trim()) return;

        const baselineHistory = Array.isArray(chatData.chat_history) ? chatData.chat_history : [];
        const updatedHistory = [...baselineHistory, { sender: String(curSt), text: msgText.trim() }];

        const { error } = await sb
            .from('station_requests')
            .update({ chat_history: updatedHistory })
            .eq('id', Number(chatData.id));

        if (error) {
            // 🚨 Error Confirmation Notification Trigger
            alert(`❌ Chat Sync Error: ${error.message} (Code: ${error.code})`);
            console.error("Supabase Chat Error Stack:", error);
        } else {
            // ✅ Success Confirmation Notification Trigger
            alert("⚡ Message sent and synced successfully!");
            setMsgText('');
            loadChat();
        }
    };



    return (
        <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', margin: '8px 16px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>📬 Active Channel: {bagTag} ({chatData.requesting_station} ➔ {chatData.holding_station})</span>
                {chatData.holding_station === curSt && (
                    <button
                        onClick={async () => {
                            if (window.confirm("Close and mark this operational request as resolved?")) {
                                await sb.from('station_requests').update({ status: 'Completed' }).eq('id', chatData.id);
                                fetchRecords?.();
                            }
                        }}
                        style={{ padding: '3px 8px', fontSize: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✓ Complete &amp; Close
                    </button>
                )}
            </div>

            {/* Visual Messaging Window Context Map box viewport frame container scrolling stack layer */}
            <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {logs.map((item, idx) => {
                    const isMe = String(item?.sender).toUpperCase() === curSt;
                    return (
                        <div
                            key={idx}
                            style={{
                                fontSize: '12px', padding: '6px', borderRadius: '4px', maxWidth: '85%',
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? '#f0fdf4' : '#f1f5f9',
                                borderLeft: isMe ? '3px solid #16a34a' : '3px solid #64748b'
                            }}
                        >
                            <b style={{ color: isMe ? '#166534' : '#334155' }}>[{item?.sender}]:</b> {item?.text}
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px' }}>
                <input
                    type="text"
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Type message reply to station operator..."
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
                <button type="submit" style={{ padding: '6px 14px', fontSize: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
            </form>
        </div>
    );
}
