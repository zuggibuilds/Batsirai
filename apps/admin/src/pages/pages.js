import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable, Layout, MetricCard, RoleGate, Surface, TableToolbar } from '../components/admin';
import { fetchBookings, fetchDisputes, fetchPayments, fetchProviders } from '../lib/adminData';
const auditRows = [
    ['2026-04-19 13:40', 'ADMIN_SUPPORT', 'Updated payout status', 'PAY-4420'],
    ['2026-04-19 13:15', 'OPS_MANAGER', 'Approved provider verification', 'PROV-21'],
    ['2026-04-19 12:47', 'SUPER_ADMIN', 'Changed dispute SLA setting', 'CFG-07'],
];
export const LoginPage = () => (_jsx(Layout, { title: "Secure Login", subtitle: "Role-based admin access with verification.", children: _jsx(Surface, { children: _jsxs("div", { className: "grid gap-2 text-sm text-admin-slate", children: [_jsx("p", { children: "1. Sign in with admin credentials" }), _jsx("p", { children: "2. Confirm TOTP code" }), _jsx("p", { children: "3. Session policy and permission sync" })] }) }) }));
export const DashboardPage = () => {
    const providerRows = useProviderRows();
    return (_jsxs(Layout, { title: "Operations Dashboard", subtitle: "Real-time health across marketplace trust, bookings, and payouts.", actions: _jsx("button", { className: "admin-btn", type: "button", children: "Download report" }), children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [_jsx(MetricCard, { label: "Active bookings", value: "128" }), _jsx(MetricCard, { label: "Verified providers", value: "57" }), _jsx(MetricCard, { label: "Escrow balance", value: "ZMW 42,300" }), _jsx(MetricCard, { label: "Open disputes", value: "7" })] }), _jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]", children: [_jsxs(Surface, { children: [_jsx("p", { className: "admin-section-title", children: "Provider Compliance Queue" }), _jsx("div", { className: "mt-3", children: _jsx(DataTable, { columns: ['Provider', 'Status', 'Rating', 'Booking load', 'Action'], rows: providerRows.slice(0, 4) }) })] }), _jsxs(Surface, { children: [_jsx("p", { className: "admin-section-title", children: "Action Priorities" }), _jsxs("ul", { className: "mt-3 grid gap-2 text-sm text-admin-slate", children: [_jsx("li", { children: "High: Resolve 2 disputes older than 48h" }), _jsx("li", { children: "Medium: Review 4 pending provider KYC submissions" }), _jsx("li", { children: "Low: Confirm payout batch PAY-4420 reconciliation" })] })] })] })] }));
};
export const ProvidersPage = () => (_jsx(ProvidersTablePage, {}));
export const ProviderDetailPage = () => (_jsx(Layout, { title: "Provider Detail", subtitle: "KYC documents, quality flags, and moderation history.", children: _jsx(Surface, { children: _jsxs("div", { className: "grid gap-3 text-sm text-admin-slate", children: [_jsx("p", { children: "Verification level: Tier 2 (ID + proof of address)" }), _jsx("p", { children: "Last moderation note: Awaiting updated business permit scan" }), _jsx("p", { children: "Fraud checks: No match across duplicate payment instruments" })] }) }) }));
export const CustomersPage = () => (_jsx(Layout, { title: "Customers", subtitle: "Customer account integrity and support status.", children: _jsx(Surface, { children: _jsx(DataTable, { columns: ['Customer', 'Bookings', 'Trust score', 'Disputes', 'Action'], rows: [
                ['Mwanza Chanda', '12', '98', '0', 'View'],
                ['Ruth Banda', '7', '91', '1', 'Review'],
                ['Felix Ndlovu', '3', '86', '0', 'View'],
            ] }) }) }));
export const CustomerDetailPage = () => (_jsx(Layout, { title: "Customer Detail", subtitle: "Profile, behavior flags, and booking history.", children: _jsx(Surface, { children: _jsx("p", { className: "text-sm text-admin-slate", children: "No risk flags. Last 3 bookings were completed without incident." }) }) }));
export const CataloguePage = () => (_jsx(Layout, { title: "Catalogue Queue", subtitle: "Moderate service images and listing quality.", children: _jsx(Surface, { children: _jsx(DataTable, { columns: ['Item', 'Provider', 'Reason', 'Created', 'Action'], rows: [
                ['Rapid Response Package', 'PipeFix Zambia', 'Awaiting image review', 'Today', 'Approve/Reject'],
                ['Deep Clean Bundle', 'CleanWave Home Care', 'Title mismatch', 'Today', 'Edit'],
            ] }) }) }));
