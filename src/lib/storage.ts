import { AppStateData, Task, StudySession, UserSettings } from '../types';
import { DEFAULT_SETTINGS, SEED_TASKS, SEED_SESSIONS } from './constants';

const STORAGE_KEY = 'STEM_STUDY_TRACKER_V1';

export const loadAppState = (): AppStateData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : SEED_TASKS,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : SEED_SESSIONS,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        version: parsed.version || 1,
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }

  // Initial seed setup
  const initialState: AppStateData = {
    tasks: SEED_TASKS,
    sessions: SEED_SESSIONS,
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
  saveAppState(initialState);
  return initialState;
};

export const saveAppState = (data: AppStateData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Broadcast change to other open browser tabs
    try {
      const channel = new BroadcastChannel('stem_tracker_sync');
      channel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
      channel.close();
    } catch (err) {}
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
};

// Export app data to JSON file
export const exportDataAsJSON = (state: AppStateData) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(state, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  const filename = `stem_study_backup_${new Date().toISOString().split('T')[0]}.json`;
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Cloud Sync Server API Calls
export const pushToCloudVault = async (vaultKey: string, state: AppStateData): Promise<{ success: boolean; updatedAt?: string; message?: string }> => {
  try {
    const cleanKey = vaultKey.trim().toUpperCase();
    const response = await fetch(`/api/sync/${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: state }),
    });
    const resData = await response.json();
    if (resData.success) {
      return { success: true, updatedAt: resData.updatedAt };
    }
    return { success: false, message: resData.message || 'Cloud sync failed' };
  } catch (error) {
    return { success: false, message: (error as Error).message || 'Network error during cloud sync' };
  }
};

export const pullFromCloudVault = async (vaultKey: string): Promise<{ success: boolean; data?: AppStateData; updatedAt?: string; message?: string }> => {
  try {
    const cleanKey = vaultKey.trim().toUpperCase();
    const response = await fetch(`/api/sync/${cleanKey}`);
    const resData = await response.json();
    if (resData.success && resData.data) {
      return { success: true, data: resData.data, updatedAt: resData.updatedAt };
    }
    return { success: false, message: resData.message || 'Sync vault not found' };
  } catch (error) {
    return { success: false, message: (error as Error).message || 'Network error fetching vault' };
  }
};
