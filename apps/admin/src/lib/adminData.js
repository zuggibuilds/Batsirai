import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
    timeout: 3500,
});
const fallbackProviders = [
    { name: 'Lusaka Spark Electric', status: 'Verified', rating: '4.8', bookingLoad: '2 open bookings', action: 'Review' },
    { name: 'PipeFix Zambia', status: 'Pending docs', rating: '4.6', bookingLoad: '1 open booking', action: 'Moderate' },
    { name: 'CleanWave Home Care', status: 'Verified', rating: '4.7', bookingLoad: '3 open bookings', action: 'Review' },
    { name: 'TutorCircle Zambia', status: 'Flagged', rating: '4.9', bookingLoad: '0 open bookings', action: 'Investigate' },
];
const fallbackBookings = [
    { bookingId: '#BK-1001', provider: 'PipeFix Zambia', status: 'IN_PROGRESS', location: 'Ibex Hill, Lusaka', action: 'Open' },
    { bookingId: '#BK-1002', provider: 'Lusaka Spark Electric', status: 'PENDING', location: 'Leopards Hill, Lusaka', action: 'Review' },
    { bookingId: '#BK-1003', provider: 'CleanWave Home Care', status: 'COMPLETED', location: 'Mass Media, Lusaka', action: 'Closed' },
];
const fallbackDisputes = [
    { caseId: 'DSP-210', age: '36h', parties: 'Customer vs Provider', status: 'Evidence pending', action: 'Open' },
    { caseId: 'DSP-211', age: '20h', parties: 'Customer vs Provider', status: 'Mediation', action: 'Open' },
];
const fallbackPayments = [
    { paymentId: 'PAY-4420', amount: 'ZMW 820', method: 'Card', status: 'Captured', action: 'View' },
    { paymentId: 'PAY-4421', amount: 'ZMW 540', method: 'Mobile Money', status: 'Pending', action: 'Trace' },
];
export async function fetchProviders() {
    try {
        const response = await api.get('/api/admin/providers');
        return response.data;
    }
    catch {
        return fallbackProviders;
    }
}
export async function fetchBookings() {
    try {
        const response = await api.get('/api/admin/bookings');
        return response.data;
    }
    catch {
        return fallbackBookings;
    }
}
export async function fetchDisputes() {
    try {
        const response = await api.get('/api/admin/disputes');
        return response.data;
    }
    catch {
        return fallbackDisputes;
    }
}
export async function fetchPayments() {
    try {
        const response = await api.get('/api/admin/payments');
        return response.data;
    }
    catch {
        return fallbackPayments;
    }
}