export const CatalogueItemPage = () => (_jsx(Layout, { title: "Catalogue Item", subtitle: "Moderation detail and correction controls.", children: _jsx(Surface, { children: _jsx("p", { className: "text-sm text-admin-slate", children: "Use approve/reject controls and add a moderation reason for audit compliance." }) }) }));
export const BookingsPage = () => (_jsx(BookingsTablePage, {}));
export const BookingDetailPage = () => (_jsx(Layout, { title: "Booking Detail", subtitle: "Timeline, payment state, and escalation options.", children: _jsx(Surface, { children: _jsxs("div", { className: "grid gap-2 text-sm text-admin-slate", children: [_jsx("p", { children: "Current state: IN_PROGRESS" }), _jsx("p", { children: "Escrow state: Funds held" }), _jsx("p", { children: "Support alerts: None active" })] }) }) }));
export const DisputesPage = () => (_jsx(DisputesTablePage, {}));
export const DisputeDetailPage = () => (_jsx(Layout, { title: "Dispute Detail", subtitle: "Decision notes, mediation events, and payout control.", children: _jsx(Surface, { children: _jsx("p", { className: "text-sm text-admin-slate", children: "Attach evidence references before issuing final settlement decision." }) }) }));
export const PaymentsPage = () => (_jsx(PaymentsTablePage, {}));
export const PayoutsPage = () => (_jsx(Layout, { title: "Payouts", subtitle: "Provider payout queue and reconciliation status.", children: _jsx(Surface, { children: _jsx(DataTable, { columns: ['Batch', 'Providers', 'Total', 'State', 'Action'], rows: [
                ['PAYOUT-19A', '12', 'ZMW 12,320', 'Ready', 'Release'],
                ['PAYOUT-19B', '7', 'ZMW 7,910', 'On hold', 'Review'],
            ] }) }) }));
