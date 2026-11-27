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

export const SAMPLE_KYC_CSV = `customer_id,full_name,email,mobile,pan,aadhaar,card_number,upi_handle,tracking_ref_decoy,client_ip
CUST-101,Aarav Mehta,aarav.mehta@finvault.in,+91 98765 43210,ABCPK4821M,4829 1056 7348,4532 8910 3344 4242,aarav.mehta@okicici,9876-5432-1098-7654,192.168.14.88
CUST-102,Priya Nair,priya.nair@bharatpay.co.in,09820145678,BGLCF9042R,739158246013,5425-2334-3010-9903,priya.nair@ybl,8841209377410028,10.42.199.17
CUST-103,Vikram Rao,vikram.rao@securebank.in,+91-9811122334,DEFPN6104K,4829 1056 7348,4111111111111111,vikram99@oksbi,7700-1122-3344-5566,172.16.80.14
CUST-104,Elena Vance,elena.vance@globalcorp.io,+44 7700 900077,AAATH7719Q,4829 1056 7349,4532-0151-1283-0366,elena@paytm,ORD-9876543210987654,2001:0db8:85a3:0000:0000:8a2e:0370:7334
`;

export const SAMPLE_CLINICAL_NOTES = `CLINICAL INTAKE RECORD // DEPARTMENT OF CARDIOLOGY
Admission Timestamp: 2026-11-27 08:45 IST | Encounter ID: ENC-2026-4491
Patient Name: Rohan Deshmukh | Guardian Contact: +91 98220 45123
Patient Portal Email: rohan.deshmukh@healthmail.in | Caregiver Email: meera.d@cliniccare.org
National KYC Verification -> PAN: DEFPN6104K | Aadhaar: 4829 1056 7348
Attending Specialist ID: EMP-742190 | Telehealth Session IP: 192.168.105.42
Co-Pay Settlement Card: 4532 8910 3344 4242 | Backup HSA Card: 5425-2334-3010-9903
Telemetry Device Serial (NON-PII Decoy): 9876-5432-1098-7654 (Pacemaker Firmware v4.2.1)
Lab Specimen Barcode (NON-PII Decoy): 7700-1122-3344-5566 | Reference IP Invalid: 999.12.44.10
`;

export const SAMPLE_SERVER_DUMP = `2026-11-27T11:02:18.442Z ERROR [gateway-checkout-v3] Unhandled PaymentException in node-ap-south-1
trace_id=8841209377410028 span_id=9876-5432-1098-7654 operator=EMP-904112
source_ip=172.24.19.205 forwarded_for=2001:0db8:85a3:0000:0000:8a2e:0370:7334
Authorization Header Leaked: Bearer vv_sec_VelvetVaultDemo99812Token
Request Payload Dump:
  "customerEmail": "secops.lead@finvault.in",
  "callbackPhone": "+1-415-555-0199",
  "indianMobile": "+91 98765 43210",
  "kycPan": "MNOCH3391L",
  "aadhaarUid": "739158246013",
  "upiVpa": "settlement.ops@okhdfcbank",
  "primaryCard": "4532-0151-1283-0366",
  "fallbackCard": "4111111111111111"
Stack Trace: at processSettlement (/srv/vault/checkout.ts:142:19)
`;

export interface SamplePreset {
  id: string;
  label: string;
  badge: string;
  fileName: string | null;
  content: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'support-ticket',
    label: 'Support Ticket Log',
    badge: 'LOG',
    fileName: null,
    content: SAMPLE_NOISY_LOGS,
  },
  {
    id: 'indian-kyc-csv',
    label: 'Indian KYC & Banking CSV',
    badge: 'CSV',
    fileName: 'indian_kyc_sample.csv',
    content: SAMPLE_KYC_CSV,
  },
  {
    id: 'clinical-notes',
    label: 'Clinical Patient Notes',
    badge: 'HIPAA',
    fileName: 'clinical_patient_notes.txt',
    content: SAMPLE_CLINICAL_NOTES,
  },
  {
    id: 'server-dump',
    label: 'Server Error Dump',
    badge: 'DUMP',
    fileName: 'gateway_error_dump.txt',
    content: SAMPLE_SERVER_DUMP,
  },
];
