/**
 * Velvet Vault — Client-Side Authentication Store
 * Zero-network, zero-external-service, CSP connect-src 'none' compliant.
 *
 * Uses:
 *  - Web Crypto API (crypto.subtle) for SHA-256 password hashing
 *  - localStorage for persisting registered users (hashed — no plain-text passwords)
 *  - sessionStorage for the active session (cleared on tab close)
 */

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string; // hex SHA-256
  createdAt: string;
}

interface Session {
  userId: string;
  email: string;
  fullName: string;
  loggedInAt: string;
}

const USERS_KEY = 'vv_users';
const SESSION_KEY = 'vv_session';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateId(): string {
  // Use crypto.getRandomValues — available without network
  const arr = new Uint32Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(n => n.toString(16).padStart(8, '0')).join('');
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Public API ────────────────────────────────────────────────────────────────

export type AuthError =
  | 'EMAIL_TAKEN'
  | 'INVALID_EMAIL'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORDS_MISMATCH'
  | 'INVALID_CREDENTIALS'
  | 'UNKNOWN';

export interface AuthResult {
  ok: boolean;
  user?: AuthUser;
  error?: AuthError;
}

/** Register a new user. Hashes password with SHA-256 before storing. */
export async function registerUser(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResult> {
  // Validate
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return { ok: false, error: 'INVALID_EMAIL' };
  if (password.length < 8) return { ok: false, error: 'PASSWORD_TOO_SHORT' };
  if (password !== confirmPassword) return { ok: false, error: 'PASSWORDS_MISMATCH' };

  const users = loadUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return { ok: false, error: 'EMAIL_TAKEN' };
  }

  const passwordHash = await sha256hex(password + email.toLowerCase().trim()); // salted with email
  const newUser: StoredUser = {
    id: generateId(),
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);

  // Auto-login
  const session: Session = {
    userId: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return {
    ok: true,
    user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, createdAt: newUser.createdAt },
  };
}

/** Login with email + password. */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const users = loadUsers();
  const stored = users.find(u => u.email === email.toLowerCase().trim());
  if (!stored) return { ok: false, error: 'INVALID_CREDENTIALS' };

  const hash = await sha256hex(password + email.toLowerCase().trim());
  if (hash !== stored.passwordHash) return { ok: false, error: 'INVALID_CREDENTIALS' };

  const session: Session = {
    userId: stored.id,
    email: stored.email,
    fullName: stored.fullName,
    loggedInAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return {
    ok: true,
    user: { id: stored.id, fullName: stored.fullName, email: stored.email, createdAt: stored.createdAt },
  };
}

/** Returns the current session user, or null. */
export function getCurrentSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return { id: s.userId, fullName: s.fullName, email: s.email, createdAt: s.loggedInAt };
  } catch {
    return null;
  }
}

/** Clear session (logout). Does NOT clear stored users. */
export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Human-readable error messages */
export function authErrorMessage(error: AuthError): string {
  switch (error) {
    case 'EMAIL_TAKEN': return 'An account with this email already exists.';
    case 'INVALID_EMAIL': return 'Please enter a valid email address.';
    case 'PASSWORD_TOO_SHORT': return 'Password must be at least 8 characters.';
    case 'PASSWORDS_MISMATCH': return 'Passwords do not match.';
    case 'INVALID_CREDENTIALS': return 'Invalid email or password. Please try again.';
    default: return 'An unexpected error occurred. Please try again.';
  }
}
