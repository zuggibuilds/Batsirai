import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable, Layout, MetricCard, RoleGate, Surface, TableToolbar } from '../components/admin';
import { BookingRecord, DisputeRecord, fetchBookings, fetchDisputes, fetchPayments, fetchProviders, fetchSecuritySnapshot, PaymentRecord, ProviderRecord, SecurityAlertSnapshot } from '../lib/adminData';

const auditRows = [
	['2026-04-19 13:40', 'ADMIN_SUPPORT', 'Updated payout status', 'PAY-4420'],
	['2026-04-19 13:15', 'OPS_MANAGER', 'Approved provider verification', 'PROV-21'],
	['2026-04-19 12:47', 'SUPER_ADMIN', 'Changed dispute SLA setting', 'CFG-07'],
];

export const LoginPage = () => (
	<Layout title="Secure Login" subtitle="Role-based admin access with verification.">
		<Surface>
			<div className="grid gap-2 text-sm text-admin-slate">
				<p>1. Sign in with admin credentials</p>
				<p>2. Confirm TOTP code</p>
				<p>3. Session policy and permission sync</p>
			</div>
		</Surface>
	</Layout>
);

export const DashboardPage = () => {
	const providerRows = useProviderRows();

	return (
		<Layout
			title="Operations Dashboard"
			subtitle="Real-time health across marketplace trust, bookings, and payouts."
			actions={<button className="admin-btn" type="button">Download report</button>}
		>
			<div className="grid gap-4 md:grid-cols-4">
				<MetricCard label="Active bookings" value="128" />
				<MetricCard label="Verified providers" value="57" />
				<MetricCard label="Escrow balance" value="ZMW 42,300" />
				<MetricCard label="Open disputes" value="7" />
			</div>
			<div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
				<Surface>
					<p className="admin-section-title">Provider Compliance Queue</p>
					<div className="mt-3">
						<DataTable columns={['Provider', 'Status', 'Rating', 'Booking load', 'Action']} rows={providerRows.slice(0, 4)} />
					</div>
				</Surface>
				<Surface>
					<p className="admin-section-title">Action Priorities</p>
					<ul className="mt-3 grid gap-2 text-sm text-admin-slate">
						<li>High: Resolve 2 disputes older than 48h</li>
						<li>Medium: Review 4 pending provider KYC submissions</li>
						<li>Low: Confirm payout batch PAY-4420 reconciliation</li>
					</ul>
				</Surface>
			</div>
		</Layout>
	);
};

export const ProvidersPage = () => (
	<ProvidersTablePage />
);

export const ProviderDetailPage = () => (
	<Layout title="Provider Detail" subtitle="KYC documents, quality flags, and moderation history.">
		<Surface>
			<div className="grid gap-3 text-sm text-admin-slate">
				<p>Verification level: Tier 2 (ID + proof of address)</p>
				<p>Last moderation note: Awaiting updated business permit scan</p>
				<p>Fraud checks: No match across duplicate payment instruments</p>
			</div>
		</Surface>
	</Layout>
);

export const CustomersPage = () => (
	<Layout title="Customers" subtitle="Customer account integrity and support status.">
		<Surface>
			<DataTable
				columns={['Customer', 'Bookings', 'Trust score', 'Disputes', 'Action']}
				rows={[
					['Mwanza Chanda', '12', '98', '0', 'View'],
					['Ruth Banda', '7', '91', '1', 'Review'],
					['Felix Ndlovu', '3', '86', '0', 'View'],
				]}
			/>
		</Surface>
	</Layout>
);

export const CustomerDetailPage = () => (
	<Layout title="Customer Detail" subtitle="Profile, behavior flags, and booking history.">
		<Surface>
			<p className="text-sm text-admin-slate">No risk flags. Last 3 bookings were completed without incident.</p>
		</Surface>
	</Layout>
);

