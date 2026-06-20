const decodeKey = (base64) => {
  if (typeof atob === 'function') {
    return atob(base64);
  }
  if (typeof Buffer === 'function') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  return base64;
};

export const DEFAULT_OR_KEY = decodeKey('c2stb3ItdjEtZTAyMGFkMjAxM2I4MDJiYTMxOTlmMjdhMjdlODAwMGQyOTVjYjJjZjcxMTA0ZDc1ZmU5MjMzMDFhZDE2MDI3MA==');

/**
 * Escapes HTML character sequences to prevent Cross-Site Scripting (XSS).
 * @param {string} str - The target string to escape
 * @returns {string} The escaped safe HTML string
 */
export function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DB_KEYS = {
  PROFILE: 'mwt_user_profile',
  MOOD_LOGS: 'mwt_mood_logs',
  JOURNALS: 'mwt_journals',
  SETTINGS: 'mwt_settings'
};

export const db = {
  // --- Profile Management ---
  getProfile() {
    const data = localStorage.getItem(DB_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  saveProfile(profile) {
    localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(profile));
    // Trigger profile change event
    window.dispatchEvent(new CustomEvent('mwt-profile-updated', { detail: profile }));
  },

  // --- Mood Logs ---
  getMoodLogs() {
    const data = localStorage.getItem(DB_KEYS.MOOD_LOGS);
    return data ? JSON.parse(data) : [];
  },

  saveMoodLog(moodScore, moodName, note = '') {
    const logs = this.getMoodLogs();
    const newLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      score: moodScore, // 1 (Very Stressed) to 5 (Very Calm/Happy)
      mood: moodName,
      note: note
    };
    logs.push(newLog);
    localStorage.setItem(DB_KEYS.MOOD_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('mwt-mood-updated', { detail: logs }));
    return newLog;
  },

  // --- Journal Entries & Analysis ---
  getJournals() {
    const data = localStorage.getItem(DB_KEYS.JOURNALS);
    return data ? JSON.parse(data) : [];
  },

  saveJournalEntry(text, moodScore, analysis = null) {
    const journals = this.getJournals();
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      text,
      moodScore,
      analysis // contains: { sentiment, triggers, coping, summary }
    };
    journals.push(entry);
    localStorage.setItem(DB_KEYS.JOURNALS, JSON.stringify(journals));
    window.dispatchEvent(new CustomEvent('mwt-journals-updated', { detail: journals }));
    return entry;
  },

  deleteJournalEntry(id) {
    const journals = this.getJournals();
    const updated = journals.filter(j => j.id !== id);
    localStorage.setItem(DB_KEYS.JOURNALS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mwt-journals-updated', { detail: updated }));
  },

  // --- API & General Settings ---
  getSettings() {
    const data = localStorage.getItem(DB_KEYS.SETTINGS);
    const defaults = {
      geminiKey: '',
      openRouterKey: DEFAULT_OR_KEY,
      openRouterModel: 'openrouter/free',
      provider: 'openrouter', // 'gemini', 'openrouter' or 'simulated'
      theme: 'dark',
      notificationsEnabled: false
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mwt-settings-updated', { detail: updated }));
  },

  // --- Reset All Data ---
  clearAllData() {
    Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('mwt-data-reset'));
  }
};
