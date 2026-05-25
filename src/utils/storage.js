const KEY = 'mandi_crm_v1';

export const loadData = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveData = data => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
};

export const clearData = () => {
  try { localStorage.removeItem(KEY); } catch {}
};
