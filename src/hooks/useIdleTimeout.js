import { useEffect } from 'react';

export const useIdleTimeout = (setU) => {
  useEffect(() => {
    const sessionActiveUser = localStorage.getItem('bagtrack_user');
    if (!sessionActiveUser) return;

    // 🎯 CRITICAL REFRESH ENFORCEMENT: Stamp current time instantly on remount 
    // This kills the stale storage value BEFORE the background evaluation check runs.
    localStorage.setItem('last_activity_timestamp', Date.now().toString());

    const IDLE_TIMEOUT_LIMIT = 15 * 60 * 1000; // 15 Minutes
    const RUNTIME_AUDIT_INTERVAL = 10000;      // 10 Seconds

    const refreshActivityRecord = () => {
      localStorage.setItem('last_activity_timestamp', Date.now().toString());
    };

    const inspectTerminalLifespan = () => {
      const lastActiveStamp = localStorage.getItem('last_activity_timestamp');
      if (!lastActiveStamp) return;

      const idleDurationDelta = Date.now() - parseInt(lastActiveStamp, 10);

      if (idleDurationDelta >= IDLE_TIMEOUT_LIMIT) {
        clearInterval(inspectionTimerLoop);
        detachGlobalActivityInterceptors();
        
        localStorage.removeItem('bagtrack_user');
        localStorage.removeItem('last_activity_timestamp');
        
        alert("🔒 Terminal Session Locked: You have been signed out automatically due to 15 minutes of terminal inactivity.");
        setU(null); 
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

    attachGlobalActivityInterceptors();
    const inspectionTimerLoop = setInterval(inspectTerminalLifespan, RUNTIME_AUDIT_INTERVAL);

    return () => {
      detachGlobalActivityInterceptors();
      clearInterval(inspectionTimerLoop);
    };
  }, [setU]);
};
