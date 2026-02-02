const USERNAME = 'admin';
const PASSWORD = 'EslamOsama37752873';
const SESSION_KEY = 'finance_tracker_session';

export interface Session {
  username: string;
  timestamp: number;
}

export function login(username: string, password: string): boolean {
  if (username === USERNAME && password === PASSWORD) {
    const session: Session = {
      username,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return false;
  
  try {
    const session: Session = JSON.parse(sessionStr);
    // Check if session is valid (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - session.timestamp > maxAge) {
      logout();
      return false;
    }
    return session.username === USERNAME;
  } catch {
    logout();
    return false;
  }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  
  try {
    return JSON.parse(sessionStr) as Session;
  } catch {
    return null;
  }
}