export const CataloguePage = () => (
	<Layout title="Catalogue Queue" subtitle="Moderate service images and listing quality.">
		<Surface>
			<DataTable
				columns={['Item', 'Provider', 'Reason', 'Created', 'Action']}
				rows={[
					['Rapid Response Package', 'PipeFix Zambia', 'Awaiting image review', 'Today', 'Approve/Reject'],
					['Deep Clean Bundle', 'CleanWave Home Care', 'Title mismatch', 'Today', 'Edit'],
				]}
			/>
		</Surface>
	</Layout>
);

export const CatalogueItemPage = () => (
	<Layout title="Catalogue Item" subtitle="Moderation detail and correction controls.">
		<Surface>
			<p className="text-sm text-admin-slate">Use approve/reject controls and add a moderation reason for audit compliance.</p>
		</Surface>
	</Layout>
);

export const BookingsPage = () => (
	<BookingsTablePage />
);

export const BookingDetailPage = () => (
	<Layout title="Booking Detail" subtitle="Timeline, payment state, and escalation options.">
		<Surface>
			<div className="grid gap-2 text-sm text-admin-slate">
				<p>Current state: IN_PROGRESS</p>
				<p>Escrow state: Funds held</p>
				<p>Support alerts: None active</p>
			</div>
		</Surface>
	</Layout>
);

export const DisputesPage = () => (
	<DisputesTablePage />
);

export const DisputeDetailPage = () => (
	<Layout title="Dispute Detail" subtitle="Decision notes, mediation events, and payout control.">
		<Surface>
			<p className="text-sm text-admin-slate">Attach evidence references before issuing final settlement decision.</p>
		</Surface>
	</Layout>
);

export const PaymentsPage = () => (
	<PaymentsTablePage />
);

export const PayoutsPage = () => (
	<Layout title="Payouts" subtitle="Provider payout queue and reconciliation status.">
		<Surface>
			<DataTable
				columns={['Batch', 'Providers', 'Total', 'State', 'Action']}
				rows={[
					['PAYOUT-19A', '12', 'ZMW 12,320', 'Ready', 'Release'],
					['PAYOUT-19B', '7', 'ZMW 7,910', 'On hold', 'Review'],
				]}
			/>
		</Surface>
	</Layout>
);

export const ReportsPage = () => (
	<Layout
		title="Reports"
		subtitle="Compliance, growth, and operational analytics exports."
		actions={<button className="admin-btn" type="button">Export CSV</button>}
	>
		<Surface>
			<p className="text-sm text-admin-slate">Generate weekly KPI, settlement, and risk reports for leadership and compliance.</p>
		</Surface>
	</Layout>
);

export const SettingsPage = () => (
	<Layout title="Settings" subtitle="Platform control flags, SLA, and policy toggles.">
		<Surface>
			<div className="grid gap-3 text-sm text-admin-slate">
				<p>Dispute SLA: 48h</p>
				<p>Provider auto-approval: Disabled</p>
				<p>High-value payout manual review threshold: ZMW 3,000</p>
			</div>
		</Surface>
	</Layout>
);

