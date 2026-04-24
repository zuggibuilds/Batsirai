import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Shell, Card } from '../components/common';
import { BookingForm, BookingStatus, CatalogueGrid, CategoryGrid, FilterDrawer, HomeCollage, LocationPicker, NotificationBell, ProviderMap, ProviderResults, ReviewForm, SearchBar, ServicesProvidedPanel } from '../components/marketplace';
import { bookings, categories, providers, Provider } from '../data/mock';
import { api } from '../lib/api';

export const HomePage = () => {
	const prefersReducedMotion = useReducedMotion();
	const easeOutBezier: [number, number, number, number] = [0.16, 1, 0.3, 1];

	const rise = (delay = 0) => ({
		initial: prefersReducedMotion ? false : { opacity: 0, y: 16 },
		animate: prefersReducedMotion ? undefined : { opacity: 1, y: 0 },
		transition: { duration: 0.44, ease: easeOutBezier, delay },
	});

	return (
		<Shell title="Your city. Your help. On demand." subtitle="Discover trusted local professionals across 23 service categories.">
			<motion.div className="hero-band" {...rise(0.02)}>
				<span className="hero-chip">Verified providers only</span>
				<span className="hero-chip">Response within 15 minutes</span>
				<span className="hero-chip">Live booking status</span>
			</motion.div>
			<motion.div className="kpi-grid mt-4" {...rise(0.08)}>
				<div className="kpi-card"><span className="kpi-label">Providers online</span><span className="kpi-value">148</span></div>
				<div className="kpi-card"><span className="kpi-label">Avg first response</span><span className="kpi-value">12 min</span></div>
				<div className="kpi-card"><span className="kpi-label">Completed jobs this week</span><span className="kpi-value">1,204</span></div>
			</motion.div>
			<motion.div {...rise(0.12)}>
				<SearchBar />
			</motion.div>
			<motion.div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start" {...rise(0.16)}>
				<CategoryGrid layout="home" />
				<div className="grid gap-4">
					<HomeCollage />
					<ProviderMap />
					<ServicesProvidedPanel />
				</div>
			</motion.div>
			<motion.div className="mt-6" {...rise(0.22)}>
				<h2 className="font-heading text-xl">Featured providers</h2>
				<div className="mt-3">
					<ProviderResults />
				</div>
			</motion.div>
			<motion.div className="cta-strip mt-6" {...rise(0.28)}>
				<div className="cta-copy">
					<p className="font-heading text-lg">Need someone today?</p>
					<p className="text-sm text-brand-ink/70">Post your request now and receive matched provider offers in minutes.</p>
				</div>
				<Link to="/search" className="ui-btn-secondary">Start with search</Link>
			</motion.div>
		</Shell>
	);
};

export const CategoriesPage = () => (
	<Shell title="All Categories" subtitle="Browse every service type and find specialized providers fast.">
		<AnimatedBlock delay={0.08}>
			<CategoryGrid layout="dense" />
		</AnimatedBlock>
	</Shell>
);

export const CategoryDetailPage = () => {
	const { slug } = useParams();
	const category = categories.find((item) => item.slug === slug);

	return (
		<Shell title={category ? category.name : 'Category'} subtitle="Filter providers by price, rating, and distance.">
			<AnimatedBlock delay={0.04} className="hero-band">
				<span className="hero-chip">Sort by nearest</span>
				<span className="hero-chip">Top rated first</span>
				<span className="hero-chip">Price-friendly options</span>
			</AnimatedBlock>
			<AnimatedBlock delay={0.1}>
				<FilterDrawer category={slug} />
			</AnimatedBlock>
			<AnimatedBlock delay={0.16} className="mt-4">
				<ProviderResults categorySlug={slug} />
			</AnimatedBlock>
		</Shell>
	);
};

