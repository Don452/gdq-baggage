import React, { useState, useEffect, useRef } from 'react';
import { sb } from '../utils/supabaseClient';
import '../styles/authPortal.css';
import logo from '../assets/logo.webp';
import { initializeUserSession } from '../utils/sessionManager';

export default function AuthPortal({ setU, auth = {}, setAuth }) {
  const [stList, setStList] = useState([]);
  const [isUp, setIsUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clicks, setClicks] = useState(0);
  const tRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from('stations').select('station_code, station_name').order('station_code');
      if (data) setStList(data);
    })();
  }, []);

  const handleLogoTap = () => {
    clearTimeout(tRef.current);
    const n = clicks + 1; setClicks(n);
    if (n >= 5) {
      setIsAdmin(true);
      setClicks(0);
      setAuth({});
      alert("👑 Admin Mode Active");
      return;
    }
    tRef.current = setTimeout(() => setClicks(0), 3000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const pass = auth.password;

    try {
      if (isAdmin) {
        const userKey = auth.username?.trim();
        if (!userKey || !pass) return alert('Fill credentials completely.');

        const { data: adm } = await sb
          .from('agents')
          .select('*')
          .eq('username', userKey)
          .eq('password', pass)
          .eq('is_admin', true)
          .maybeSingle();

        if (!adm) return alert('Invalid Admin HQ credentials.');

        // 🎯 THE INTEGRATION FIX: Initialize 5-minute active timestamp mapping
        initializeUserSession(adm);
        return setU(adm);
      }

      const idKey = auth.agent_code?.toUpperCase().trim();
      const code = auth.station_code?.toUpperCase().trim();
      const key = auth.station_key?.trim();

      if (!idKey || !pass) return alert('Fill credentials completely.');
      if (!code) return alert('Select Airport Node.');
      if (!key) return alert('Enter Station Passcode.');

      const { data: st } = await sb.from('stations').select('admin_passcode').eq('station_code', code).maybeSingle();
      if (!st || key !== st.admin_passcode) return alert('Invalid Station Passcode.');

      if (isUp) {
        if (pass.length < 8) return alert('Password length must be at least 8 characters.');

        const { data: check } = await sb.from('agents').select('agent_code').eq('agent_code', idKey).maybeSingle();
        if (check) return alert('Agent ID already registered.');

        const { error } = await sb.from('agents').insert([{
          agent_code: idKey,
          password: pass,
          first_name: auth.first_name?.trim(),
          middle_name: auth.middle_name?.trim() || null,
          station_code: code,
          is_admin: false
        }]);

        if (error) return alert(error.message);
        alert('Registered successfully!');
        setIsUp(false);
        setAuth({});
      } else {
        const { data: ag } = await sb.from('agents').select('*').eq('agent_code', idKey).eq('password', pass).maybeSingle();
        if (!ag || ag.station_code !== code) return alert('Access Denied: Invalid Agent ID credentials or incorrect station assignment.');

        // 🎯 THE INTEGRATION FIX: Initialize 5-minute active timestamp mapping
        initializeUserSession(ag);
        setU(ag);
      }
    } catch {
      alert("Authentication system error encountered.");
    }
  };

  return (
    <div className="auth-viewport-wrapper">
      <div className="auth-card-panel">

        <div className="auth-card-header">
          <div
            onClick={handleLogoTap}
            className={`auth-logo-badge ${isAdmin ? 'bg-admin' : 'bg-agent'}`}
          >
            <img src={logo} alt="Ethiopian Airlines" className="brand-logo-img" />

          </div>
          {/* 📋 OPERATIONAL GATEWAY METADATA BLOCK LAYER */}
          <div className="auth-subtitle-group">
            {(() => {
              if (isAdmin) {
                return (
                  <h2 className="auth-subtitle txt-admin">
                    ET EXPRESS GATEWAY
                  </h2>
                );
              }
              if (isUp) {
                return (
                  <>
                    <h2 className="auth-form-title">Agent Registration</h2>
                    <p className="auth-subtitle txt-agent">Create an authorized account</p>
                  </>
                );
              }
              return (
                <>
                  <h2 className="auth-form-title">GDQ Baggage Service Login</h2>
                  <p style={{ color: '#C52528' }} className="auth-subtitle txt-agent">Enter security credentials to open dashboard</p>
                </>
              );
            })()}
          </div>

        </div>

        <form onSubmit={handleAuth} className="auth-form-matrix">
          {!isAdmin && isUp && (
            <div className="auth-input-row-split">

              <input required className="auth-input-field" placeholder="First Name" value={auth.first_name || ''} onChange={e => setAuth(prev => ({ ...prev, first_name: e.target.value }))} />
              <input className="auth-input-field" placeholder="Middle Name" value={auth.middle_name || ''} onChange={e => setAuth(prev => ({ ...prev, middle_name: e.target.value }))} />
            </div>
          )}

          {!isAdmin && (
            <select required className="auth-select-dropdown" value={auth.station_code || ''} onChange={e => setAuth(prev => ({ ...prev, station_code: e.target.value }))}>
              <option value="">Select Assigned Node...</option>
              {stList.map(st => <option key={st.station_code} value={st.station_code}>{st.station_code} - {st.station_name}</option>)}
            </select>
          )}

          {!isAdmin && (
            <div className="auth-form-group">
              <input type="password" required className="auth-input-field input-station-pass" placeholder="Station Passcode" value={auth.station_key || ''} onChange={e => setAuth(prev => ({ ...prev, station_key: e.target.value }))} />
            </div>
          )}

          {isAdmin ? (
            <><div>
              <input
                type="text"
                required
                className="auth-input-field input-highlight"
                placeholder="Admin Username"
                value={auth.username || ''}
                onChange={e => setAuth(prev => ({ ...prev, username: e.target.value }))}
              />
            </div></>
          ) : (
            <><div>

              <input
                type="text"
                required
                className="auth-input-field input-highlight"
                placeholder="Agent ID"
                value={auth.agent_code || ''}
                onChange={e => setAuth(prev => ({ ...prev, agent_code: e.target.value }))}
              />
            </div></>
          )}
          <div>
            <input
              type="password"
              required
              className="auth-input-field"
              placeholder="Password"
              value={auth.password || ''}
              onChange={e => setAuth(prev => ({ ...prev, password: e.target.value }))}
              /* 🎯 ADDED SECURITY: Conditional dynamic registration strength checks */
              minLength={isUp ? 8 : undefined}
              pattern={isUp ? "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$" : undefined}
              title={isUp ? "Registration Requirement: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)." : undefined}
            />
          </div>
          <button type="submit" className={`auth-action-submit-btn ${isAdmin ? 'btn-admin' : 'btn-agent'}`}>
            {isAdmin ? 'Verify Admin Auth ' : isUp ? 'Register Account' : 'Login '}
          </button>
        </form>
        <div className="auth-footer-routing">
          {isAdmin ? (
            <span className="auth-link-back" onClick={() => { setIsAdmin(false); setIsUp(false); setAuth({}); }}>← Operational Gateway</span>
          ) : (
            <span className="auth-toggle-text">
              {isUp ? "Have an account? " : "New agent? "}
              <b className="auth-toggle-link" onClick={() => { setIsUp(!isUp); setAuth({}); }}>{isUp ? "Sign In" : "Register"}</b>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