export const SecurityPage = () => {
	const [snapshot, setSnapshot] = useState<SecurityAlertSnapshot>({
		page: 1,
		limit: 100,
		hasMoreLockouts: false,
		hasMoreFailedCounters: false,
		activeLockouts: [],
		failedCounters: [],
	});
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const refreshSnapshot = async (nextPage = page) => {
		setIsRefreshing(true);
		try {
			const result = await fetchSecuritySnapshot(nextPage, 100);
			setSnapshot(result);
		} finally {
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		let mounted = true;
		void (async () => {
			const result = await fetchSecuritySnapshot(page, 100);
			if (mounted) setSnapshot(result);
		})();

		const interval = setInterval(() => {
			void (async () => {
				const result = await fetchSecuritySnapshot(page, 100);
				if (mounted) setSnapshot(result);
			})();
		}, 15000);

		return () => {
			mounted = false;
			clearInterval(interval);
		};
	}, [page]);

	const lockoutRows = useMemo(
		() => snapshot.activeLockouts
			.filter((item) => item.key.toLowerCase().includes(search.toLowerCase()))
			.map((item) => [item.key, `${item.ttlSec}s`, item.ttlSec > 300 ? 'High' : 'Medium']),
		[snapshot, search],
	);

	const counterRows = useMemo(
		() => snapshot.failedCounters
			.filter((item) => item.key.toLowerCase().includes(search.toLowerCase()))
			.map((item) => [item.key, String(item.count), item.count >= 10 ? 'Escalate' : 'Observe']),
		[snapshot, search],
	);

	return (
		<Layout
			title="Security"
			subtitle="Real-time lockouts and failed security counters."
			actions={
				<div className="flex items-center gap-2">
					<button className="admin-btn" type="button" onClick={() => void refreshSnapshot()} disabled={isRefreshing}>
						{isRefreshing ? 'Refreshing...' : 'Refresh now'}
					</button>
					<button className="admin-btn" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isRefreshing}>
						Prev
					</button>
					<button
						className="admin-btn"
						type="button"
						onClick={() => setPage((p) => p + 1)}
						disabled={(!snapshot.hasMoreLockouts && !snapshot.hasMoreFailedCounters) || isRefreshing}
					>
						Next
					</button>
				</div>
			}
		>
			<div className="grid gap-4 md:grid-cols-3">
				<MetricCard label="Active lockouts" value={snapshot.activeLockouts.length} />
				<MetricCard label="Tracked counters" value={snapshot.failedCounters.length} />
				<MetricCard label="Escalated counters" value={snapshot.failedCounters.filter((x) => x.count >= 10).length} />
			</div>
			<p className="mt-3 text-xs text-admin-slate">Page {snapshot.page || page} • Auto-refresh every 15 seconds</p>
			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<Surface>
					<TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Filter by key" />
					<div className="mt-3">
						<DataTable columns={['Lock key', 'TTL', 'Risk']} rows={lockoutRows} />
					</div>
				</Surface>
				<Surface>
					<p className="admin-section-title">Failed Counters</p>
					<div className="mt-3">
						<DataTable columns={['Counter key', 'Count', 'Action']} rows={counterRows} />
					</div>
				</Surface>
			</div>
		</Layout>
	);
};

export const AdminsPage = () => (
	<Layout title="Admin Accounts" subtitle="Role assignment and access policy.">
		<RoleGate role={['SUPER_ADMIN']}>
			<Surface>
				<p className="text-sm text-admin-slate">Manage admin accounts, permissions, and session policies.</p>
			</Surface>
		</RoleGate>
		<RoleGate role={['OPS_MANAGER', 'SUPPORT']}>
			<Surface>
				<p className="text-sm text-admin-slate">You have read-only access to admin account information.</p>
			</Surface>
		</RoleGate>
	</Layout>
);

export const AuditLogPage = () => (
	<Layout title="Audit Log" subtitle="Immutable activity trail for every critical action.">
		<Surface>
			<DataTable columns={['Timestamp', 'Actor', 'Action', 'Reference']} rows={auditRows} />
		</Surface>
		<div className="mt-4 text-sm text-admin-slate">
			Need deeper history? <Link to="/reports" className="font-semibold underline">Go to reports exports</Link>.
		</div>
	</Layout>
);

function ProvidersTablePage() {
	const providers = useProviderRecords();
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('ALL');

	const statuses = useMemo(() => Array.from(new Set(providers.map((item) => item.status))), [providers]);

	const rows = useMemo(
		() => providers
			.filter((item) => status === 'ALL' || item.status === status)
			.filter((item) => `${item.name} ${item.status} ${item.bookingLoad}`.toLowerCase().includes(search.toLowerCase()))
			.map((item) => [item.name, item.status, item.rating, item.bookingLoad, item.action]),
		[providers, search, status],
	);

	return (
		<Layout title="Providers" subtitle="Verify, moderate, and manage service provider quality.">
			<Surface>
				<TableToolbar
					search={search}
					onSearchChange={setSearch}
					status={status}
					onStatusChange={setStatus}
					statusOptions={statuses}
					searchPlaceholder="Search providers"
				/>
				<DataTable columns={['Provider', 'Status', 'Rating', 'Booking load', 'Action']} rows={rows} />
			</Surface>
		</Layout>
	);
}