export const ProviderPage = () => {
	const { id } = useParams();
	const provider = providers.find((item) => item.id === id) ?? providers[0];

	return (
		<Shell title={provider.name} subtitle={provider.bio}>
			<AnimatedBlock delay={0.04} className="hero-band">
				<span className="hero-chip">{provider.locationAddress}</span>
				<span className="hero-chip">⭐ {provider.rating.toFixed(1)} verified rating</span>
				<span className="hero-chip">{provider.distanceKm.toFixed(1)} km from your area</span>
			</AnimatedBlock>
			<AnimatedBlock delay={0.1} className="flex items-center justify-between gap-3">
				<p className="text-sm text-brand-ink/70">{provider.locationAddress} • ⭐ {provider.rating.toFixed(1)}</p>
				<NotificationBell />
			</AnimatedBlock>
			<AnimatedBlock delay={0.16} className="mt-4">
				<CatalogueGrid items={provider.catalogue} providerId={provider.id} />
			</AnimatedBlock>
		</Shell>
	);
};

export const ProviderBookPage = () => (
	<Shell title="Book Provider" subtitle="Choose a schedule and share job details to create a booking request.">
		<div className="cta-strip mb-4">
			<div className="cta-copy">
				<p className="font-heading text-lg">Before you confirm</p>
				<p className="text-sm text-brand-ink/70">Add details, landmarks, and your ideal time slot to get faster acceptance.</p>
			</div>
			<Link to="/bookings" className="ui-btn-secondary">View my bookings</Link>
		</div>
		<div className="grid gap-4 lg:grid-cols-2">
			<BookingForm />
			<LocationPicker />
		</div>
	</Shell>
);

export const SearchPage = () => {
	const [query] = useSearchParams();
	const q = (query.get('q') ?? '').trim().toLowerCase();
	const results = useMemo(() => {
		if (!q) {
			return providers;
		}
		return providers.filter((provider) => {
			const haystack = `${provider.name} ${provider.bio} ${provider.locationAddress} ${provider.categorySlug}`.toLowerCase();
			return haystack.includes(q);
		});
	}, [q]);

	return (
		<Shell title="Search Results" subtitle={q ? `Results for "${q}"` : 'Try searching by service, provider, or location.'}>
			<div className="hero-band">
				<span className="hero-chip">Tip: include suburb names</span>
				<span className="hero-chip">Filter by rating and budget</span>
				<span className="hero-chip">Open provider profile before booking</span>
			</div>
			<SearchBar initialQuery={q} compact />
			<div className="mt-4 grid gap-3">
				{results.map((provider: Provider) => <Card key={provider.id}><Link to={`/providers/${provider.id}`} className="font-semibold hover:underline">{provider.name}</Link><p className="text-sm text-brand-ink/70">{provider.bio}</p></Card>)}
			</div>
		</Shell>
	);
};

export const BookingsPage = () => {
	const prefersReducedMotion = useReducedMotion();

	return (
		<Shell title="My Bookings" subtitle="Track status updates in real time and leave reviews after completion.">
			<AnimatedBlock delay={0.04} className="cta-strip mb-4">
				<div className="cta-copy">
					<p className="font-heading text-lg">Keep every booking organized</p>
					<p className="text-sm text-brand-ink/70">Use booking details to message providers, reschedule, and close jobs with a review.</p>
				</div>
				<Link className="ui-btn-secondary" to="/search">Book another service</Link>
			</AnimatedBlock>
			<div className="grid gap-3">
				{bookings.map((booking, index) => (
					<motion.div
						key={booking.id}
						initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
						whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.28 }}
						transition={{ duration: 0.38, ease: easeOutBezier, delay: 0.12 + index * 0.06 }}
					>
						<Card>
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="font-semibold">{booking.providerName}</p>
									<p className="text-sm text-brand-ink/70">{booking.serviceName}</p>
								</div>
								<Link className="text-sm font-semibold underline" to={`/bookings/${booking.id}`}>View</Link>
							</div>
						</Card>
					</motion.div>
				))}
			</div>
		</Shell>
	);
};

const easeOutBezier: [number, number, number, number] = [0.16, 1, 0.3, 1];

function AnimatedBlock({
	children,
	className,
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
}) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
			whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.18 }}
			transition={{ duration: 0.44, ease: easeOutBezier, delay }}
		>
			{children}
		</motion.div>
	);
}

export const BookingDetailPage = () => {
	const { id } = useParams();
	return (
		<Shell title="Booking Details" subtitle="Live status and service timeline.">
			<BookingStatus bookingId={id} />
		</Shell>
	);
};

export const BookingReviewPage = () => <Shell title="Leave Review"><ReviewForm /></Shell>;

