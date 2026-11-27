import {
  type DetectorToggles,
  type PIIEntityType,
  type RawMatch,
  type TextInterval,
  detectCardNetwork,
  extractDigits,
  getPANEntityDescription,
  isValidAadhaar,
  isValidEmail,
  isValidIPv4,
  isValidIPv6,
  isValidIndianPAN,
  isValidLuhn,
  isValidPhone,
  mergeIntervals,
  overlapsAnyInterval,
  resolveOverlappingMatches,
} from './validators';

export type RedactionMode = 'FULL' | 'PARTIAL' | 'PSEUDO';

export interface DetectedEntity extends RawMatch {
  id: string;
  replacement: string;
}

export interface PseudonymEntry {
  placeholder: string;
  type: PIIEntityType;
  canonicalKey: string;
  originalSample: string;
  occurrences: number;
}

export interface PseudonymSession {
  map: Map<string, PseudonymEntry>;
  counters: Record<PIIEntityType, number>;
}

export interface AuditCounts {
  EMAIL: number;
  PHONE: number;
  IP: number;
  PAN: number;
  AADHAAR: number;
  CARD: number;
}

export interface SanitizationResult {
  sanitizedText: string;
  entities: DetectedEntity[];
  totalRedacted: number;
  counts: AuditCounts;
  luhnFalsePositivesIgnored: number;
  sessionMappings: PseudonymEntry[];
}

export const DEFAULT_DETECTOR_TOGGLES: DetectorToggles = {
  EMAIL: true,
  PHONE: true,
  IP: true,
  PAN: true,
  AADHAAR: true,
  CARD: true,
};

export const FULL_MASK_LABELS: Record<PIIEntityType, string> = {
  EMAIL: '[REDACTED_EMAIL]',
  PHONE: '[REDACTED_PHONE]',
  CARD: '[REDACTED_CARD]',
  PAN: '[REDACTED_PAN]',
  AADHAAR: '[REDACTED_AADHAAR]',
  IP: '[REDACTED_IP]',
};

export function createEmptyCounts(): AuditCounts {
  return {
    EMAIL: 0,
    PHONE: 0,
    IP: 0,
    PAN: 0,
    AADHAAR: 0,
    CARD: 0,
  };
}

export function createPseudonymSession(): PseudonymSession {
  return {
    map: new Map<string, PseudonymEntry>(),
    counters: createEmptyCounts(),
  };
}

export function clearPseudonymSession(session: PseudonymSession): void {
  session.map.clear();
  session.counters = createEmptyCounts();
}

function getCanonicalKey(type: PIIEntityType, raw: string): string {
  switch (type) {
    case 'EMAIL':
      return `EMAIL:${raw.trim().toLowerCase()}`;
    case 'PAN':
      return `PAN:${raw.trim().toUpperCase()}`;
    case 'CARD':
    case 'AADHAAR':
    case 'PHONE':
      return `${type}:${extractDigits(raw)}`;
    case 'IP':
      return `IP:${raw.trim().toLowerCase()}`;
  }
}

export function formatPartialMask(type: PIIEntityType, raw: string): string {
  switch (type) {
    case 'EMAIL': {
      const atIdx = raw.indexOf('@');
      if (atIdx <= 0) return '[REDACTED_EMAIL]';
      const local = raw.slice(0, atIdx);
      const domain = raw.slice(atIdx + 1);
      return `${local[0]}***@${domain}`;
    }

    case 'PHONE': {
      const trimmed = raw.trim();
      const digits = extractDigits(trimmed);
      const last4 = digits.slice(-4);
      if (trimmed.startsWith('+91')) {
        return `+91-XXXXXX${last4}`;
      }
      if (trimmed.startsWith('+')) {
        const prefixMatch = trimmed.match(/^\+(\d{1,3})/);
        const cc = prefixMatch ? prefixMatch[1] : digits.slice(0, Math.max(1, digits.length - 10));
        const maskedLen = Math.max(4, digits.length - cc.length - 4);
        return `+${cc}-${'X'.repeat(maskedLen)}${last4}`;
      }
      if (digits.length === 11 && digits.startsWith('0')) {
        return `0-XXXXXX${last4}`;
      }
      return `${'X'.repeat(Math.max(4, digits.length - 4))}${last4}`;
    }

    case 'CARD': {
      const digits = extractDigits(raw);
      const last4 = digits.slice(-4);
      const maskedCount = Math.max(0, digits.length - 4);
      const maskedStr = 'X'.repeat(maskedCount);
      const groups: string[] = [];
      for (let i = 0; i < maskedStr.length; i += 4) {
        groups.push(maskedStr.slice(i, i + 4));
      }
      groups.push(last4);
      return groups.join('-');
    }

    case 'PAN': {
      const upper = raw.trim().toUpperCase();
      if (upper.length !== 10) return '[REDACTED_PAN]';
      return `${upper.slice(0, 5)}****${upper.slice(9)}`;
    }

    case 'AADHAAR': {
      const digits = extractDigits(raw);
      return `XXXX-XXXX-${digits.slice(-4)}`;
    }

    case 'IP': {
      if (raw.includes(':')) {
        const parts = raw.split(':').filter((p) => p.length > 0);
        const prefix = parts.slice(0, 2).join(':');
        return prefix ? `${prefix}:****:****` : '****:****';
      }
      const octets = raw.split('.');
      if (octets.length !== 4) return '[REDACTED_IP]';
      return `${octets[0]}.${octets[1]}.***.***`;
    }
  }
}

