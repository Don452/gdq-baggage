import logo from '../assets/logo.webp';
import printStyles from '../styles/printReceipt.css?inline';
import { sb } from '../utils/supabaseClient'; // 🎯 INJECTED SAFELY: Direct backend query connection hook

export const hPrnt = async (b, u, stations = []) => { // 🎯 CONVERTED TO ASYNC ROUTINE
  // 📡 ROUTING PARAMETER MATRIX: Clean target strings up completely
  const recordStationCode = String(b?.station_code || u?.station_code || 'GDQ').trim().toUpperCase();
  
  let dbStation = null;

  // ⚡ LIVE DIRECT RETRIEVAL TRIGGER: If client state is blank or missing columns, fetch straight from DB instantly
  try {
    const { data: directFetchedStation, error } = await sb
      .from('stations')
      .select('station_phone, station_email')
      .eq('station_code', recordStationCode)
      .maybeSingle();

    if (!error && directFetchedStation) {
      dbStation = directFetchedStation;
    }
  } catch (err) {
    console.error("Database pre-fetch bypass failed, falling back to local array match:", err);
  }

  // Secondary local array search fallback layer if direct DB lookup is blocked
  if (!dbStation && Array.isArray(stations)) {
    dbStation = stations.find(st => String(st?.station_code || '').trim().toUpperCase() === recordStationCode);
  }

  const localizedStationCode = recordStationCode;
  
  // 🎯 VERIFIED CORRECTION: Pulls live column configurations with safe fallback generation variables
  const localizedStationPhone = String(dbStation?.station_phone || u?.station_phone || '+251991343796').trim();
  const localizedStationEmail = String(dbStation?.station_email || u?.station_email || `${localizedStationCode}APT@ethiopianairlines.com`).trim().toLowerCase();

  const w = window.open('', '_blank');
  if (!w) return alert("🚫 Pop-up blocked! Please enable pop-ups for this station dashboard.");

  const resolvedLogoUrl = logo ? `${window.location.origin}${logo.startsWith('/') ? '' : '/'}${logo}` : '';
  const isTagless = String(b.irregularity_type || '').toLowerCase() === 'tagless';

  // 🎯 FIXED: Map image loops directly from your new native text array column
  const imagesHtml = isTagless && Array.isArray(b.tagless_photos) && b.tagless_photos.length > 0
    ? b.tagless_photos.map(url => `
        <div style="border: 1px solid #cbd5e1; padding: 4px; background: #ffffff; border-radius: 6px; display: flex; align-items: center; justify-content: center; page-break-inside: avoid;">
          <img src="${url}" style="max-width: 100%; max-height: 250px; object-fit: contain; border-radius: 4px;" alt="Baggage Evidence" />
        </div>
      `).join('')
    : '<div style="font-size: 11px; color: #94a3b8; font-style: italic; grid-column: span 2; text-align: center; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 6px;">የተያያዘ ምስል የለም / No photo assets attached.</div>';

  w.document.write(`
    <html>
    <head>
      <title>Baggage Claim Receipt - ${b.bag_tag_number || 'Receipt'}</title>
      <style>${printStyles}</style>
    </head>
    <body>
      <div class="header-wrapper">
        <div class="hd-text">
          <p style="font-size: 18px; font-weight: 800; color: #5E8F4D; letter-spacing: 0.2px;">የኢትዮጵያ አየር መንገድ &bull; Ethiopian Airlines</p>
          <p style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px;">ጊዜያዊ የሻንጣ መጠየቂያ ሠነድ &bull; Temporary Property Irregularity Report</p>
          
          <!-- 🎯 TARGET MATCHED: Station header parameters are now dynamically synchronized right from the live database -->
          <p style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 5px; letter-spacing: 0.2px;">
            ${localizedStationCode} BAGGAGE SERVICE &bull; TEL: ${localizedStationPhone} &bull; EMAIL: ${localizedStationEmail}
          </p>
        </div>
        ${resolvedLogoUrl ? `
          <img src="${resolvedLogoUrl}" alt="Ethiopian Airlines" class="corner-logo" onload="window.logoLoaded=true;" onerror="window.logoLoaded=true;" />
        ` : `
          <script>window.logoLoaded=true;</script>
        `}
      </div>

      <div style="text-align: right; font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.2px;">
        የተሰጠበት ቀን / Issued Date: <span style="color: #0f172a; font-family: 'Inter', sans-serif;">${new Date(b.created_at || Date.now()).toLocaleString()}</span>
      </div>
      
      ${isTagless ? `
        <div class="section-title">የን|ብረት ዝርዝር መግለጫ እና ምስሎች / Property Description & Photo Manifest</div>
        
        <div style="margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;">
          <span style="font-size: 12px; font-weight: bold; color: #334155; font-family: monospace;">TAG REFERENCE: ${b.bag_tag_number || 'TL-' + localizedStationCode}</span>
          <span style="float: right; font-size: 11px; font-weight: bold; color: #b45309; background: #fef3c7; padding: 1px 6px; border-radius: 4px; text-transform: uppercase;">${b.bag_color || 'UNKNOWN'}</span>
        </div>

        <div style="border: 1px dashed #cbd5e1; background: #ffffff; padding: 14px; border-radius: 6px; margin-bottom: 20px;">
          <span style="display: block; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.3px;">የሻንጣው ልዩ መግለጫ / Visual Characteristic Description:</span>
          <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.5; font-family: sans-serif; font-style: italic; font-weight: 500;">"${b.tagless_description || 'No specifications found on file.'}"</p>
        </div>
        
        <div style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.3px;">የሻንጣው ምስሎች / Attached Photo Manifest:</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; margin-bottom: 20px;">
          ${imagesHtml}
        </div>
      ` : `
        <div class="section-title">የፋይል ምዝግባ ዝርዝር / File Record Details</div>
        <table>
          <tbody>
            <tr>
              <th>የሻንጣ መለያ ቁጥር <span>&bull; Tag Number</span></th>
              <td><b style="font-size: 16px; color: #0f172a; font-family: 'SF Mono', Monaco, Consolas, monospace; letter-spacing: 0.5px;">${b.bag_tag_number || '—'}</b></td>
              <th>የፋይል ቁጥር<span>&bull; File Reference</span></th>
              <td><span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 14px; font-weight: 700; color: #0f172a;">${b.file_number || '—'}</span></td>
            </tr>
            <tr>
              <th>የአያት ስም <span>&bull; Last Name</span></th>
              <td style="font-weight: 600; color: #0f172a;">${b.passenger_last_name || '—'}</td>
              <th>ስም <span>&bull; First Name</span></th>
              <td style="font-weight: 600; color: #0f172a;">${b.passenger_first_name || '—'}</td>
            </tr>
            <tr>
              <th>የቲኬት ቁጥር<span>&bull; Ticket Number</span></th>
              <td><span style="font-family: 'SF Mono', Consolas, monospace; font-size: 12px; color: #334155;">${b.ticket_number || '—'}</span></td>
              <th>የስልክ ቁጥር <span>&bull; Contact Phone</span></th>
              <td style="color: #334155;">${b.phone_number || '—'}</td>
            </tr>
            <tr>
              <th>የሻንጣው ቀለም <span>&bull; Bag Color</span></th>
              <td style="color: #334155;">${b.bag_color || '—'}</td>
              <th>የሻንጣው ክብደት <span>&bull; Bag Weight</span></th>
              <td>${b.bag_kilos ? `<b style="font-size: 13px; color: #0f172a; font-family: 'Inter', sans-serif;">${b.bag_kilos} KG</b>` : '—'}</td>
            </tr>
            <tr>
              <th>የተመዘገበበት ምክኒያት <span>&bull; Incident Type</span></th>
              <td><span class="badge">${b.irregularity_type || '—'}</span></td>
              <th>ያለበት ሁኔታ <span>&bull; Current Status</span></th>
              <td><span class="status-badge">${b.bag_status || 'Open'}</span></td>
            </tr>
            <tr>
              <th>የመዘገበው ሰራተኛ <span>&bull; Logged By Agent</span></th>
              <td colspan="3">
                <div class="agent-info">
                  👤 <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600;">የጣቢያው ተረኛ ሰራተኛ / Station Handler:</span> <strong style="color: #0f172a; font-weight: 700;">${b.agent_name || 'System Authorized'}</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      `}
      
     
      <div class="footer-banner">
        <p class="footer-amharic">
          ይህ ሰነድ ስላስመዘገቡት የሻንጣ መጥፋት/መዘግየት ጥያቄ ይፋዊ ማረጋገጫ ሆኖ የሚያገለግል ነው።<br/>
          የአየር መንገዳችን የስራ ቡድን ሂደቱን እስኪያጠናቅቅ ድረስ ስለሚያደርጉልን ትብብር እናመሰግናለን። ለተፈጠረው መስተጓጎል ይቅርታ እንጠይቃለን።
        </p>
        <p class="footer-english">
          This serves as an official confirmation of your registered baggage irregularity claim file.<br/>
          Thank you for your cooperation while our station team processes your records. We apologize for the inconvenience.
        </p>
      </div>

      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 1500); 
        });
      </script>
    </body>
    </html>
  `);
  w.document.close();
};