export const ReportsPage = () => (_jsx(Layout, { title: "Reports", subtitle: "Compliance, growth, and operational analytics exports.", actions: _jsx("button", { className: "admin-btn", type: "button", children: "Export CSV" }), children: _jsx(Surface, { children: _jsx("p", { className: "text-sm text-admin-slate", children: "Generate weekly KPI, settlement, and risk reports for leadership and compliance." }) }) }));
export const SettingsPage = () => (_jsx(Layout, { title: "Settings", subtitle: "Platform control flags, SLA, and policy toggles.", children: _jsx(Surface, { children: _jsxs("div", { className: "grid gap-3 text-sm text-admin-slate", children: [_jsx("p", { children: "Dispute SLA: 48h" }), _jsx("p", { children: "Provider auto-approval: Disabled" }), _jsx("p", { children: "High-value payout manual review threshold: ZMW 3,000" })] }) }) }));
export const AdminsPage = () => (_jsxs(Layout, { title: "Admin Accounts", subtitle: "Role assignment and access policy.", children: [_jsx(RoleGate, { role: ['SUPER_ADMIN'], children: _jsx(Surface, { children: _jsx("p", { className: "text-sm text-admin-slate", children: "Manage admin accounts, permissions, and session policies." }) }) }), _jsx(RoleGate, { role: ['OPS_MANAGER', 'SUPPORT'], children: _jsx(Surface, { children: _jsx("p", { className: "text-sm text-admin-slate", children: "You have read-only access to admin account information." }) }) })] }));
export const AuditLogPage = () => (_jsxs(Layout, { title: "Audit Log", subtitle: "Immutable activity trail for every critical action.", children: [_jsx(Surface, { children: _jsx(DataTable, { columns: ['Timestamp', 'Actor', 'Action', 'Reference'], rows: auditRows }) }), _jsxs("div", { className: "mt-4 text-sm text-admin-slate", children: ["Need deeper history? ", _jsx(Link, { to: "/reports", className: "font-semibold underline", children: "Go to reports exports" }), "."] })] }));
function ProvidersTablePage() {
    const providers = useProviderRecords();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const statuses = useMemo(() => Array.from(new Set(providers.map((item) => item.status))), [providers]);
    const rows = useMemo(() => providers
        .filter((item) => status === 'ALL' || item.status === status)
        .filter((item) => `${item.name} ${item.status} ${item.bookingLoad}`.toLowerCase().includes(search.toLowerCase()))
        .map((item) => [item.name, item.status, item.rating, item.bookingLoad, item.action]), [providers, search, status]);
    return (_jsx(Layout, { title: "Providers", subtitle: "Verify, moderate, and manage service provider quality.", children: _jsxs(Surface, { children: [_jsx(TableToolbar, { search: search, onSearchChange: setSearch, status: status, onStatusChange: setStatus, statusOptions: statuses, searchPlaceholder: "Search providers" }), _jsx(DataTable, { columns: ['Provider', 'Status', 'Rating', 'Booking load', 'Action'], rows: rows })] }) }));
}
function BookingsTablePage() {
    const bookings = useBookingRecords();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const statuses = useMemo(() => Array.from(new Set(bookings.map((item) => item.status))), [bookings]);
    const rows = useMemo(() => bookings
        .filter((item) => status === 'ALL' || item.status === status)
        .filter((item) => `${item.bookingId} ${item.provider} ${item.location}`.toLowerCase().includes(search.toLowerCase()))
        .map((item) => [item.bookingId, item.provider, item.status, item.location, item.action]), [bookings, search, status]);
    return (_jsx(Layout, { title: "Bookings", subtitle: "Live booking lifecycle and intervention controls.", children: _jsxs(Surface, { children: [_jsx(TableToolbar, { search: search, onSearchChange: setSearch, status: status, onStatusChange: setStatus, statusOptions: statuses, searchPlaceholder: "Search bookings" }), _jsx(DataTable, { columns: ['Booking', 'Provider', 'Status', 'Location', 'Action'], rows: rows })] }) }));
}
function DisputesTablePage() {
    const disputes = useDisputeRecords();
    const [search, setSearch] = useState('');
    const rows = useMemo(() => disputes
        .filter((item) => `${item.caseId} ${item.parties} ${item.status}`.toLowerCase().includes(search.toLowerCase()))
        .map((item) => [item.caseId, item.age, item.parties, item.status, item.action]), [disputes, search]);
    return (_jsx(Layout, { title: "Disputes", subtitle: "Case routing, evidence review, and settlement actions.", children: _jsxs(Surface, { children: [_jsx(TableToolbar, { search: search, onSearchChange: setSearch, searchPlaceholder: "Search disputes" }), _jsx(DataTable, { columns: ['Case', 'Age', 'Parties', 'Status', 'Action'], rows: rows })] }) }));
}
function PaymentsTablePage() {
    const payments = usePaymentRecords();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const statuses = useMemo(() => Array.from(new Set(payments.map((item) => item.status))), [payments]);
    const rows = useMemo(() => payments
        .filter((item) => status === 'ALL' || item.status === status)
        .filter((item) => `${item.paymentId} ${item.amount} ${item.method}`.toLowerCase().includes(search.toLowerCase()))
        .map((item) => [item.paymentId, item.amount, item.method, item.status, item.action]), [payments, search, status]);
    return (_jsx(Layout, { title: "Payments", subtitle: "Transaction monitoring and settlement integrity.", children: _jsxs(Surface, { children: [_jsx(TableToolbar, { search: search, onSearchChange: setSearch, status: status, onStatusChange: setStatus, statusOptions: statuses, searchPlaceholder: "Search payments" }), _jsx(DataTable, { columns: ['Payment', 'Amount', 'Method', 'Status', 'Action'], rows: rows })] }) }));
}
function useProviderRecords() {
    const [providers, setProviders] = useState([]);
    useEffect(() => {
        fetchProviders().then(setProviders);
    }, []);
    return providers;
}
function useProviderRows() {
    const providers = useProviderRecords();
    return providers.map((item) => [item.name, item.status, item.rating, item.bookingLoad, item.action]);
}
function useBookingRecords() {
    const [bookings, setBookings] = useState([]);
    useEffect(() => {
        fetchBookings().then(setBookings);
    }, []);
    return bookings;
}
function useDisputeRecords() {
    const [disputes, setDisputes] = useState([]);
    useEffect(() => {
        fetchDisputes().then(setDisputes);
    }, []);
    return disputes;
}
function usePaymentRecords() {
    const [payments, setPayments] = useState([]);
    useEffect(() => {
        fetchPayments().then(setPayments);
    }, []);
    return payments;
}
