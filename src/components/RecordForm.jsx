import React, { useState, useEffect } from 'react';
import { sb } from '../utils/supabaseClient';
import { compressBaggagePhoto } from '../utils/compressor';
import '../styles/RecordForm.css';

export default function RecordForm({ u, form, setForm, fetchRecords }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (!form.flight_date) {
      const today = new Date().toISOString().split('T')[0];
      setForm(prev => ({ ...prev, flight_date: today }));
    }
  }, []);

  const handlePhotoSelection = async (e) => {
    if (!e.target.files) return;
    setIsCompressing(true);
    const rawFileList = Array.from(e.target.files);
    try {
      const optimizedPhotosList = await Promise.all(rawFileList.map(file => compressBaggagePhoto(file, 1200, 0.7)));
      setPhotos(optimizedPhotosList);
    } catch (err) {
      console.error("Photo optimization failure caught:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  const curSt = String(u?.station_code || 'GDQ').trim().toUpperCase(), isTagless = form.irregularity_type === 'Tagless';
  
  // 🎯 DIVIDED HOOKS STRIP MATRIX: Split into two horizontal visual rows
  const rowOneFields = ['bag_tag_number', 'flight_number', 'passenger_last_name', 'passenger_first_name'];
  const rowTwoFields = ['file_number', 'ticket_number', 'phone_number'];

  const convertFileToBase64 = file => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); r.onerror = e => rej(e);
  });

  const hRec = async (e) => {
    e.preventDefault(); const t = form.irregularity_type || 'Delayed';
    if (isTagless && !form.item_description?.trim()) return alert('⚠️ Missing description.');
    if (isTagless && photos.length === 0) return alert('⚠️ Please attach baggage proof photos.');
    if (!isTagless && (!form.bag_tag_number || !form.passenger_last_name || !form.flight_number || !form.flight_date)) return alert('⚠️ Missing required tracking fields.');

    setUploading(true); let base64Photos = [], finalizedTag = '';
    try {
      if (isTagless) {
        const { count, error } = await sb.from('baggage_records').select('bag_tag_number', { count: 'exact', head: true }).ilike('bag_tag_number', `ET-${curSt}-%`);
        if (error) throw error; finalizedTag = `ET-${curSt}-${(count || 0) + 1}`;
        for (const f of photos) { const b64 = await convertFileToBase64(f); base64Photos.push(b64); }
      } else { finalizedTag = String(form.bag_tag_number).toUpperCase().trim(); }
    } catch (err) { setUploading(false); return alert(`🚫 System Fault: ${err.message}`); }

    const agentFullName = `${u?.first_name || 'Agent'} ${u?.middle_name || ''}`.trim();
    const payload = {
      bag_tag_number: finalizedTag,
      flight_number: isTagless ? 'ET-UNKNOWN' : String(form.flight_number).toUpperCase().trim(),
      flight_date: isTagless ? null : form.flight_date,
      passenger_last_name: isTagless ? 'UNKNOWN' : String(form.passenger_last_name).trim(),
      passenger_first_name: isTagless ? 'UNKNOWN' : String(form.passenger_first_name).trim(),
      irregularity_type: t, bag_color: form.bag_color || (isTagless ? 'UNKNOWN' : 'Unspecified'),
      file_number: isTagless ? 'UNKNOWN' : form.file_number || null, ticket_number: isTagless ? 'UNKNOWN' : form.ticket_number || null, phone_number: isTagless ? 'UNKNOWN' : form.phone_number || null,
      bag_kilos: isTagless ? 0 : parseFloat(form.bag_kilos) || 0, station_code: curSt, origin_station: curSt, current_station: curSt, destination_station: curSt,
      agent_name: agentFullName, custom_agent_id: String(u?.agent_code || 'AG-UNKNOWN').toUpperCase(), bag_status: 'Open', metadata_matrix: {},
      tagless_description: isTagless ? form.item_description?.trim() : null, tagless_photos: isTagless ? base64Photos : []
    };

    const { error } = await sb.from('baggage_records').insert([payload]);
    setUploading(false);
    if (error) alert(`🚫 Database Error: ${error.message}`);
    else {
      setForm({ irregularity_type: t, bag_color: '', bag_kilos: '', item_description: '', flight_number: '', flight_date: new Date().toISOString().split('T')[0] });
      setPhotos([]); if (typeof fetchRecords === 'function') fetchRecords();
      alert(`✅ Registered under dynamic tracking label: ${finalizedTag}`);
    }
  };

  return (
    <div className="compact-form-card">
      <h3 className="form-section-title">🛄 Register Baggage</h3>
      <form onSubmit={hRec} className="compact-inline-form">
        
        {/* 🗺️ VERTICAL FLOW SPLITTER LINE A: PRIMARY TRACKS ROW */}
        <div className="form-layout-row-strip">
          <select className="mini-input mini-select font-bold" value={form.irregularity_type || 'Delayed'} onChange={e => setForm({ ...form, irregularity_type: e.target.value })}>
            <option value="Delayed">Delayed</option><option value="Damaged">Damaged</option><option value="Onhand">Onhand</option><option value="Tagless">🏷️ Tagless</option>
          </select>

          {!isTagless ? (
            <>
              {rowOneFields.map(f => <input key={f} className="mini-input" placeholder={f.replace(/_/g, ' ').toUpperCase()} required={['bag_tag_number', 'passenger_last_name', 'flight_number'].includes(f)} value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })} />)}
              {/* 🎯 FLIGHT DATE FIELD SLOT: Added your custom validation placeholder attribute label string cleanly */}
                            {/* 🎯 EYE-CATCHING TELEMETRY VERTICAL BADGE FLOATING ROW */}
              <div className="telemetry-date-wrapper-aligned">
                <span className="premium-radar-label">
                Flight Date
                </span>
                <input 
                  type="date" 
                  className="mini-input mini-date-input premium-date-box-minimized" 
                 
                  value={form.flight_date || ''} 
                  onChange={e => setForm({ ...form, flight_date: e.target.value })} 
                  required 
                />
              </div>

            </>
          ) : (
            <div className="tagless-horizontal-block">
              <input type="text" className="mini-input flex-grow-desc" placeholder="DETAILED DESCRIPTION / CONTENTS / VISUAL TRAITS..." value={form.item_description || ''} onChange={e => setForm({ ...form, item_description: e.target.value })} required />
              <select className="mini-input mini-select mini-tagless-color" value={form.bag_color || ''} onChange={e => setForm({ ...form, bag_color: e.target.value })}><option value="">Select Color...</option><option value="Black">Black (BK)</option><option value="Red">Red (RD)</option><option value="Blue">Blue (BL)</option><option value="Brown">Brown (BR)</option><option value="Grey">Grey (GY)</option><option value="Green">Green (GR)</option><option value="Other">Other Color</option></select>
              <div className="mini-upload-zone"><label className="mini-file-label">📸 {isCompressing ? 'Optimizing...' : photos.length ? `${photos.length} Selected` : 'Photos'}<input type="file" accept="image/*" multiple onChange={handlePhotoSelection} required disabled={isCompressing} /></label></div>
            </div>
          )}
        </div>

        {/* 🗺️ VERTICAL FLOW SPLITTER LINE B: SECONDARY TRACKS ROW */}
        {!isTagless && (
          <div className="form-layout-row-strip" style={{ marginTop: '4px' }}>
            {rowTwoFields.map(f => <input key={f} className="mini-input" placeholder={f.replace(/_/g, ' ').toUpperCase()} value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })} />)}
            <select className="mini-input mini-select" value={form.bag_color || ''} onChange={e => setForm({ ...form, bag_color: e.target.value })}><option value="">Select Color...</option><option value="Black">Black (BK)</option><option value="Red">Red (RD)</option><option value="Blue">Blue (BL)</option><option value="Brown">Brown (BR)</option><option value="Grey">Grey (GY)</option><option value="Green">Green (GR)</option><option value="Other">Other Color</option></select>
            <input type="number" className="mini-input mini-weight" placeholder="KG" min="1" max="100" value={form.bag_kilos || ''} onChange={e => setForm({ ...form, bag_kilos: e.target.value })} />
            <button type="submit" disabled={uploading} className="mini-submit-btn">{uploading ? '...' : 'Register'}</button>
          </div>
        )}

        {/* Fallback button layout alignment when Tagless mode closes row two inputs */}
        {isTagless && (
          <button type="submit" disabled={uploading} className="mini-submit-btn" style={{ width: '100%', marginTop: '4px' }}>{uploading ? '...' : 'Register'}</button>
        )}

      </form>
    </div>
  );
}
