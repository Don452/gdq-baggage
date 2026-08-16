import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import BaggageCharts from './BaggageCharts';
import './App.css';
import logo from './assets/logo.webp';

const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY), flds = ['bag_tag_number', 'passenger_last_name', 'passenger_first_name', 'file_number', 'ticket_number', 'phone_number'];
export default function App() {
  const [u, setU] = useState(() => JSON.parse(localStorage.getItem('bagtrack_user'))), 
  [tab, setTab] = useState('All'), 
  [recs, setRecs] = useState([]), 
  [srch, setSrch] = useState(''), 
  [isS, setIsS] = useState(false),
  [auth, setAuth] = useState({}),
  [form, setForm] = useState({ irregularity_type: 'Delayed' }),
  [edId, setEdId] = useState(null), [edF, setEdF] = useState({}),
  [dash, setDash] = useState(false),
  [sd, setSd] = useState(''), 
  [ed, setEd] = useState('');
  // ⏱️ 5-MINUTE AUTOMATIC INACTIVITY LOGOUT ENGINE (PRODUCTION BASELINE)
  useEffect(() => {
    if (!u) return; // Only track activity if an agent is securely signed in

    let timeoutId;
    const INACTIVITY_TIME = 5 * 60 * 1000; // ⚡ SAFELY RESTORED TO EXACTLY 5 MINUTES

    const handleLogout = () => {
      localStorage.removeItem('bagtrack_user');
      setU(null);
      alert('🔒 Session Expired: You have been logged out automatically due to 5 minutes of inactivity.');
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIME);
    };

    // Global interaction listeners
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start countdown immediately
    resetTimer();

    // Cleanup listeners on unmount
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [u]);


  useEffect(() => { if (!u) return; const f = async () => { let q = sb.from('baggage_records').select('*').order('created_at', { ascending: true }); const { data } = await (tab !== 'All' ? q.eq('irregularity_type', tab) : q); if (data) setRecs(data); }; f(); const ch = sb.channel('db').on('postgres_changes', { event: '*', schema: 'public', table: 'baggage_records' }, f).subscribe(); return () => sb.removeChannel(ch); }, [u, tab]);
    // 🔐 HARDENED CLOUD AUTHENTICATION ENGINE: Requires master passcode for both Login and Registration
  const hAuth = async (e) => {
    e.preventDefault();
    
    const currentUsername = auth.username?.toLowerCase().trim();
    const currentFirst = auth.first_name?.trim() || '';
    const currentMiddle = auth.middle_name?.trim() || '';
    const currentPassword = auth.password;
    const currentStationKey = auth.station_key;

    if (!currentUsername || !currentPassword || !currentStationKey) {
      return alert('⚠️ Please fill out all required security fields, including the Station Passcode.');
    }

    // 🕵️‍♂️ GLOBAL SECURITY GATEWAY: Matches against your master corporate passcode first
    const MASTER_STATION_KEY = "ETGDQ"; 
    if (currentStationKey !== MASTER_STATION_KEY) {
      return alert("🚫 Access Denied: Invalid Station Administration Passcode. Operations unauthorized.");
    }

    if (isS) {
      // Query Supabase to see if this agent ID is already claimed
      const { data: userCheck } = await sb
        .from('agents')
        .select('username')
        .eq('username', currentUsername)
        .maybeSingle();

      if (userCheck) {
        return alert(`🚫 Registration Failed: The username "${auth.username}" is already claimed by another station agent.`);
      }

      // Query Supabase to stop duplicate real names from creating extra accounts
      const { data: nameCheck } = await sb
        .from('agents')
        .select('first_name, middle_name')
        .eq('first_name', currentFirst)
        .eq('middle_name', currentMiddle);

      if (nameCheck && nameCheck.length > 0) {
        return alert(`🚫 Registration Failed: An agent profile named "${auth.first_name} ${auth.middle_name || ''}" is already registered on the central network.`);
      }

      // Push safe identity profile data straight to your global cloud database table
      const { error: regError } = await sb
        .from('agents')
        .insert([{ 
          username: currentUsername, 
          password: currentPassword, 
          first_name: currentFirst, 
          middle_name: currentMiddle 
        }]);

      if (regError) {
        return alert('❌ Cloud Sync Failure: Unable to save station account to network servers.');
      }

      alert('✅ Station account created successfully on the cloud registry! Proceeding to portal login.');
      setIsS(false);
    } else {
      // Secure Cloud Portal Cross-Device Login Verification Sequence
      const { data: matchingAgent, error: loginError } = await sb
        .from('agents')
        .select('*')
        .eq('username', currentUsername)
        .eq('password', currentPassword)
        .maybeSingle();

      if (loginError || !matchingAgent) {
        return alert('❌ Portal Access Denied: Invalid agent credentials or incorrect password.');
      }

      localStorage.setItem('bagtrack_user', JSON.stringify(matchingAgent));
      setU(matchingAgent);
    }
  };




  const hRec = async (e) => { e.preventDefault(); const t = form.irregularity_type || 'Delayed', req = t !== 'Delayed'; if (!form.bag_tag_number || !form.passenger_last_name || !form.passenger_first_name || (req && !form.file_number?.trim())) return alert('Missing fields.'); const { error } = await sb.from('baggage_records').insert([{ ...form, agent_name: `${u.first_name} ${u.middle_name || ''}`.trim(), bag_tag_number: form.bag_tag_number.toUpperCase().trim(), file_number: form.file_number?.trim() ? form.file_number.toUpperCase().trim() : null, bag_status: 'Open' }]); if (error) alert('Error'); else setForm({ irregularity_type: t }); };
    // INSERT THIS PRINT ENGINE BLOCK DIRECTLY BELOW YOUR hRec FUNCTION
      // --- FIND THIS ROW IN YOUR FILE ---
  const cellStyle = { padding:'12px 8px', textAlign:'center', verticalAlign:'middle', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' };

  // ⚡ INSERT THIS TYPING PALETTE MAPPER DIRECTLY BELOW IT
  const getTypeBadgeStyle = (type) => {
    if (type === 'Onhand') return { background: '#0c6a23', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' };   // Blue
    if (type === 'Delayed') return { background: '#FFC92D', color: '#1e293b', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' };  // Yellow
    if (type === 'Damaged') return { background: '#d21215', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' };  // Gray
    return { background: '#ffffff', color: '#1e293b' };
  };

  const hPrnt = (b) => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
      <head>
        <title>Baggage Claim Receipt - ${b.bag_tag_number}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 30px;
            color: #1e293b;
            background: #ffffff;
            position: relative;
          } 
          /* ⚡ DECREASED RIGHT MARGIN AND HEIGHT TO GIVE HEADERS FLUID HORIZONTAL BREATHING ROOM */
          .hd {
            border-bottom: 2px solid #5E8F4D;
            padding-bottom: 12px;
            margin-bottom: 20px;
            margin-right: 210px;
          }
          /* ⚡ FORCE HEADER LINES TO PREVENT WRAPPING AND FIT ON A SINGLE LINE */
          .hd p {
            margin: 0;
            color: #5E8F4D;
            font-weight: 800;
            letter-spacing: 0.3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 15px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          } 
          th, td {
            padding: 12px 14px;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
          }
          th:last-child, td:last-child {
            border-right: none;
          }
          tr:last-child td {
            border-bottom: none;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            width: 18%;
          }
          td {
            color: #334155;
            background: #ffffff;
          }
          .corner-logo {
            position: absolute;
            top: 25px;
            right: 30px;
            width: 190px;
            height: 65px;
            object-fit: contain;
          }
          .badge {
            background: #FFC92D;
            color: #1e293b;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
            display: inline-block;
          }
          .status-badge {
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <img src="${logo}" alt="Ethiopian" class="corner-logo" onload="setTimeout(function(){ window.print(); window.close(); }, 200);" onerror="window.print(); window.close();" />

        <div class="hd">
          <p style="font-size: 15px;">የኢትዮጵያ አየር መንገድ Ethiopian Airlines</p>
          <p style="font-size: 13px;">ጊዜያዊ የሻንጣ መጠየቂያ ሠነድ Temporary Property Irregularity Report</p>
          <p style="font-size: 12px;">GDQ BAGGAGE SERVICE TEL: +251991343796</p>
          <p style="font-size: 12px;">EMAIL: GDQAPT@ethiopianairlines.com</p>
          <p style="margin-top: 6px; font-size: 11px; color: #64748b; font-weight: 500; white-space: nowrap;">Issued Date: ${new Date(b.created_at || Date.now()).toLocaleString()}</p>
        </div>
        
        <h3 style="color:#0f172a;margin-top:25px;font-size:15px;font-weight:700;">Passenger & Bag Claim Details</h3>
        <table>
          <tr>
            <th>Tag Number</th><td><b style="font-size:14px;color:#0f172a;letter-spacing:0.5px;">${b.bag_tag_number}</b></td>
            <th>File Reference</th><td><span style="font-family:monospace;font-size:13px;font-weight:700;color:#0f172a;">${b.file_number || '—'}</span></td>
          </tr>
          <tr>
            <th>Last Name</th><td>${b.passenger_last_name}</td>
            <th>First Name</th><td>${b.passenger_first_name}</td>
          </tr>
          <tr>
            <th>Ticket Code</th><td><span style="font-family:monospace;">${b.ticket_number || '—'}</span></td>
            <th>Contact Phone</th><td>${b.phone_number || '—'}</td>
          </tr>
          <tr>
            <th>Incident Type</th><td><span class="badge">${b.irregularity_type}</span></td>
            <th>Current Status</th><td><span class="status-badge">${b.bag_status || 'Open'}</span></td>
          </tr>
          <tr>
            <th>Logged By Agent</th>
            <td colspan="3" style="background:#f8fafc;color:#64748b;font-weight:500;">
              👤 Station Handler Reference: <span style="color:#334155;font-weight:600;">${b.agent_name || 'System Authorized'}</span>
            </td>
          </tr>
        </table>
        
        <br/>
        <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:15px;text-align:center;">
          <p style="font-size:12px;color:#1e293b;line-height:1.6;margin:0;font-weight:600;">
            ይህ ሰነድ ስላስመዘገቡት የሻንጣ መጥፋት/መዘግየት ጥያቄ ይፋዊ ማረጋገጫ ሆኖ የሚያገለግል ነው።<br/>
            የአየር መንገዳችን የስራ ቡድን ሂደቱን እስኪያጠናቅቅ ድረስ ስለሚያደርጉልን ትብብር እናመሰግናለን። ለተፈጠረው መስተጓጎል ይቅርታ እንጠይቃለን።
          </p>
          <p style="font-size:11px;color:#94a3b8;line-height:1.6;margin:0;white-space:normal;">
            This serves as an official confirmation of your registered baggage irregularity claim file.<br/>
            Thank you for your cooperation while our station team processes your records.
          </p>
        </div>
      </body>
      </html>
    `);
    w.document.close();
  };

  


    // ⚡ FIND AND REPLACE YOUR OLD AUTH RETURNING BLOCK WITH This:
  if (!u) return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Floating Top Brand Image Header */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Ethiopian Airlines" style={{ width: '180px', height: '60px', objectFit: 'contain' }} />
        </div>

        <div className="auth-header">
          <h2>{isS ? 'Agent Registration' : 'GDQ Baggage Service Login'}</h2>
          <p>{isS ? 'Create an authorized account' : 'Enter security credentials to open dashboard'}</p>
        </div>

                  <form onSubmit={hAuth}>
          {isS && (
            <>
              <div className="auth-form-group">
                <label>First Name</label>
                <input required className="auth-input" placeholder="First Name" onChange={e => setAuth({...auth, first_name: e.target.value})}/>
              </div>
              <div className="auth-form-group">
                <label>Middle Name</label>
                <input className="auth-input" placeholder="Middle Name" onChange={e => setAuth({...auth, middle_name: e.target.value})}/>
              </div>
            </>
          )}
          
          {/* ⚡ PERMANENT PASSCODE GATEWAY FIELD FOR BOTH LOGIN & REGISTRATION */}
          <div className="auth-form-group">
            <label style={{ color: '#C52528' }}>Station Administration Passcode</label>
            <input required className="auth-input" type="password" placeholder="Enter corporate security key" onChange={e => setAuth({...auth, station_key: e.target.value})}/>
          </div>

          <div className="auth-form-group">
            <label>Username</label>
            <input required className="auth-input" type="text" placeholder="Enter username" onChange={e => setAuth({...auth, username: e.target.value})}/>
          </div>
          
          <div className="auth-form-group">
            <label>Security Password</label>
            <input required className="auth-input" type="password" placeholder="••••••••" onChange={e => setAuth({...auth, password: e.target.value})}/>
          </div>
          
          <button type="submit" className="auth-submit-btn">
            {isS ? 'Register Account' : 'Sign In'}
          </button>
        </form>



        <button className="auth-toggle-link" style={{ color: '#C52528' }} onClick={() => setIsS(!isS)}>
          {isS ? 'Already registered? Sign In Instead' : 'New station agent? Create account here'}
        </button>
      </div>
    </div>
  );

  const getI = (n) => n ? n.split(' ').map(x => x.charAt(0)).join('').toUpperCase().substring(0, 2) : 'AG', fil = recs.filter(r => { const dt = r.created_at?.split('T')[0]; return !(sd && dt < sd) && !(ed && dt > ed) && (!srch || [r.bag_tag_number, r.passenger_last_name, r.passenger_first_name, r.file_number, r.ticket_number].some(v => v?.toLowerCase().includes(srch.toLowerCase().trim()))); }), reqFn = (form.irregularity_type || 'Delayed') !== 'Delayed';
  return (
    <div>
      <nav className="navbar">
        <h2><img src={logo} alt="Ethiopian" style={{ width: '200px', height: '70px' }}/></h2>
        <div className="nav-links">{['All', 'Delayed', 'Damaged', 'Onhand'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t} ({recs.filter(r => t === 'All' || r.irregularity_type === t).length})</button>)}
        <div className="avatar-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', fontWeight: 'bold', marginLeft: '10px' }}>{getI(`${u.first_name} ${u.middle_name||''}`)}</div>
        <button onClick={() => { localStorage.removeItem('bagtrack_user'); setU(null); }} className="link-btn">Sign Out</button>
        </div>
     </nav>
            <div className="utility-bar" style={{ display: 'flex', gap: '10px', margin: '10px 0', flexWrap: 'wrap' }}>
          {/* 📅 COLOR-MATCHED DATE RANGE PANEL */}
          <div className="date-filter-panel">
            <span>From:</span>
            <input 
              type="date" 
              className="date-filter-input" 
              value={sd} 
              onChange={e => setSd(e.target.value)} 
            />
            
            <span>To:</span>
            <input 
              type="date" 
              className="date-filter-input" 
              value={ed} 
              onChange={e => setEd(e.target.value)} 
            />
            
            {(sd || ed) && (
              <button 
                className="date-clear-btn" 
                onClick={() => { setSd(''); setEd(''); }}
              >
                ✕
              </button>
            )}
          </div>

          <button className="btn" onClick={() => setDash(!dash)} >{dash ? '📋 Display Records' : '📊 Analytics'}</button>
        </div>
        {dash ? <BaggageCharts recs={fil} getI={getI} /> : <>
          <div className="card" style={{ margin: '15px 0' }}><form onSubmit={hRec} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' }}>
            <select value={form.irregularity_type || 'Delayed'} onChange={e => setForm({...form, irregularity_type: e.target.value})} style={{ height: '38px' }}><option value="Delayed">Delayed</option><option value="Damaged">Damaged</option><option value="Onhand">Onhand</option></select>
            {flds.map(f => <input key={f} placeholder={f === 'file_number' ? `File Num ${reqFn ? '' : '(Opt)'}` : f.replace(/_/g, ' ')} required={f === 'file_number' ? reqFn : ['bag_tag_number', 'passenger_last_name', 'passenger_first_name'].includes(f)} maxLength={f==='ticket_number'||f==='phone_number'?13:undefined} minLength={f==='ticket_number'?13:undefined} pattern={f==='phone_number'?"[0-9]*":undefined} value={form[f] || ''} onChange={e => setForm({...form, [f]: e.target.value})} style={{ flex: '1', minWidth: '120px', height: '38px' }}/>)}
            <button className="btn" style={{ width: 'auto', height: '38px' }}>Register</button>
          </form></div>
          <div className="card table-wrapper"><table>
            <thead><tr>{['Tag','Last Name','First Name','File Num','Ticket Num','Phone','Type','Agent','Status','Tracer','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{fil.map(b => { const isEd = edId === b.id, it = isEd ? edF : b; return (
              <tr key={b.id}>
                <td>{isEd ? <input value={it.bag_tag_number || ''} onChange={e => setEdF({...edF, bag_tag_number: e.target.value})}/> : <span className="tag-badge" title={b.bag_tag_number}>{b.bag_tag_number}</span>}</td>
                <td>{isEd ? <input value={it.passenger_last_name || ''} onChange={e => setEdF({...edF, passenger_last_name: e.target.value})}/> : b.passenger_last_name}</td>
                <td>{isEd ? <input value={it.passenger_first_name || ''} onChange={e => setEdF({...edF, passenger_first_name: e.target.value})}/> : b.passenger_first_name}</td>
                <td>{isEd ? <input value={it.file_number || ''} onChange={e => setEdF({...edF, file_number: e.target.value})}/> : b.file_number || '—'}</td>
                <td>{isEd ? <input maxLength={13} minLength={13} value={it.ticket_number || ''} onChange={e => setEdF({...edF, ticket_number: e.target.value})}/> : b.ticket_number || '—'}</td>
                <td>{isEd ? <input maxLength={13} pattern="[0-9]*" value={it.phone_number || ''} onChange={e => setEdF({...edF, phone_number: e.target.value})}/> : b.phone_number || '—'}</td>
                 {/* ⚡ REPLACE YOUR OLD 7th CELL WITH THIS DYNAMIC VERSION */}
  <td style={cellStyle}>
    {isEd ? (
      <select style={{ width: '100%', padding: '4px' }} value={it.irregularity_type || ''} onChange={e => setEdF({ ...edF, irregularity_type: e.target.value })}>
        <option value="Delayed">Delayed</option>
        <option value="Damaged">Damaged</option>
        <option value="Onhand">Onhand</option>
      </select>
    ) : (
      <span style={getTypeBadgeStyle(b.irregularity_type)}>{b.irregularity_type}</span>
    )}
  </td>

                <td>👤 {getI(b.agent_name)}</td>
                <td><select value={it.bag_status || 'Open'} onChange={e => isEd ? setEdF({...edF, bag_status: e.target.value}) : sb.from('baggage_records').update({ bag_status: e.target.value }).eq('id', b.id)}>{['Open', 'Arrived', 'Delivered', 'Suspended', 'File Closed'].map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                <td><a href="https://desktop.worldtracer.aero/desktop/index.html#!/index/login" target="_blank" rel="noreferrer"><button className="btn btn-sm" style={{ background: '#0284c7', color: '#fff' }}>Trace</button></a></td>
                
                <td>{isEd ? <><button className="btn btn-sm" onClick={async () => { await sb.from('baggage_records').update({ ...edF, bag_tag_number: edF.bag_tag_number.toUpperCase().trim(), file_number: edF.file_number ? edF.file_number.toUpperCase().trim() : null }).eq('id', b.id); setEdId(null); }}>✓</button><button className="btn btn-sm" onClick={() => setEdId(null)}>X</button></> : 
                             <>{/* ⚡ REPLACE YOUR EXISTING "DEL" BUTTON ROW WITH THIS SECURE VERSION */}
                             <button 
                                className="btn btn-sm" 
                                style={{ background: '#C52528', color: '#fff', flex: 1 }} 
                                onClick={async () => {
                                  // 🕵️‍♂️ SECURITY AUTONOMY CHECK: Trims and compares full names to block unauthorized deletions
                                  const currentAgentName = `${u.first_name} ${u.middle_name || ''}`.trim().toLowerCase();
                                  const recordCreatorName = (b.agent_name || '').trim().toLowerCase();

                                  if (currentAgentName !== recordCreatorName) {
                                    return alert(`🚫 Action Blocked: You can only delete baggage records that you personally registered. This file belongs to Agent: ${b.agent_name || 'System Master'}.`);
                                  }

                                  // If the identity matches, prompt for final physical confirmation
                                  if (window.confirm(`⚠️ Are you sure you want to permanently delete Tag File ${b.bag_tag_number}?`)) {
                                    const { error } = await sb.from('baggage_records').delete().eq('id', b.id);
                                    if (error) {
                                      alert('❌ Database Error: Unable to remove record from cloud registry.');
                                    } else {
                                      alert('✅ Record deleted successfully!');
                                    }
                                  }
                                }}
                              >
                                Del
                              </button> </>}
                  </td>

                  <td>{isEd ? <><button className="btn btn-sm" onClick={async () => { await sb.from('baggage_records').update({ ...edF, bag_tag_number: edF.bag_tag_number.toUpperCase().trim(), file_number: edF.file_number ? edF.file_number.toUpperCase().trim() : null }).eq('id', b.id); setEdId(null); }}>✓</button><button className="btn btn-sm" onClick={() => setEdId(null)}>X</button></> : 
                <><button className="btn btn-sm" onClick={() => hPrnt(b)}>Print</button></>}</td>
           
              </tr>); })}
            </tbody>
          </table></div>
        </>}
      </div>
   
  );
}
