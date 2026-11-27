export type PIIEntityType = 'EMAIL' | 'PHONE' | 'IP' | 'PAN' | 'AADHAAR' | 'CARD';

export type DetectorToggles = Record<PIIEntityType, boolean>;

export interface TextInterval {
  start: number;
  end: number;
}

export interface RawMatch extends TextInterval {
  value: string;
  type: PIIEntityType;
  subType?: string;
  metadata?: string;
}

export const PAN_ENTITY_TYPES: Record<string, string> = {
  P: 'Individual / Person',
  C: 'Company',
  H: 'Hindu Undivided Family (HUF)',
  A: 'Association of Persons (AOP)',
  B: 'Body of Individuals (BOI)',
  G: 'Government Agency',
  J: 'Artificial Juridical Person',
  L: 'Local Authority',
  F: 'Partnership Firm',
  T: 'Trust',
};

const ENTITY_PRIORITY: Record<PIIEntityType, number> = {
  EMAIL: 6,
  CARD: 5,
  AADHAAR: 4,
  PAN: 3,
  IP: 2,
  PHONE: 1,
};

// Verhoeff dihedral group D5 multiplication table
const VERHOEFF_D: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Verhoeff permutation table
const VERHOEFF_P: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV: readonly number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Strips non-digit characters from an input string.
 */
export function extractDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Validates a credit card number using the Luhn (mod 10) checksum algorithm.
 * Accepts 13-19 digit sequences (ignoring spaces/hyphens).
 */
export function isValidLuhn(input: string): boolean {
  const digits = extractDigits(input);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  if (/^0+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (digit < 0 || digit > 9) {
      return false;
    }
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Identifies the card network from IIN/BIN prefix for audit tooltip enrichment.
 */
export function detectCardNetwork(input: string): string {
  const digits = extractDigits(input);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^(60|6521|6522)/.test(digits)) return 'RuPay';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  return 'Payment Card';
}

/**
 * Validates an Indian Permanent Account Number (PAN).
 * Format: [A-Z]{5}[0-9]{4}[A-Z]{1} where 4th char is a valid ITD entity code.
 */
export function isValidIndianPAN(input: string): boolean {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(input)) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(PAN_ENTITY_TYPES, input[3]);
}

/**
 * Returns the human-readable entity description for a valid PAN 4th character.
 */
export function getPANEntityDescription(pan: string): string {
  return PAN_ENTITY_TYPES[pan[3]] ?? 'Unknown Entity';
}

/**
 * Validates a numeric string using the Verhoeff checksum algorithm.
 */
export function isValidVerhoeff(digits: string): boolean {
  if (!/^\d+$/.test(digits)) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
  }
  return c === 0;
}

/**
 * Computes the Verhoeff check digit for a given digit prefix.
 */
export function computeVerhoeffCheckDigit(baseDigits: string): string {
  let c = 0;
  for (let i = 0; i < baseDigits.length; i++) {
    const digit = baseDigits.charCodeAt(baseDigits.length - 1 - i) - 48;
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digit]];
  }
  return String(VERHOEFF_INV[c]);
}

/**
 * Validates an Indian Aadhaar number:
 * 12 digits (continuous or XXXX XXXX XXXX / XXXX-XXXX-XXXX),
 * never starting with 0 or 1, and passing the Verhoeff checksum.
 */
export function isValidAadhaar(input: string): boolean {
  const digits = extractDigits(input);
  if (!/^[2-9][0-9]{11}$/.test(digits)) {
    return false;
  }
  return isValidVerhoeff(digits);
}

/**
 * Validates an IPv4 address with strict 0-255 octet bounds.
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return false;
  }
  for (const part of parts) {
    if (!/^(0|[1-9][0-9]{0,2})$/.test(part)) {
      return false;
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      return false;
    }
  }
  return true;
}

/**
 * Validates standard and compressed IPv6 addresses.
 */
export function isValidIPv6(ip: string): boolean {
  if (!ip.includes(':') || !/[0-9a-fA-F]/.test(ip)) {
    return false;
  }
  const doubleColonParts = ip.split('::');
  if (doubleColonParts.length > 2) {
    return false;
  }

  const isHexGroup = (g: string) => /^[0-9a-fA-F]{1,4}$/.test(g);

  if (doubleColonParts.length === 2) {
    const left = doubleColonParts[0] ? doubleColonParts[0].split(':') : [];
    const right = doubleColonParts[1] ? doubleColonParts[1].split(':') : [];
    if (left.some((g) => !isHexGroup(g)) || right.some((g) => !isHexGroup(g))) {
      return false;
    }
    const totalGroups = left.length + right.length;
    return totalGroups >= 1 && totalGroups <= 7;
  }

  const groups = ip.split(':');
  return groups.length === 8 && groups.every(isHexGroup);
}

/**
 * Validates RFC-compliant email addresses.
 */
export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const atIndex = email.indexOf('@');
  if (atIndex <= 0 || atIndex !== email.lastIndexOf('@')) return false;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return false;
  }
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
    domain
  );
}

/**
 * Validates Indian mobile numbers and international E.164-style phone numbers.
 */
export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  const digits = extractDigits(trimmed);

  if (trimmed.startsWith('+91')) {
    const national = digits.slice(2);
    return /^[6-9][0-9]{9}$/.test(national);
  }

  if (trimmed.startsWith('+')) {
    return digits.length >= 8 && digits.length <= 15 && !/^0+$/.test(digits);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return /^[6-9][0-9]{9}$/.test(digits.slice(1));
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return /^[6-9][0-9]{9}$/.test(digits.slice(2));
  }

  return digits.length === 10 && /^[6-9][0-9]{9}$/.test(digits);
}

/**
 * Merges overlapping or contiguous half-open intervals [start, end).
 */
export function mergeIntervals(intervals: TextInterval[]): TextInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => (a.start !== b.start ? a.start - b.start : a.end - b.end));
  const merged: TextInterval[] = [{ start: sorted[0].start, end: sorted[0].end }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }

  return merged;
}

/**
 * Checks whether an interval overlaps with any interval in a sorted merged list.
 */
export function overlapsAnyInterval(candidate: TextInterval, merged: TextInterval[]): boolean {
  for (const interval of merged) {
    if (interval.start >= candidate.end) {
      break;
    }
    if (candidate.start < interval.end && candidate.end > interval.start) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves overlapping PII matches deterministically so string slicing never corrupts indices.
 * Priority: earlier start -> higher specificity/longer span -> higher entity priority.
 */
export function resolveOverlappingMatches(matches: RawMatch[]): RawMatch[] {
  if (matches.length <= 1) return [...matches];

  // Rank candidates by priority + span length so stronger/broader matches claim their span first.
  const ranked = [...matches].sort((a, b) => {
    const prioDiff = ENTITY_PRIORITY[b.type] - ENTITY_PRIORITY[a.type];
    if (prioDiff !== 0) return prioDiff;
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });

  const accepted: RawMatch[] = [];
  let occupied: TextInterval[] = [];

  for (const candidate of ranked) {
    if (candidate.start < 0 || candidate.end <= candidate.start) continue;
    if (!overlapsAnyInterval(candidate, occupied)) {
      accepted.push(candidate);
      occupied = mergeIntervals([...occupied, { start: candidate.start, end: candidate.end }]);
    }
  }

  return accepted.sort((a, b) => a.start - b.start);
}