function getOrCreatePseudonym(
  session: PseudonymSession,
  type: PIIEntityType,
  rawValue: string
): string {
  const canonicalKey = getCanonicalKey(type, rawValue);
  const existing = session.map.get(canonicalKey);
  if (existing) {
    existing.occurrences += 1;
    return existing.placeholder;
  }

  session.counters[type] += 1;
  const padded = String(session.counters[type]).padStart(2, '0');
  const placeholder = `${type}_${padded}`;

  session.map.set(canonicalKey, {
    placeholder,
    type,
    canonicalKey,
    originalSample: rawValue,
    occurrences: 1,
  });

  return placeholder;
}

/**
 * Checks if a card-like separator structure looks like a genuine card/ID rather than unrelated numbers.
 */
function hasPlausibleCardSeparators(candidate: string): boolean {
  if (!/[ -]/.test(candidate)) {
    return true;
  }
  const hasSpace = candidate.includes(' ');
  const hasHyphen = candidate.includes('-');
  if (hasSpace && hasHyphen) {
    return false;
  }
  const sep = hasSpace ? ' ' : '-';
  const groups = candidate.split(sep);
  return groups.every((g) => g.length >= 3 && g.length <= 6);
}

/**
 * Scans raw input text for enabled PII categories, enforces cryptographic/checksum
 * validation (Luhn, Verhoeff, PAN entity codes, IPv4 octets), resolves overlapping
 * intervals safely, and renders the sanitized text for the chosen redaction mode.
 */
