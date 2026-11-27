import { describe, expect, it } from 'vitest';
import { SAMPLE_NOISY_LOGS } from '../data/sampleLogs';
import {
  clearPseudonymSession,
  createPseudonymSession,
  sanitizeText,
} from './redactor';
import {
  computeVerhoeffCheckDigit,
  isValidAadhaar,
  isValidEmail,
  isValidIPv4,
  isValidIPv6,
  isValidIndianPAN,
  isValidLuhn,
  isValidPhone,
  mergeIntervals,
  resolveOverlappingMatches,
} from './validators';

describe('Velvet Vault Validators', () => {
  it('validates credit cards strictly via Luhn mod-10', () => {
    expect(isValidLuhn('4532 8910 3344 4242')).toBe(true);
    expect(isValidLuhn('5425-2334-3010-9903')).toBe(true);
    expect(isValidLuhn('4111111111111111')).toBe(true);

    // Decoy 16-digit tracking/order IDs MUST fail Luhn
    expect(isValidLuhn('9876-5432-1098-7654')).toBe(false);
    expect(isValidLuhn('8841209377410028')).toBe(false);
    expect(isValidLuhn('7700-1122-3344-5566')).toBe(false);
    expect(isValidLuhn('0000 0000 0000 0000')).toBe(false);
  });

  it('validates Indian PAN entity-type 4th character codes', () => {
    expect(isValidIndianPAN('ABCPK4821M')).toBe(true); // P - Individual
    expect(isValidIndianPAN('BGLCF9042R')).toBe(true); // C - Company
    expect(isValidIndianPAN('AAATH7719Q')).toBe(true); // T - Trust
    expect(isValidIndianPAN('ABCXZ1234K')).toBe(false); // X - invalid entity code
    expect(isValidIndianPAN('abcpk4821m')).toBe(false);
  });

  it('validates Indian Aadhaar prefix and Verhoeff checksum', () => {
    const check = computeVerhoeffCheckDigit('48291056734');
    expect(check).toBe('8');
    expect(isValidAadhaar('4829 1056 7348')).toBe(true);
    expect(isValidAadhaar('739158246013')).toBe(true);

    // Bad checksum or invalid starting digit 0/1
    expect(isValidAadhaar('4829 1056 7349')).toBe(false);
    expect(isValidAadhaar('1829 1056 7348')).toBe(false);
    expect(isValidAadhaar('0829 1056 7348')).toBe(false);
  });

  it('validates IPv4 octets (0-255) and IPv6 addresses', () => {
    expect(isValidIPv4('192.168.14.88')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('256.300.12.99')).toBe(false);
    expect(isValidIPv4('192.168.01.1')).toBe(false);

    expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIPv6('fe80::1')).toBe(true);
    expect(isValidIPv6('10:35:02')).toBe(false);
  });

  it('validates emails and Indian/international phone numbers', () => {
    expect(isValidEmail('aarav.mehta@finvault.in')).toBe(true);
    expect(isValidEmail('priya.nair+kyc@bharatpay.co.in')).toBe(true);
    expect(isValidEmail('invalid@.com')).toBe(false);

    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('09820145678')).toBe(true);
    expect(isValidPhone('+1-415-555-0199')).toBe(true);
    expect(isValidPhone('+44 7700 900077')).toBe(true);
  });

  it('merges overlapping intervals and resolves overlapping matches cleanly', () => {
    const merged = mergeIntervals([
      { start: 10, end: 20 },
      { start: 15, end: 25 },
      { start: 30, end: 35 },
    ]);
    expect(merged).toEqual([
      { start: 10, end: 25 },
      { start: 30, end: 35 },
    ]);

    const resolved = resolveOverlappingMatches([
      { start: 5, end: 15, value: '9876543210', type: 'PHONE' },
      { start: 0, end: 24, value: 'user9876543210@acme.com', type: 'EMAIL' },
    ]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].type).toBe('EMAIL');
  });
});

describe('Velvet Vault Redactor Engine', () => {
  it('redacts valid Luhn cards while leaving decoy 16-digit IDs untouched', () => {
    const result = sanitizeText(SAMPLE_NOISY_LOGS, 'FULL');

    // Valid Luhn cards redacted
    expect(result.sanitizedText).not.toContain('4532 8910 3344 4242');
    expect(result.sanitizedText).not.toContain('5425-2334-3010-9903');
    expect(result.sanitizedText).not.toContain('4111111111111111');
    expect(result.counts.CARD).toBe(4); // 4532... appears twice + 5425... + 4111...

    // Decoy 16-digit tracking/order IDs MUST remain completely untouched
    expect(result.sanitizedText).toContain('TRK-9876-5432-1098-7654');
    expect(result.sanitizedText).toContain('ORD-8841209377410028');
    expect(result.sanitizedText).toContain('7700-1122-3344-5566');
    expect(result.luhnFalsePositivesIgnored).toBe(3);

    // Invalid checksums / entity codes / out-of-range IPv4 untouched
    expect(result.sanitizedText).toContain('ABCXZ1234K');
    expect(result.sanitizedText).toContain('4829 1056 7349');
    expect(result.sanitizedText).toContain('1829 1056 7348');
    expect(result.sanitizedText).toContain('256.300.12.99');
  });

  it('supports Full, Partial, and Consistent Pseudonymization modes', () => {
    const sample =
      'Email aarav@vault.in PAN ABCPK4821M Aadhaar 4829 1056 7348 Phone +91 98765 43210 Card 4532 8910 3344 4242 IP 192.168.14.88 | Repeat aarav@vault.in';

    const full = sanitizeText(sample, 'FULL');
    expect(full.sanitizedText).toContain('[REDACTED_EMAIL]');
    expect(full.sanitizedText).toContain('[REDACTED_PAN]');
    expect(full.sanitizedText).toContain('[REDACTED_AADHAAR]');
    expect(full.sanitizedText).toContain('[REDACTED_PHONE]');
    expect(full.sanitizedText).toContain('[REDACTED_CARD]');
    expect(full.sanitizedText).toContain('[REDACTED_IP]');

    const partial = sanitizeText(sample, 'PARTIAL');
    expect(partial.sanitizedText).toContain('a***@vault.in');
    expect(partial.sanitizedText).toContain('ABCPK****M');
    expect(partial.sanitizedText).toContain('XXXX-XXXX-7348');
    expect(partial.sanitizedText).toContain('+91-XXXXXX3210');
    expect(partial.sanitizedText).toContain('XXXX-XXXX-XXXX-4242');
    expect(partial.sanitizedText).toContain('192.168.***.***');

    const session = createPseudonymSession();
    const pseudo = sanitizeText(sample, 'PSEUDO', undefined, session);
    expect(pseudo.sanitizedText).toContain('EMAIL_01');
    expect(pseudo.sanitizedText).toContain('PAN_01');
    expect(pseudo.sanitizedText).toContain('AADHAAR_01');
    expect(pseudo.sanitizedText).toContain('PHONE_01');
    expect(pseudo.sanitizedText).toContain('CARD_01');
    expect(pseudo.sanitizedText).toContain('IP_01');
    // Both occurrences of aarav@vault.in map to EMAIL_01
    expect(pseudo.sanitizedText.match(/EMAIL_01/g)?.length).toBe(2);
    expect(pseudo.sessionMappings.find((m) => m.placeholder === 'EMAIL_01')?.occurrences).toBe(2);

    clearPseudonymSession(session);
    expect(session.map.size).toBe(0);
  });
});
