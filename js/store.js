// Magasin unique de l'appli : état de progression, réglages et profil de l'appareil.
import { loadState, saveState, loadSettings, saveSettings, loadProfile, saveProfile } from "./storage.js";
import { setMuted } from "./audio.js";

let state = loadState();
let settings = loadSettings();
let profile = loadProfile();
setMuted(settings.muted);
const listeners = new Set();

export const store = {
  get state() { return state; },
  get settings() { return settings; },
  get profile() { return profile; },
  update(fn) { const r = fn(state); saveState(state); listeners.forEach((l) => l(state)); return r; },
  replaceState(s) { state = s; saveState(state); listeners.forEach((l) => l(state)); },
  set(key, value) { settings = { ...settings, [key]: value }; saveSettings(settings); if (key === "muted") setMuted(value); },
  setProfile(p) { profile = p; saveProfile(p); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
