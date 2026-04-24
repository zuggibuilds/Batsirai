import axios from 'axios';

export type ProviderRecord = {
  name: string;
  status: string;
  rating: string;
  bookingLoad: string;
  action: string;
};

export type BookingRecord = {
  bookingId: string;
  provider: string;
  status: string;
  location: string;
  action: string;
};

export type DisputeRecord = {
  caseId: string;
  age: string;
  parties: string;
  status: string;
  action: string;
};

export type PaymentRecord = {
  paymentId: string;
  amount: string;
  method: string;
  status: string;
  action: string;
};

export type SecurityAlertSnapshot = {
  page: number;
  limit: number;
  hasMoreLockouts: boolean;
  hasMoreFailedCounters: boolean;
  activeLockouts: Array<{ key: string; ttlSec: number }>;
  failedCounters: Array<{ key: string; count: number }>;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  timeout: 3500,
});

const fallbackProviders: ProviderRecord[] = [
  { name: 'Lusaka Spark Electric', status: 'Verified', rating: '4.8', bookingLoad: '2 open bookings', action: 'Review' },
  { name: 'PipeFix Zambia', status: 'Pending docs', rating: '4.6', bookingLoad: '1 open booking', action: 'Moderate' },
  { name: 'CleanWave Home Care', status: 'Verified', rating: '4.7', bookingLoad: '3 open bookings', action: 'Review' },
  { name: 'TutorCircle Zambia', status: 'Flagged', rating: '4.9', bookingLoad: '0 open bookings', action: 'Investigate' },
];

const fallbackBookings: BookingRecord[] = [
  { bookingId: '#BK-1001', provider: 'PipeFix Zambia', status: 'IN_PROGRESS', location: 'Ibex Hill, Lusaka', action: 'Open' },
  { bookingId: '#BK-1002', provider: 'Lusaka Spark Electric', status: 'PENDING', location: 'Leopards Hill, Lusaka', action: 'Review' },
  { bookingId: '#BK-1003', provider: 'CleanWave Home Care', status: 'COMPLETED', location: 'Mass Media, Lusaka', action: 'Closed' },
];

const fallbackDisputes: DisputeRecord[] = [
  { caseId: 'DSP-210', age: '36h', parties: 'Customer vs Provider', status: 'Evidence pending', action: 'Open' },
  { caseId: 'DSP-211', age: '20h', parties: 'Customer vs Provider', status: 'Mediation', action: 'Open' },
];

const fallbackPayments: PaymentRecord[] = [
  { paymentId: 'PAY-4420', amount: 'ZMW 820', method: 'Card', status: 'Captured', action: 'View' },
  { paymentId: 'PAY-4421', amount: 'ZMW 540', method: 'Mobile Money', status: 'Pending', action: 'Trace' },
];

const fallbackSecuritySnapshot: SecurityAlertSnapshot = {
  page: 1,
  limit: 100,
  hasMoreLockouts: false,
  hasMoreFailedCounters: false,
  activeLockouts: [
    { key: 'security:lock:admin-login:op***@example.com|127.0.x.x', ttlSec: 420 },
    { key: 'security:lock:user-login:us***@example.com|127.0.x.x', ttlSec: 260 },
  ],
  failedCounters: [
    { key: 'security:failed:flutterwave-webhook-signature:127.0.x.x', count: 8 },
    { key: 'security:failed:admin-totp-verify:ad***-1', count: 3 },
  ],
};

export async function fetchProviders(): Promise<ProviderRecord[]> {
  try {
    const response = await api.get('/api/admin/providers');
    return response.data;
  } catch {
    return fallbackProviders;
  }
}

export async function fetchBookings(): Promise<BookingRecord[]> {
  try {
    const response = await api.get('/api/admin/bookings');
    return response.data;
  } catch {
    return fallbackBookings;
  }
}

export async function fetchDisputes(): Promise<DisputeRecord[]> {
  try {
    const response = await api.get('/api/admin/disputes');
    return response.data;
  } catch {
    return fallbackDisputes;
  }
}

export async function fetchPayments(): Promise<PaymentRecord[]> {
  try {
    const response = await api.get('/api/admin/payments');
    return response.data;
  } catch {
    return fallbackPayments;
  }
}

export async function fetchSecuritySnapshot(page = 1, limit = 100): Promise<SecurityAlertSnapshot> {
  try {
    const response = await api.get('/api/admin/security/alerts', { params: { page, limit } });
    return response.data;
  } catch {
    return fallbackSecuritySnapshot;
  }
}
