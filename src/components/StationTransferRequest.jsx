import React, { useState } from 'react';
import { sb } from '../utils/supabaseClient';
import '../styles/StationTransferRequest.css';

export default function StationTransferRequest({ bag, currentUser, onClose, onComplete }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const tag = bag?.bag_tag_number || '—';
  const holdSt = bag?.station_code || 'GDQ';
  const reqSt = currentUser?.station_code || 'GDQ';

  const sub = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setLoading(true);
    
    const { error } = await sb.from('station_requests').insert([{
      baggage_record_id: bag.id,
      bag_tag_number: tag.toUpperCase().trim(),
      requesting_station: reqSt.toUpperCase().trim(),
      holding_station: holdSt.toUpperCase().trim(),
      agent_message: msg.trim(),
      status: 'Pending',
      chat_history: [{ sender: reqSt.toUpperCase(), text: msg.trim() }]
    }]);
    
    setLoading(false);
    
    if (error) {
      alert(`❌ Request Failed: ${error.message} (Code: ${error.code})`);
    } else {
      alert(`🚀 Success! Transfer request dispatched to station ${holdSt.toUpperCase()} successfully.`);
      onComplete?.(); 
      onClose();
    }
  };

  return (
    <div className="transfer-modal-overlay">
      <div className="transfer-modal-card">
        <h4 className="transfer-modal-title">📬 Request Transfer From ({reqSt} ➔ {holdSt})</h4>
        
        <div className="transfer-summary-box">
          <div className="transfer-summary-line">Tag: <b>{tag}</b></div>
          <div className="transfer-summary-line">Passenger: <b>{`${bag?.passenger_first_name || ''} ${bag?.passenger_last_name || ''}`.trim()}</b></div>
        </div>

        <form onSubmit={sub}>
          <textarea 
            value={msg} 
            onChange={e => setMsg(e.target.value)} 
            placeholder="Message..." 
            rows="3" 
            className="transfer-textarea" 
            required 
          />
          <div className="transfer-actions-group">
            <button 
              type="button" 
              onClick={onClose} 
              className="transfer-btn transfer-btn-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="transfer-btn transfer-btn-submit"
            >
              {loading ? "Sending..." : "Send ✈️"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
