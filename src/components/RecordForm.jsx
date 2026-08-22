import React, { useState } from 'react';
import { sb } from '../utils/supabaseClient';
import '../styles/RecordForm.css';

export default function RecordForm({ u, form, setForm, fetchRecords }) {
  const [photos, setPhotos] = useState([]), [uploading, setUploading] = useState(false);
  const curSt = String(u?.station_code || 'GDQ').trim().toUpperCase(), isTagless = form.irregularity_type === 'Tagless';
  const flds = ['bag_tag_number', 'passenger_last_name', 'passenger_first_name', 'file_number', 'ticket_number', 'phone_number'];

  // Helper utility to read raw photo binaries as embedded base64 data strings
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const hRec = async (e) => {
    e.preventDefault();
    const t = form.irregularity_type || 'Delayed';
    if (isTagless && !form.item_description?.trim()) return alert('⚠️ Missing description.');
    if (isTagless && photos.length === 0) return alert('⚠️ Please select at least one baggage proof photo.');
    if (!isTagless && (!form.bag_tag_number || !form.passenger_last_name)) return alert('⚠️ Missing fields.');

    setUploading(true); 
    let actualBase64Photos = [];
    let finalizedTagNumber = '';

    try {
      if (isTagless) {
        // 1️⃣ Uniform Counter Engine: Fetch existing ET-Station entries to determine the next exact counter
        const { count, error: countErr } = await sb
          .from('baggage_records')
          .select('bag_tag_number', { count: 'exact', head: true })
          .ilike('bag_tag_number', `ET-${curSt}-%`);

        if (countErr) throw countErr;

        const nextSequence = (count || 0) + 1;
        finalizedTagNumber = `ET-${curSt}-${nextSequence}`;

        // 2️⃣ Base64 physical image processor file stream loop
        for (const file of photos) {
          const base64String = await convertFileToBase64(file);
          actualBase64Photos.push(base64String);
        }
      } else {
        finalizedTagNumber = String(form.bag_tag_number).toUpperCase().trim();
      }
    } catch (err) {
      setUploading(false);
      return alert(`🚫 System Initializer Fault: ${err.message}`);
    }

    const payload = {
      bag_tag_number: finalizedTagNumber,
      passenger_last_name: isTagless ? 'UNKNOWN' : String(form.passenger_last_name).trim(),
      passenger_first_name: isTagless ? 'UNKNOWN' : String(form.passenger_first_name).trim(),
      irregularity_type: t, 
      bag_color: form.bag_color || (isTagless ? 'UNKNOWN' : 'Unspecified'),
      file_number: isTagless ? 'UNKNOWN' : form.file_number || null, 
      ticket_number: isTagless ? 'UNKNOWN' : form.ticket_number || null,
      phone_number: isTagless ? 'UNKNOWN' : form.phone_number || null, 
      bag_kilos: isTagless ? 0 : parseFloat(form.bag_kilos) || 0,
      station_code: curSt, origin_station: curSt, current_station: curSt, destination_station: curSt,
      agent_name: String(u?.first_name || 'Agent').trim(), custom_agent_id: String(u?.agent_code || 'AG-UNKNOWN').toUpperCase(), bag_status: 'Open',
      metadata_matrix: {}, 
      tagless_description: isTagless ? form.item_description?.trim() : null,
      tagless_photos: isTagless ? actualBase64Photos : []
    };

    const { error: dbError } = await sb.from('baggage_records').insert([payload]);
    setUploading(false);
    
    if (dbError) {
      alert(`🚫 Database Error: ${dbError.message}`);
    } else { 
      setForm({ irregularity_type: t, bag_color: '', bag_kilos: '', item_description: '' }); 
      setPhotos([]); 
      if (typeof fetchRecords === 'function') fetchRecords(); 
      alert(`✅ Registered under dynamic tracking label: ${finalizedTagNumber}`);
    }
  };

  return (
    <div className="compact-form-card">
      <form onSubmit={hRec} className="compact-inline-form">
        <select className="mini-input mini-select font-bold" value={form.irregularity_type || 'Delayed'} onChange={e => setForm({ ...form, irregularity_type: e.target.value })}>
          <option value="Delayed">Delayed</option>
          <option value="Damaged">Damaged</option>
          <option value="Onhand">Onhand</option>
          <option value="Tagless">🏷️ Tagless</option>
        </select>
        
        {!isTagless ? (
          <>
            {flds.map(f => <input key={f} className="mini-input" placeholder={f.replace(/_/g, ' ').toUpperCase()} required={['bag_tag_number', 'passenger_last_name'].includes(f)} value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })} />)}
            <select className="mini-input mini-select" value={form.bag_color || ''} onChange={e => setForm({ ...form, bag_color: e.target.value })}>
               <option value="">Select Color...</option>
            <option value="Black">Black (BK)</option>
            <option value="Red">Red (RD)</option>
            <option value="Blue">Blue (BL)</option>
            <option value="Brown">Brown (BR)</option>
            <option value="Grey">Grey (GY)</option>
            <option value="Green">Green (GR)</option>
            <option value="Other">Other Color</option>
            </select>
            <input type="number" className="mini-input mini-weight" placeholder="KG" min="1" max="100" value={form.bag_kilos || ''} onChange={e => setForm({ ...form, bag_kilos: e.target.value })} />
          </>
        ) : (
          <div className="tagless-horizontal-block">
            <input type="text" className="mini-input flex-grow-desc" placeholder="DETAILED DESCRIPTION / CONTENTS / VISUAL TRAITS..." value={form.item_description || ''} onChange={e => setForm({ ...form, item_description: e.target.value })} required />
            
            <select className="mini-input mini-select mini-tagless-color" value={form.bag_color || ''} onChange={e => setForm({ ...form, bag_color: e.target.value })}>
            <option value="">Select Color...</option>
            <option value="Black">Black (BK)</option>
            <option value="Red">Red (RD)</option>
            <option value="Blue">Blue (BL)</option>
            <option value="Brown">Brown (BR)</option>
            <option value="Grey">Grey (GY)</option>
            <option value="Green">Green (GR)</option>
            <option value="Other">Other Color</option>
            </select>

            <div className="mini-upload-zone">
              <label className="mini-file-label">
                📸 {photos.length ? `${photos.length} Selected` : 'Attach Photos'}
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={e => e.target.files && setPhotos(Array.from(e.target.files))} 
                  required 
                />
              </label>
            </div>
          </div>
        )}
        <button type="submit" disabled={uploading} className="mini-submit-btn">{uploading ? '...' : 'Register'}</button>
      </form>
    </div>
  );
}