export const ProfilePage = () => (
	<Shell title="My Profile" subtitle="Manage your contact details, location, and notification preferences.">
		<Card>
			<form className="grid gap-3 md:grid-cols-2">
				<input className="ui-input" placeholder="First name" />
				<input className="ui-input" placeholder="Last name" />
				<input className="ui-input" placeholder="Email" type="email" />
				<input className="ui-input" placeholder="Phone" />
			</form>
			<button className="ui-btn mt-3">Save profile</button>
		</Card>
	</Shell>
);

export const LoginPage = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
	const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({ type: 'idle', message: '' });
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setStatus({ type: 'idle', message: '' });

		try {
			const response = await api.post('/api/auth/login', { email, password });
			const { accessToken, refreshToken } = response.data as { accessToken: string; refreshToken: string };
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
			const resolvedRole = getRoleFromToken(accessToken);
			if (resolvedRole !== selectedRole) {
				setStatus({
					type: 'error',
					message: `This account is registered as ${resolvedRole.toLowerCase()}. Switch role selection or use the matching dashboard.`,
				});
				return;
			}

			setStatus({ type: 'success', message: `Login successful as ${selectedRole.toLowerCase()}.` });
			navigate(getDashboardRouteForRole(selectedRole), { replace: true });
		} catch (error) {
			setStatus({ type: 'error', message: getApiErrorMessage(error, 'Login failed. Please check your credentials.') });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Shell title="Login" subtitle="Sign in as customer or provider.">
			<div className="hero-band mb-4">
				<span className="hero-chip">Secure login</span>
				<span className="hero-chip">Single account for customer + provider</span>
				<span className="hero-chip">Booking updates in real time</span>
			</div>
			<Card>
				<form className="grid gap-3 md:max-w-md" onSubmit={onSubmit}>
					<select className="ui-select" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as 'CUSTOMER' | 'PROVIDER')}>
						<option value="CUSTOMER">Login as Customer</option>
						<option value="PROVIDER">Login as Provider</option>
					</select>
					<input className="ui-input" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
					<input className="ui-input" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
					<button className="ui-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
				</form>
				{status.type !== 'idle' && (
					<p className={`mt-3 text-sm ${status.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{status.message}</p>
				)}
				<p className="mt-3 text-sm text-brand-ink/70">No account yet? <Link to="/auth/register" className="font-semibold text-brand-sea">Create one</Link>.</p>
			</Card>
		</Shell>
	);
};

export const RegisterPage = () => {
	const navigate = useNavigate();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
	const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({ type: 'idle', message: '' });
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setStatus({ type: 'idle', message: '' });

		try {
			await api.post('/api/auth/register', {
				firstName,
				lastName,
				email,
				phone,
				password,
				role,
			});

			const loginResponse = await api.post('/api/auth/login', { email, password });
			const { accessToken, refreshToken } = loginResponse.data as { accessToken: string; refreshToken: string };
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
			setStatus({ type: 'success', message: 'Account created successfully. Redirecting to your dashboard...' });
			setPassword('');
			setTimeout(() => navigate(getDashboardRouteForToken(accessToken), { replace: true }), 450);
		} catch (error) {
			const message = getApiErrorMessage(error, 'Could not create account. Please try again.');
			if (isDuplicateAccountMessage(message)) {
				try {
					const loginResponse = await api.post('/api/auth/login', { email, password });
					const { accessToken, refreshToken } = loginResponse.data as { accessToken: string; refreshToken: string };
					const resolvedRole = getRoleFromToken(accessToken);
					if (resolvedRole !== role) {
						setStatus({
							type: 'error',
							message: `This email already belongs to a ${resolvedRole.toLowerCase()} account. Use a different email for ${role.toLowerCase()} sign up.`,
						});
						return;
					}

					localStorage.setItem('accessToken', accessToken);
					localStorage.setItem('refreshToken', refreshToken);
					setStatus({ type: 'success', message: 'Account already existed. Logged you in successfully.' });
					setTimeout(() => navigate(getDashboardRouteForToken(accessToken), { replace: true }), 450);
					return;
				} catch {
					setStatus({ type: 'error', message: 'That email is already registered. Please use Login or reset your password.' });
					return;
				}
			}

			setStatus({ type: 'error', message });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Shell title="Register" subtitle="Create your Batsirai account in under a minute.">
			<div className="hero-band mb-4">
				<span className="hero-chip">Fast signup</span>
				<span className="hero-chip">Role switch anytime</span>
				<span className="hero-chip">Start booking immediately</span>
			</div>
			<Card>
				<form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
					<input className="ui-input" placeholder="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
					<input className="ui-input" placeholder="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
					<input className="ui-input" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
					<input className="ui-input" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
					<input className="ui-input md:col-span-2" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
					<select className="ui-select md:col-span-2" value={role} onChange={(event) => setRole(event.target.value as 'CUSTOMER' | 'PROVIDER')}>
						<option value="CUSTOMER">Customer</option>
						<option value="PROVIDER">Provider</option>
					</select>
					<button className="ui-btn mt-1 md:col-span-2" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
				</form>
				{status.type !== 'idle' && (
					<p className={`mt-3 text-sm ${status.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{status.message}</p>
				)}
				<p className="mt-3 text-sm text-brand-ink/70">Already registered? <Link to="/auth/login" className="font-semibold text-brand-sea">Login here</Link>.</p>
			</Card>
		</Shell>
	);
};

function getApiErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof AxiosError) {
		const responseMessage = error.response?.data?.message;
		if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
			return responseMessage;
		}
	}

	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return fallback;
}

function getDashboardRouteForToken(token: string): '/dashboard/customer' | '/dashboard/provider' {
	const role = getRoleFromToken(token);
	return getDashboardRouteForRole(role);
}

function getRoleFromToken(token: string): 'CUSTOMER' | 'PROVIDER' {
	try {
		const payloadPart = token.split('.')[1];
		if (!payloadPart) {
			return 'CUSTOMER';
		}

		const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
		const decoded = JSON.parse(atob(padded)) as { role?: string };
		return decoded.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
	} catch {
		return 'CUSTOMER';
	}
}

function getDashboardRouteForRole(role: 'CUSTOMER' | 'PROVIDER'): '/dashboard/customer' | '/dashboard/provider' {
	return role === 'PROVIDER' ? '/dashboard/provider' : '/dashboard/customer';
}

function isDuplicateAccountMessage(message: string): boolean {
	return message.toLowerCase().includes('already exists');
}

export const ForgotPasswordPage = () => (
	<Shell title="Forgot Password" subtitle="Enter your email to receive a reset link.">
		<Card>
			<form className="grid gap-3 md:max-w-md">
				<input className="ui-input" placeholder="Email" type="email" />
				<button className="ui-btn">Send reset link</button>
			</form>
		</Card>
	</Shell>
);

export const DashboardPage = () => {
	const token = localStorage.getItem('accessToken');
	if (!token) {
		return <Navigate to="/auth/login" replace />;
	}

	return <Navigate to={getDashboardRouteForToken(token)} replace />;
};

export const CustomerDashboardPage = () => (
	<Shell title="Customer Dashboard" subtitle="Manage your bookings, discover providers, and track activity.">
		<div className="grid gap-3 md:grid-cols-3">
			<Card><p className="text-sm text-brand-ink/70">Active bookings</p><p className="text-2xl font-bold">3</p></Card>
			<Card><p className="text-sm text-brand-ink/70">Completed this month</p><p className="text-2xl font-bold">11</p></Card>
			<Card><p className="text-sm text-brand-ink/70">Saved providers</p><p className="text-2xl font-bold">7</p></Card>
		</div>
		<div className="mt-4 grid gap-3 md:grid-cols-2">
			<Card>
				<p className="font-semibold">Customer features</p>
				<ul className="mt-2 space-y-2 text-sm text-brand-ink/80">
					<li>Book trusted local services in minutes</li>
					<li>Track booking status and provider updates</li>
					<li>Rate and review completed services</li>
					<li>Manage profile and addresses</li>
				</ul>
			</Card>
			<Card>
				<p className="font-semibold">Quick actions</p>
				<div className="mt-3 flex flex-wrap gap-2">
					<Link className="ui-btn" to="/search">Find services</Link>
					<Link className="ui-btn-secondary" to="/bookings">My bookings</Link>
					<Link className="ui-btn-secondary" to="/profile">My profile</Link>
				</div>
			</Card>
		</div>
	</Shell>
);

