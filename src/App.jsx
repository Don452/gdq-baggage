import React, { useState, useEffect } from 'react';
import { sb } from './utils/supabaseClient';
import AuthPortal from './components/AuthPortal';
import RecordForm from './components/RecordForm';
import DashboardTable from './components/DashboardTable';
import AdminAnalytics from './components/AdminAnalytics';
import StationAnalytics from './components/StationAnalytics';
import AppNavbar from './components/AppNavbar';
import BaggageToolbar from './components/BaggageToolbar';

import './App.css';

export default function App() {
  const [u, setU] = useState(() => JSON.parse(localStorage.getItem('bagtrack_user')));
  const [tab, setTab] = useState('All');
  const [recs, setRecs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stations, setStations] = useState([]);
  const [srch, setSrch] = useState('');
  const [isS, setIsS] = useState(false);
  const [auth, setAuth] = useState({ station_code: '' });
  const [form, setForm] = useState({ irregularity_type: 'Delayed', bag_color: '', bag_kilos: '' });
  const [edId, setEdId] = useState(null);
  const [edF, setEdF] = useState({});
  const [viewMode, setViewMode] = useState('records'); 
  const [stationFilter, setStationFilter] = useState('LOCAL');
  const [colorFilter, setColorFilter] = useState('ALL');
  const [sd, setSd] = useState('');
  const [ed, setEd] = useState('');

  useEffect(() => {
    if (u && u.is_admin) {
      setViewMode('analytics'); 
    }
  }, [u]);

  useEffect(() => {
    fetchRecords();
    fetchAgents();
    fetchStations();
    
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = "https://jsdelivr.net";
      document.head.appendChild(script);
    }

    const channel = sb.channel('schema-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'baggage_records' }, () => {
      fetchRecords();
    }).subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const fetchRecords = async () => {
    const { data } = await sb.from('baggage_records').select('*').order('created_at', { ascending: false });
    if (data) setRecs(data);
  };

  const fetchAgents = async () => {
    const { data } = await sb.from('agents').select('username, first_name, middle_name, station_code, is_admin');
    if (data) setAgents(data);
  };

  const fetchStations = async () => {
    const { data } = await sb.from('stations').select('*').order('station_code');
    if (data) setStations(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('bagtrack_user');
    setU(null);
    setViewMode('records');
    setStationFilter('LOCAL');
    setColorFilter('ALL');
    setSd('');
    setEd('');
  };

  // 🔍 UNIFIED FILTER LOGIC MATRIX FOR STATION AGENTS VIEW
  const filteredRecords = recs.filter(b => {
    if (!u) return false;
    
    let matchesStation = true;
    if (stationFilter === 'LOCAL') {
      matchesStation = b.station_code === u.station_code;
    } else if (stationFilter !== 'GLOBAL') {
      matchesStation = b.station_code === stationFilter;
    }

    const matchesTab = tab === 'All' || b.irregularity_type === tab;
    const matchesColor = colorFilter === 'ALL' || (b.bag_color || '').toUpperCase() === colorFilter.toUpperCase();

    const matchesSearch = 
      b.bag_tag_number?.toLowerCase().includes(srch.toLowerCase()) ||
      b.passenger_last_name?.toLowerCase().includes(srch.toLowerCase()) ||
      b.file_number?.toLowerCase().includes(srch.toLowerCase());
    
    let matchesDate = true;
    if (sd && ed) {
      const bDate = new Date(b.created_at).toISOString().split('T')[0];
      matchesDate = bDate >= sd && bDate <= ed;
    }
    return matchesStation && matchesTab && matchesColor && matchesSearch && matchesDate;
  });

  if (!u) {
    return <AuthPortal u={u} setU={setU} isS={isS} setIsS={setIsS} auth={auth} setAuth={setAuth} />;
  }

  return (
    <div className="app-viewport-container">
    {/* 📋 MODULAR NAVBAR HEADER SUB-MODULE */}
    <AppNavbar u={u} viewMode={viewMode} setViewMode={setViewMode} handleLogout={handleLogout} />

    <main className="content-workspace-wrapper" style={{ padding: '20px' }}>
      {u.is_admin || viewMode === 'analytics' ? (
        u.is_admin ? (
          <AdminAnalytics recs={recs} stations={stations} fetchStations={fetchStations} />
        ) : (
          <StationAnalytics recs={recs} u={u} agents={agents} />
        )
      ) : (
        <>
          <RecordForm u={u} form={form} setForm={setForm} fetchRecords={fetchRecords} />

          {/* 🔍 MODULAR FILTERS UTILITY TOOLBAR SUB-MODULE */}
          <BaggageToolbar 
            u={u} tab={tab} setTab={setTab}
            stationFilter={stationFilter} setStationFilter={setStationFilter} stations={stations}
            colorFilter={colorFilter} setColorFilter={setColorFilter}
            srch={srch} setSrch={setSrch} sd={sd} setSd={setSd} ed={ed} setEd={setEd}
          />

          <DashboardTable fil={filteredRecords} u={u} edId={edId} setEdId={setEdId} edF={edF} setEdF={setEdF} fetchRecords={fetchRecords} />
        </>
      )}
    </main>
  </div>
  );
}