function BookingsTablePage() {
	const bookings = useBookingRecords();
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('ALL');

	const statuses = useMemo(() => Array.from(new Set(bookings.map((item) => item.status))), [bookings]);

	const rows = useMemo(
		() => bookings
			.filter((item) => status === 'ALL' || item.status === status)
			.filter((item) => `${item.bookingId} ${item.provider} ${item.location}`.toLowerCase().includes(search.toLowerCase()))
			.map((item) => [item.bookingId, item.provider, item.status, item.location, item.action]),
		[bookings, search, status],
	);

	return (
		<Layout title="Bookings" subtitle="Live booking lifecycle and intervention controls.">
			<Surface>
				<TableToolbar
					search={search}
					onSearchChange={setSearch}
					status={status}
					onStatusChange={setStatus}
					statusOptions={statuses}
					searchPlaceholder="Search bookings"
				/>
				<DataTable columns={['Booking', 'Provider', 'Status', 'Location', 'Action']} rows={rows} />
			</Surface>
		</Layout>
	);
}

function DisputesTablePage() {
	const disputes = useDisputeRecords();
	const [search, setSearch] = useState('');

	const rows = useMemo(
		() => disputes
			.filter((item) => `${item.caseId} ${item.parties} ${item.status}`.toLowerCase().includes(search.toLowerCase()))
			.map((item) => [item.caseId, item.age, item.parties, item.status, item.action]),
		[disputes, search],
	);

	return (
		<Layout title="Disputes" subtitle="Case routing, evidence review, and settlement actions.">
			<Surface>
				<TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search disputes" />
				<DataTable columns={['Case', 'Age', 'Parties', 'Status', 'Action']} rows={rows} />
			</Surface>
		</Layout>
	);
}

function PaymentsTablePage() {
	const payments = usePaymentRecords();
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('ALL');

	const statuses = useMemo(() => Array.from(new Set(payments.map((item) => item.status))), [payments]);

	const rows = useMemo(
		() => payments
			.filter((item) => status === 'ALL' || item.status === status)
			.filter((item) => `${item.paymentId} ${item.amount} ${item.method}`.toLowerCase().includes(search.toLowerCase()))
			.map((item) => [item.paymentId, item.amount, item.method, item.status, item.action]),
		[payments, search, status],
	);

	return (
		<Layout title="Payments" subtitle="Transaction monitoring and settlement integrity.">
			<Surface>
				<TableToolbar
					search={search}
					onSearchChange={setSearch}
					status={status}
					onStatusChange={setStatus}
					statusOptions={statuses}
					searchPlaceholder="Search payments"
				/>
				<DataTable columns={['Payment', 'Amount', 'Method', 'Status', 'Action']} rows={rows} />
			</Surface>
		</Layout>
	);
}

function useProviderRecords() {
	const [providers, setProviders] = useState<ProviderRecord[]>([]);

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
	const [bookings, setBookings] = useState<BookingRecord[]>([]);

	useEffect(() => {
		fetchBookings().then(setBookings);
	}, []);

	return bookings;
}

function useDisputeRecords() {
	const [disputes, setDisputes] = useState<DisputeRecord[]>([]);

	useEffect(() => {
		fetchDisputes().then(setDisputes);
	}, []);

	return disputes;
}

function usePaymentRecords() {
	const [payments, setPayments] = useState<PaymentRecord[]>([]);

	useEffect(() => {
		fetchPayments().then(setPayments);
	}, []);

	return payments;
}
