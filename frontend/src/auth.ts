import type { AdminSession } from './types';

const KEY = 'consulado.admin';

export function saveSession(session: AdminSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): AdminSession | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as AdminSession;
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function getToken() {
  return getSession()?.accessToken;
}
