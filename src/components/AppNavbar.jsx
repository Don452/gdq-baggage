import React, { useState } from 'react';
import logo from '../assets/logo.webp';
import '../styles/AppNavbar.css';

export default function AppNavbar({ u, viewMode, setViewMode, handleLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stCode = String(u?.station_code || '').trim().toUpperCase();
  const isAdmin = !!u?.is_admin;

  // Bulletproof Initials Generator: Extracts two uppercase initials from profile details
  const getInitials = () => {
    const first = String(u?.first_name || '').trim();
    const middle = String(u?.middle_name || '').trim();

    if (!first) return 'HA';

    const firstInitial = first.charAt(0);
    const secondInitial = middle ? middle.charAt(0) : first.charAt(1) || 'X';

    return `${firstInitial}${secondInitial}`.toUpperCase();
  };

  return (
    <header className="main-navbar-header">
      {/* Brand Identity Module Panel */}
      <div className="brand-wrapper">
        <h2 className="brand-heading">
          <img src={logo} alt="Ethiopian Airlines" className="brand-logo-img" />
        </h2>
      </div>

      {/* 📱 Mobile Hamburger Menu Animation Trigger Toggle */}
      <button 
        className={`nav-hamburger-toggle-icon ${menuOpen ? 'is-active' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle Navigation Control Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Perfectly Uniform Grid Action Wrapper Menu Area */}
      <div className={`nav-actions-menu ${menuOpen ? 'mobile-is-visible' : ''}`}>
        {!isAdmin && (
          <button
            className="nav-pill-item nav-toggle-btn"
            style={{ backgroundColor: viewMode === 'analytics' ? 'var(--accent-damaged)' : 'var(--primary)' }}
            onClick={() => {
              setViewMode(viewMode === 'records' ? 'analytics' : 'records');
              setMenuOpen(false); // Clean collapse on menu actions interaction
            }}
          >
            {viewMode === 'records' ? "📊 View Analytics" : "📋 View Records"}
          </button>
        )}
        <span className={`station-badge-node ${isAdmin ? 'badge-admin' : 'badge-terminal'}`}>
          {isAdmin ? "ET EXPRESS" : `ET-${stCode}`}
        </span>
        {/* 🟢 Circular branded badge showcasing uppercase user profile initials */}
        <div className="agent-greeting-circle" title={`Logged in user: ${u?.first_name || 'Handler'}`}>
          {getInitials()}
        </div>

        <button 
          className="nav-pill-item nav-logout-action-btn" 
          onClick={() => {
            handleLogout();
            setMenuOpen(false);
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