export function sanitizeText(
  input: string,
  mode: RedactionMode,
  toggles: DetectorToggles = DEFAULT_DETECTOR_TOGGLES,
  existingSession?: PseudonymSession
): SanitizationResult {
  if (!input) {
    const session = existingSession ?? createPseudonymSession();
    clearPseudonymSession(session);
    return {
      sanitizedText: '',
      entities: [],
      totalRedacted: 0,
      counts: createEmptyCounts(),
      luhnFalsePositivesIgnored: 0,
      sessionMappings: [],
    };
  }

  const rawMatches: RawMatch[] = [];
  const rejectedCardIntervalsRaw: TextInterval[] = [];
  let luhnFalsePositivesIgnored = 0;

  // 1. Emails
  if (toggles.EMAIL) {
    const emailRegex =
      /(?<![a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-])[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![a-zA-Z0-9-])/g;
    for (const match of input.matchAll(emailRegex)) {
      const value = match[0];
      const start = match.index ?? 0;
      if (isValidEmail(value)) {
        rawMatches.push({
          start,
          end: start + value.length,
          value,
          type: 'EMAIL',
          subType: 'Email Address',
          metadata: 'RFC-5322 pattern verified',
        });
      }
    }
  }

  // 2. Credit Cards (Mandatory Luhn Validation; track failed 13-19 digit decoys)
  if (toggles.CARD) {
    const cardCandidateRegex = /(?<!\d)(?<!\d-)\d(?:[ -]?\d){12,18}(?!\d)(?!-\d)/g;
    for (const match of input.matchAll(cardCandidateRegex)) {
      const value = match[0];
      const start = match.index ?? 0;
      const end = start + value.length;

      // Avoid matching decimal numbers like 1234.567890123456
      const charBefore = start > 0 ? input[start - 1] : '';
      const charBeforeBefore = start > 1 ? input[start - 2] : '';
      if (charBefore === '.' && /\d/.test(charBeforeBefore)) {
        continue;
      }
      if (!hasPlausibleCardSeparators(value)) {
        continue;
      }

      const digits = extractDigits(value);
      if (digits.length < 13 || digits.length > 19) {
        continue;
      }

      if (isValidLuhn(value)) {
        rawMatches.push({
          start,
          end,
          value,
          type: 'CARD',
          subType: detectCardNetwork(value),
          metadata: `Luhn mod-10 valid (${digits.length} digits)`,
        });
      } else {
        luhnFalsePositivesIgnored += 1;
        rejectedCardIntervalsRaw.push({ start, end });
      }
    }
  }

  const rejectedCardIntervals = mergeIntervals(rejectedCardIntervalsRaw);

  // 3. Indian PAN
  if (toggles.PAN) {
    const panRegex = /(?<![A-Z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Z0-9])/g;
    for (const match of input.matchAll(panRegex)) {
      const value = match[0];
      const start = match.index ?? 0;
      if (isValidIndianPAN(value)) {
        rawMatches.push({
          start,
          end: start + value.length,
          value,
          type: 'PAN',
          subType: 'Indian PAN',
          metadata: `Entity code '${value[3]}' (${getPANEntityDescription(value)})`,
        });
      }
    }
  }

  // 4. Indian Aadhaar (12 digits, first digit 2-9, Verhoeff checksum verified)
  if (toggles.AADHAAR) {
    const aadhaarRegex =
      /(?<!\d)(?<!\d-)(?:[2-9]\d{3}[ -]\d{4}[ -]\d{4}|[2-9]\d{11})(?!\d)(?!-\d)/g;
    for (const match of input.matchAll(aadhaarRegex)) {
      const value = match[0];
      const start = match.index ?? 0;
      const end = start + value.length;
      if (overlapsAnyInterval({ start, end }, rejectedCardIntervals)) {
        continue;
      }
      if (isValidAadhaar(value)) {
        rawMatches.push({
          start,
          end,
          value,
          type: 'AADHAAR',
          subType: 'Indian Aadhaar',
          metadata: 'Verhoeff checksum verified',
        });
      }
    }
  }

  // 5. IP Addresses (IPv4 0-255 octets & IPv6)
  if (toggles.IP) {
    const ipv4Regex = /(?<![\d.])\d{1,3}(?:\.\d{1,3}){3}(?![\d.])/g;
    for (const match of input.matchAll(ipv4Regex)) {
      const value = match[0];
      const start = match.index ?? 0;
      if (isValidIPv4(value)) {
        rawMatches.push({
          start,
          end: start + value.length,
          value,
          type: 'IP',
          subType: 'IPv4 Address',
          metadata: 'Strict 0–255 octet bounds verified',
        });
      }
    }

    const ipv6Regex = /(?<![0-9a-fA-F:])(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?![0-9a-fA-F:])/g;
    for (const match of input.matchAll(ipv6Regex)) {
      const value = match[0];
      const start = match.index ?? 0;
      if (isValidIPv6(value)) {
        rawMatches.push({
          start,
          end: start + value.length,
          value,
          type: 'IP',
          subType: 'IPv6 Address',
          metadata: 'Hexadecimal 128-bit structure verified',
        });
      }
    }
  }

  // 6. Phone Numbers (Indian mobile + International E.164)
  if (toggles.PHONE) {
    const phonePatterns = [
      /(?<!\d)(?<!\d-)\+91[-.\s]?[6-9]\d{4}[-.\s]?\d{5}(?!\d)(?!-\d)/g,
      /(?<!\d)(?<!\d-)\+91[-.\s]?[6-9]\d{2}[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)(?!-\d)/g,
      /(?<!\d)(?<!\d-)0[6-9]\d{4}[-.\s]?\d{5}(?!\d)(?!-\d)/g,
      /(?<!\d)(?<!\d-)[6-9]\d{4}[-.\s]?\d{5}(?!\d)(?!-\d)/g,
      /(?<!\d)(?<!\d-)[6-9]\d{2}[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)(?!-\d)/g,
      /(?<!\d)(?<!\d-)\+(?!91\b)\d{1,3}[-.\s]?(?:\(\d{1,4}\)[-.\s]?)?\d{2,5}(?:[-.\s]?\d{2,5}){1,3}(?!\d)(?!-\d)/g,
    ];

    for (const pattern of phonePatterns) {
      for (const match of input.matchAll(pattern)) {
        const value = match[0];
        const start = match.index ?? 0;
        const end = start + value.length;
        if (overlapsAnyInterval({ start, end }, rejectedCardIntervals)) {
          continue;
        }
        if (isValidPhone(value)) {
          rawMatches.push({
            start,
            end,
            value,
            type: 'PHONE',
            subType: value.trim().startsWith('+91') || !value.trim().startsWith('+')
              ? 'Indian Mobile'
              : 'International Phone',
            metadata: `${extractDigits(value).length} digits verified`,
          });
        }
      }
    }
  }

  // Merge/resolve overlapping spans deterministically
  const resolved = resolveOverlappingMatches(rawMatches);

  // Build deterministic pseudonym map in order of appearance
  const session = existingSession ?? createPseudonymSession();
  clearPseudonymSession(session);

  const counts = createEmptyCounts();
  const entities: DetectedEntity[] = [];
  const chunks: string[] = [];
  let cursor = 0;

  for (let i = 0; i < resolved.length; i++) {
    const item = resolved[i];
    counts[item.type] += 1;

    // Always register in pseudonym session so toggling into PSEUDO or inspecting the map stays deterministic
    const pseudoPlaceholder = getOrCreatePseudonym(session, item.type, item.value);

    let replacement: string;
    if (mode === 'FULL') {
      replacement = FULL_MASK_LABELS[item.type];
    } else if (mode === 'PARTIAL') {
      replacement = formatPartialMask(item.type, item.value);
    } else {
      replacement = pseudoPlaceholder;
    }

    chunks.push(input.slice(cursor, item.start));
    chunks.push(replacement);
    cursor = item.end;

    entities.push({
      ...item,
      id: `${item.type}_${item.start}_${item.end}`,
      replacement,
    });
  }

  chunks.push(input.slice(cursor));

  return {
    sanitizedText: chunks.join(''),
    entities,
    totalRedacted: entities.length,
    counts,
    luhnFalsePositivesIgnored,
    sessionMappings: Array.from(session.map.values()),
  };
}
