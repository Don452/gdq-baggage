/**
 * 🎯 LOGIN SESSION INITIALIZER
 * Call this function immediately inside your Login form handler upon successful auth response
 * @param {Object} userData - The agent payload returned from your backend/Supabase database
 */
export const initializeUserSession = (userData) => {
  // Store user context safely in local storage
  localStorage.setItem('station_user', JSON.stringify(userData));
  
  // Stamp the initial interaction time vector
  localStorage.setItem('last_activity_timestamp', Date.now().toString());
};

/**
 * UTILITY: Clears localStorage records upon terminal evacuation
 */
export const clearActiveSessionData = () => {
  localStorage.removeItem('station_user');
  localStorage.removeItem('last_activity_timestamp');
};
