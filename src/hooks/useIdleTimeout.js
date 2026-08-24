import { useEffect } from 'react';
import { clearActiveSessionData } from '../utils/sessionManager';

export const useIdleTimeout = (setU) => {
  useEffect(() => {
    // Intercept checking early if no user profile is currently active in the panel state context
    const sessionActiveUser = localStorage.getItem('bagtrack_user');
    if (!sessionActiveUser) return;

    // 🎯 5 MINUTES THRESHOLD EQUATION MATRIX: 5 * 60 * 1000 = 300,000 milliseconds
    const IDLE_TIMEOUT_LIMIT = 15 * 60 * 1000; 
    const RUNTIME_AUDIT_INTERVAL = 10000; // Audits session status logs every 10 seconds

    /**
     * Resets the active operational timer upon mouse movement or inputs
     */
    const refreshActivityRecord = () => {
      localStorage.setItem('last_activity_timestamp', Date.now().toString());
    };

    /**
     * Inspects elapsed delta differences to catch terminal violations
     */
    const inspectTerminalLifespan = () => {
      const lastActiveStamp = localStorage.getItem('last_activity_timestamp');
      if (!lastActiveStamp) return;

      const idleDurationDelta = Date.now() - parseInt(lastActiveStamp, 10);

      // 🚨 IDLE THRESHOLD EXCEEDED: Erase local footprint matrices and break layout view
      if (idleDurationDelta >= IDLE_TIMEOUT_LIMIT) {
        clearInterval(inspectionTimerLoop);
        detachGlobalActivityInterceptors();
        clearActiveSessionData();
        
        alert("🔒 Terminal Session Locked: You have been signed out automatically due to 5 minutes of total terminal inactivity.");
        setU(null); // ⚡ Clears top level user state context variable to force layout unmount
      }
    };

    const attachGlobalActivityInterceptors = () => {
      window.addEventListener('mousemove', refreshActivityRecord);
      window.addEventListener('click', refreshActivityRecord);
      window.addEventListener('keypress', refreshActivityRecord);
      window.addEventListener('scroll', refreshActivityRecord);
      window.addEventListener('touchstart', refreshActivityRecord);
    };

    const detachGlobalActivityInterceptors = () => {
      window.removeEventListener('mousemove', refreshActivityRecord);
      window.removeEventListener('click', refreshActivityRecord);
      window.removeEventListener('keypress', refreshActivityRecord);
      window.removeEventListener('scroll', refreshActivityRecord);
      window.removeEventListener('touchstart', refreshActivityRecord);
    };

    // Initialize systems
    attachGlobalActivityInterceptors();
    const inspectionTimerLoop = setInterval(inspectTerminalLifespan, RUNTIME_AUDIT_INTERVAL);

    // Initial instant check verification
    inspectTerminalLifespan();

    return () => {
      detachGlobalActivityInterceptors();
      clearInterval(inspectionTimerLoop);
    };
  }, [setU]);
};
