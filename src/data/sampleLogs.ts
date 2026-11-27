export const SAMPLE_NOISY_LOGS = `[2026-11-27T09:14:22Z] INFO  ticket=INC-88421 channel=kyc-escalation
Customer: Aarav Mehta | Email: aarav.mehta@finvault.in | Mobile: +91 98765 43210
KYC Verification -> PAN: ABCPK4821M | Aadhaar: 4829 1056 7348 | Client IP: 192.168.14.88
Payment Instrument Charged: 4532 8910 3344 4242 (Primary Visa)
Logistics Reference (NON-PII Decoy): Tracking ID TRK-9876-5432-1098-7654 dispatched.

[2026-11-27T09:18:05Z] WARN  ticket=INC-88421 channel=retry-gateway
Follow-up alert for aarav.mehta@finvault.in (+91 98765 43210) from IP 192.168.14.88.
Retry card 4532 8910 3344 4242 succeeded after 3DS challenge.
Order Ref (NON-PII Decoy): ORD-8841209377410028 | Shipment Batch: 7700-1122-3344-5566

[2026-11-27T09:27:49Z] INFO  ticket=KYC-40912 channel=corporate-onboarding
Authorized Signatory: Priya Nair | Email: priya.nair+kyc@bharatpay.co.in
Alternate Contact: 09820145678 | US Escalation Desk: +1-415-555-0199 | UK Desk: +44 7700 900077
Corporate PAN: BGLCF9042R | Trust PAN: AAATH7719Q | Aadhaar: 739158246013
Corporate Card: 5425-2334-3010-9903 | Backup Settlement Card: 4111111111111111
Ingress Edge IPv4: 10.42.199.17 | IPv6 Peer: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
Audit Escalation CC: secops@enterprise-cloud.io

[2026-11-27T09:33:11Z] DEBUG validation-noise-check (MUST NOT REDACT INVALID CHECKSUMS)
Invalid PAN Entity Code: ABCXZ1234K (4th char 'X' invalid)
Invalid Aadhaar Checksum: 4829 1056 7349 | Invalid Prefix Aadhaar: 1829 1056 7348
Out-of-Range IPv4: 256.300.12.99 | Version String: v2.14.88
`;