export const ProviderDashboardPage = () => (
	<Shell title="Provider Dashboard" subtitle="Track bookings, earnings, and service quality at a glance.">
		<div className="grid gap-3 md:grid-cols-3">
			<Card><p className="text-sm text-brand-ink/70">Bookings Today</p><p className="text-2xl font-bold">8</p></Card>
			<Card><p className="text-sm text-brand-ink/70">This Week Earnings</p><p className="text-2xl font-bold">ZMW 4,250</p></Card>
			<Card><p className="text-sm text-brand-ink/70">Average Rating</p><p className="text-2xl font-bold">4.8</p></Card>
		</div>
		<div className="mt-4 grid gap-3 md:grid-cols-2">
			<Card>
				<p className="font-semibold">Provider features</p>
				<ul className="mt-2 space-y-2 text-sm text-brand-ink/80">
					<li>Create and manage service catalogue listings</li>
					<li>Accept, schedule, and complete incoming bookings</li>
					<li>Monitor earnings and payouts</li>
					<li>Update weekly availability and profile</li>
				</ul>
			</Card>
			<Card>
				<p className="font-semibold">Quick actions</p>
				<div className="mt-3 flex flex-wrap gap-2">
					<Link className="ui-btn" to="/dashboard/catalogue">Manage catalogue</Link>
					<Link className="ui-btn-secondary" to="/dashboard/bookings">Incoming bookings</Link>
					<Link className="ui-btn-secondary" to="/dashboard/earnings">Earnings</Link>
				</div>
			</Card>
		</div>
	</Shell>
);

export const DashboardCataloguePage = () => <Shell title="Manage Catalogue"><CatalogueGrid items={providers[0].catalogue} providerId={providers[0].id} /></Shell>;
export const DashboardCatalogueNewPage = () => <Shell title="Create Catalogue Item"><BookingForm /></Shell>;
export const DashboardCatalogueEditPage = () => <Shell title="Edit Catalogue Item"><BookingForm /></Shell>;
export const DashboardBookingsPage = () => <Shell title="Incoming Bookings"><BookingStatus /></Shell>;
export const DashboardBookingDetailPage = () => <Shell title="Booking Action"><BookingStatus /></Shell>;

export const DashboardEarningsPage = () => (
	<Shell title="Earnings & Payouts">
		<Card>
			<p className="font-semibold">Recent payouts</p>
			<ul className="mt-2 space-y-2 text-sm">
				<li>Apr 10 - ZMW 1,200 - Completed</li>
				<li>Apr 03 - ZMW 980 - Completed</li>
				<li>Mar 28 - ZMW 1,450 - Completed</li>
			</ul>
		</Card>
	</Shell>
);

export const DashboardAvailabilityPage = () => (
	<Shell title="Availability">
		<Card>
			<div className="grid gap-2 md:grid-cols-2">
				{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
					<label key={day} className="flex items-center justify-between rounded-lg border border-brand-ink/10 p-2 text-sm">
						<span>{day}</span>
						<input type="checkbox" defaultChecked={day !== 'Sun'} />
					</label>
				))}
			</div>
		</Card>
	</Shell>
);

export const DashboardProfilePage = () => (
	<Shell title="Provider Profile">
		<Card>
			<form className="grid gap-3 md:grid-cols-2">
				<input className="ui-input" placeholder="Business name" />
				<input className="ui-input" placeholder="Category" />
				<textarea className="ui-textarea md:col-span-2" placeholder="Bio" rows={4} />
			</form>
		</Card>
	</Shell>
);

export const OnboardingPage = () => (
	<Shell title="Provider Onboarding Wizard" subtitle="Complete all steps to submit for admin approval.">
		<Card>
			<ol className="grid gap-2 text-sm">
				<li>1. Personal info</li>
				<li>2. Business info</li>
				<li>3. Document upload</li>
				<li>4. Service area map + radius</li>
				<li>5. Weekly availability</li>
				<li>6. Catalogue with 3+ photos</li>
				<li>7. Review and submit</li>
			</ol>
		</Card>
	</Shell>
);
