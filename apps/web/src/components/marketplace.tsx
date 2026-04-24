import { FormEvent, useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from './common';
import { bookings, Booking, categories, CatalogueItem, Provider, providers } from '../data/mock';
import { useRealtimeBooking } from '../hooks/useRealtimeBooking';

declare global {
	interface Window {
		gm_authFailure?: () => void;
	}
}

const LUSAKA_CENTER = { lat: -15.3875, lng: 28.3228 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

export function SearchBar({ initialQuery = '', compact = false }: { initialQuery?: string; compact?: boolean }) {
	const [q, setQ] = useState(initialQuery);
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.form
			className={`search-wrap search-wrap-animated ${compact ? 'search-wrap-compact' : ''}`}
			action="/search"
			method="GET"
			initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
			animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
			transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
		>
			<input
				name="q"
				value={q}
				onChange={(event) => setQ(event.target.value)}
				className="ui-input"
				placeholder="Search providers, services, or location"
			/>
			<button className="ui-btn" type="submit">Find help</button>
		</motion.form>
	);
}

export function CategoryGrid({ layout = 'home' }: { layout?: 'home' | 'dense' }) {
	const gridClass =
		layout === 'dense'
			? 'stagger-grid grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
			: 'stagger-grid grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';

	return (
		<div className={gridClass}>
			{categories.map((category, index) => (
				<Link key={category.id} to={`/categories/${category.slug}`}>
					<Card>
						<div className="service-card-shell">
							<span
								className="service-icon service-icon-lively"
								style={{
									background: `${category.colorHex}22`,
									animationDelay: `${(index % 6) * 120}ms`,
								}}
							>
								{category.icon}
							</span>
							<h3 className="service-title-clean" style={{ wordBreak: 'keep-all' }}>{category.name}</h3>
							<p className="service-subtitle">Explore providers</p>
						</div>
					</Card>
				</Link>
			))}
		</div>
	);
}

const collageShots = [
	{ src: '/collage/img-04.jpg', label: 'Plumbing', tint: '#088395', tone: 'core' },
	{ src: '/collage/img-05.jpg', label: 'Cleaning', tint: '#05BFDB', tone: 'warm' },
	{ src: '/collage/img-25.jpg', label: 'Gardening', tint: '#00C9A7', tone: 'fresh' },
	{ src: '/collage/img-17.jpg', label: 'Hairdressing', tint: '#FF8066', tone: 'warm' },
	{ src: '/collage/img-26.jpg', label: 'Driving', tint: '#0081CF', tone: 'core' },
	{ src: '/collage/img-22.jpg', label: 'Photography', tint: '#2F4B7C', tone: 'deep' },
	{ src: '/collage/img-09.jpg', label: 'Laundry', tint: '#45B7D1', tone: 'fresh' },
	{ src: '/collage/img-14.jpg', label: 'Repairs', tint: '#FFB347', tone: 'warm' },
	{ src: '/collage/img-18.jpg', label: 'Painting', tint: '#7D4E9E', tone: 'deep' },
	{ src: '/collage/img-28.jpg', label: 'Moving', tint: '#00A896', tone: 'core' },
] as const;

const categoryImageBySlug: Record<string, string> = {
	electrical: '/collage/img-13.jpg',
	plumbing: '/collage/img-04.jpg',
	cleaning: '/collage/img-05.jpg',
	carpentry: '/collage/img-14.jpg',
	painting: '/collage/img-18.jpg',
	gardening: '/collage/img-25.jpg',
	driving: '/collage/img-26.jpg',
	tutoring: '/collage/img-11.jpg',
	beauty: '/collage/img-17.jpg',
	hairdressing: '/collage/img-07.jpg',
	masonry: '/collage/img-06.jpg',
	welding: '/collage/img-12.jpg',
	mechanics: '/collage/img-15.jpg',
	'appliance-repair': '/collage/img-16.jpg',
	moving: '/collage/img-28.jpg',
	catering: '/collage/img-10.jpg',
	photography: '/collage/img-22.jpg',
	videography: '/collage/img-24.jpg',
	laundry: '/collage/img-09.jpg',
	security: '/collage/img-27.jpg',
	'it-support': '/collage/img-19.jpg',
	'event-planning': '/collage/img-20.jpg',
	childcare: '/collage/img-23.jpg',
};

const servicePanelFallbackImages = [
	'/collage/img-01.jpg',
	'/collage/img-02.jpg',
	'/collage/img-03.jpg',
	'/collage/img-08.jpg',
	'/collage/img-21.jpg',
];

export function HomeCollage() {
	return (
		<Card>
			<div className="collage-head">
				<div>
					<p className="map-panel-title">Services In Action</p>
					<p className="map-panel-subtitle">Real moments from everyday providers on Batsirai</p>
				</div>
				<Link to="/categories" className="ui-btn-secondary">Browse Services</Link>
			</div>
			<div className="service-collage service-collage-layered">
				{collageShots.map((shot, index) => (
					<figure
						key={shot.src}
						className={`collage-tile collage-tile-${index + 1} collage-tone-${shot.tone}`}
						style={{
							['--tile-accent' as string]: shot.tint,
							['--tile-rotate' as string]: `${((index % 5) - 2) * 1.6}deg`,
							['--tile-depth' as string]: `${12 + (index % 4) * 4}px`,
						}}
					>
						<img src={shot.src} alt={`${shot.label} service`} loading="lazy" />
						<figcaption>{shot.label}</figcaption>
					</figure>
				))}
			</div>
		</Card>
	);
}

export function ProviderCard({ provider }: { provider: Provider }) {
	return (
		<Card>
			<div className="flex gap-3">
				<img className="h-16 w-16 rounded-xl object-cover" src={provider.avatarUrl} alt={provider.name} />
				<div className="flex-1">
					<Link to={`/providers/${provider.id}`} className="font-semibold hover:underline">{provider.name}</Link>
					<p className="text-sm text-brand-ink/70">{provider.bio}</p>
					<div className="mt-2 flex flex-wrap gap-2 text-xs">
						<span className="ui-tag">⭐ {provider.rating.toFixed(1)}</span>
						<span className="ui-tag">{provider.distanceKm.toFixed(1)} km</span>
						<span className="ui-tag">from ZMW {provider.priceFrom}</span>
					</div>
				</div>
			</div>
		</Card>
	);
}

export function ProviderMap() {
	const rawApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const apiKey = rawApiKey?.replace(/^Alza/, 'AIza');
	const [authFailed, setAuthFailed] = useState(false);

	useEffect(() => {
		window.gm_authFailure = () => {
			setAuthFailed(true);
		};

		return () => {
			window.gm_authFailure = undefined;
		};
	}, []);

	const { isLoaded, loadError } = useJsApiLoader({
		id: 'batsirai-google-map',
		googleMapsApiKey: apiKey ?? '',
	});

	const providerHotspots = useMemo(
		() => [
			{ id: providers[0]?.id ?? 'p1', position: { lat: -15.399, lng: 28.305 }, title: providers[0]?.name ?? 'Provider 1' },
			{ id: providers[1]?.id ?? 'p2', position: { lat: -15.378, lng: 28.334 }, title: providers[1]?.name ?? 'Provider 2' },
			{ id: providers[2]?.id ?? 'p3', position: { lat: -15.365, lng: 28.351 }, title: providers[2]?.name ?? 'Provider 3' },
		],
		[],
	);

	const mapUnavailable = !apiKey || Boolean(loadError) || authFailed;
	const loaderErrorMessage = loadError instanceof Error ? loadError.message : '';
	const issueHint = (() => {
		if (authFailed) {
			return 'Auth failure: key is invalid, restricted incorrectly, or not authorized for this referrer.';
		}

		if (/RefererNotAllowedMapError/i.test(loaderErrorMessage)) {
			return 'Referrer restriction mismatch: add the exact local URL pattern in key restrictions.';
		}

		if (/ApiNotActivatedMapError/i.test(loaderErrorMessage)) {
			return 'Maps JavaScript API is disabled for this project.';
		}

		if (/BillingNotEnabledMapError/i.test(loaderErrorMessage)) {
			return 'Billing is not enabled for this Google Cloud project.';
		}

		if (/InvalidKeyMapError/i.test(loaderErrorMessage)) {
			return 'The key format is invalid or the key was deleted.';
		}

		if (/ExpiredKeyMapError/i.test(loaderErrorMessage)) {
			return 'The key has expired.';
		}

		return null;
	})();

	return (
		<Card>
			<div className="map-panel-head">
				<div>
					<p className="map-panel-title">Provider Heat Map</p>
					<p className="map-panel-subtitle">Demand + availability overview across Lusaka</p>
				</div>
				<div className="map-tab-row" role="tablist" aria-label="Map modes">
					<button className="map-tab map-tab-active" role="tab" aria-selected="true" type="button">Live Pins</button>
					<button className="map-tab" role="tab" aria-selected="false" type="button">Coverage</button>
				</div>
			</div>
			<div className="map-visual map-visual-elevated map-visual-real">
				{mapUnavailable ? (
					<div className="map-fallback-note">
						<p className="font-semibold">Google Maps could not load</p>
						<p className="text-xs text-brand-ink/70">
							Use a Browser key in apps/web/.env.local, enable Maps JavaScript API, and allow
							 referrers: http://localhost:3000/*, http://localhost:3001/*, http://localhost:3002/*.
						</p>
						{issueHint ? <p className="text-xs font-semibold text-brand-ink/80">Detected issue: {issueHint}</p> : null}
						{loaderErrorMessage ? <p className="text-xs text-brand-ink/70">Loader detail: {loaderErrorMessage}</p> : null}
					</div>
				) : !isLoaded ? (
					<div className="map-fallback-note">
						<p className="font-semibold">Loading map...</p>
					</div>
				) : (
					<GoogleMap
						mapContainerStyle={MAP_CONTAINER_STYLE}
						center={LUSAKA_CENTER}
						zoom={12}
						options={{
							disableDefaultUI: true,
							zoomControl: true,
							gestureHandling: 'cooperative',
						}}
					>
						{providerHotspots.map((spot) => (
							<MarkerF key={spot.id} position={spot.position} title={spot.title} />
						))}
					</GoogleMap>
				)}
			</div>
			<p className="mt-2 text-xs text-brand-ink/70">Provider pins are shown on a live Google map when a valid API key is configured.</p>
		</Card>
	);
}

export function ServicesProvidedPanel() {
	return (
		<Card>
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="map-panel-title">Services Provided</p>
					<p className="map-panel-subtitle">Browse every category with real in-action service photos</p>
				</div>
				<Link to="/categories" className="ui-btn-secondary">View All</Link>
			</div>
			<div className="services-photo-grid mt-3">
				{categories.map((category, index) => {
					const image = categoryImageBySlug[category.slug] ?? servicePanelFallbackImages[index % servicePanelFallbackImages.length];

					return (
						<Link key={category.id} to={`/categories/${category.slug}`} className="service-photo-card" style={{ ['--service-tint' as string]: category.colorHex }}>
							<img src={image} alt={`${category.name} service in action`} loading="lazy" />
							<span className="service-photo-label">{category.name}</span>
						</Link>
					);
				})}
			</div>
		</Card>
	);
}

export function CatalogueGrid({ items, providerId }: { items?: CatalogueItem[]; providerId?: string }) {
	const data = items ?? providers[0].catalogue;
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{data.map((item) => (
				<CatalogueCard key={item.id} item={item} providerId={providerId ?? providers[0].id} />
			))}
		</div>
	);
}

export function CatalogueCard({ item, providerId }: { item: CatalogueItem; providerId: string }) {
	return (
		<Card>
			<img src={item.imageUrl} alt={item.title} className="h-40 w-full rounded-xl object-cover" />
			<p className="mt-3 text-xs uppercase tracking-wider text-brand-ink/70">{item.serviceName}</p>
			<h3 className="font-semibold">{item.title}</h3>
			<p className="mt-1 text-sm text-brand-ink/70">{item.description}</p>
			<div className="mt-3 flex items-center justify-between">
				<p className="text-sm font-semibold">ZMW {item.priceFrom} {item.priceTo ? `- ${item.priceTo}` : ''}</p>
				<Link className="ui-btn-secondary" to={`/providers/${providerId}/book`}>
					Book
				</Link>
			</div>
		</Card>
	);
}

export function BookingForm() {
	const [submitted, setSubmitted] = useState(false);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
	}

	return (
		<Card>
			<form className="grid gap-3" onSubmit={handleSubmit}>
				<label className="grid gap-1 text-sm">
					Date
					<input className="ui-input" type="date" required />
				</label>
				<label className="grid gap-1 text-sm">
					Time slot
					<select className="ui-select" required>
						<option value="">Select time</option>
						<option>08:00 - 10:00</option>
						<option>10:00 - 12:00</option>
						<option>13:00 - 15:00</option>
						<option>15:00 - 17:00</option>
					</select>
				</label>
				<label className="grid gap-1 text-sm">
					Notes
					<textarea className="ui-textarea" rows={3} placeholder="Share details for the provider" />
				</label>
				<button className="ui-btn" type="submit">Confirm booking</button>
			</form>
			{submitted ? <p className="mt-3 text-sm text-brand-sea">Booking request prepared. Wire this form to POST /api/bookings.</p> : null}
		</Card>
	);
}

const flow: Array<Booking['status']> = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export function BookingStatus({ bookingId }: { bookingId?: string }) {
	const booking = bookings.find((item) => item.id === bookingId) ?? bookings[1];
	const [liveStatus, setLiveStatus] = useState<string>(booking.status);

	useRealtimeBooking(bookingId, setLiveStatus);

	const status = liveStatus === 'CANCELLED' ? 'PENDING' : liveStatus;
	const currentIndex = flow.indexOf(status as Booking['status']);

	return (
		<Card>
			<p className="font-semibold">{booking.providerName}</p>
			<p className="text-sm text-brand-ink/70">{booking.serviceName}</p>
			<p className="mt-2 text-xs font-semibold text-brand-sea">Current status: {liveStatus}</p>
			<div className="mt-4 grid gap-2">
				{flow.map((status, index) => (
					<div key={status} className="flex items-center gap-2 text-sm">
						<span className={`h-3 w-3 rounded-full ${index <= currentIndex ? 'bg-brand-sea' : 'bg-brand-ink/20'}`} />
						<span className={index <= currentIndex ? 'font-semibold' : 'text-brand-ink/60'}>{status}</span>
					</div>
				))}
			</div>
		</Card>
	);
}

export function ReviewForm() {
	const [rating, setRating] = useState(5);
	const [submitted, setSubmitted] = useState(false);

	return (
		<Card>
			<form
				className="grid gap-3"
				onSubmit={(event) => {
					event.preventDefault();
					setSubmitted(true);
				}}
			>
				<label className="grid gap-1 text-sm">
					Rating
					<input value={rating} onChange={(event) => setRating(Number(event.target.value))} type="range" min={1} max={5} />
					<span>{rating} / 5</span>
				</label>
				<label className="grid gap-1 text-sm">
					Comment
					<textarea className="ui-textarea" rows={4} required />
				</label>
				<button className="ui-btn" type="submit">Submit review</button>
			</form>
			{submitted ? <p className="mt-3 text-sm text-brand-sea">Review captured locally. Wire to POST /api/reviews.</p> : null}
		</Card>
	);
}

export function LocationPicker() {
	return (
		<Card>
			<div className="grid gap-3 md:grid-cols-2">
				<label className="grid gap-1 text-sm">
					Address
					<input className="ui-input" placeholder="Start typing address" />
				</label>
				<div className="grid grid-cols-2 gap-2">
					<label className="grid gap-1 text-sm">
						Lat
						<input className="ui-input" placeholder="-15.4167" />
					</label>
					<label className="grid gap-1 text-sm">
						Lng
						<input className="ui-input" placeholder="28.2833" />
					</label>
				</div>
			</div>
		</Card>
	);
}

export function FilterDrawer({ category }: { category?: string }) {
	return (
		<Card>
			<div className="grid gap-3 md:grid-cols-4">
				<label className="grid gap-1 text-sm">
					Category
					<select className="ui-select" defaultValue={category ?? ''}>
						<option value="">All categories</option>
						{categories.map((item) => (
							<option key={item.id} value={item.slug}>{item.name}</option>
						))}
					</select>
				</label>
				<label className="grid gap-1 text-sm">
					Max price
					<input className="ui-input" type="number" placeholder="500" />
				</label>
				<label className="grid gap-1 text-sm">
					Minimum rating
					<input className="ui-input" type="number" min={0} max={5} step={0.1} placeholder="4.0" />
				</label>
				<label className="grid gap-1 text-sm">
					Distance (km)
					<input className="ui-input" type="number" min={1} placeholder="10" />
				</label>
			</div>
		</Card>
	);
}

export function NotificationBell() {
	return (
		<button className="ui-btn-secondary inline-flex items-center gap-2 text-sm">
			Notifications
			<span className="grid h-5 w-5 place-items-center rounded-full bg-brand-ember text-xs text-white">3</span>
		</button>
	);
}

export function ProviderResults({ categorySlug }: { categorySlug?: string }) {
	const list = useMemo(
		() => (categorySlug ? providers.filter((provider) => provider.categorySlug === categorySlug) : providers),
		[categorySlug],
	);

	if (!list.length) {
		return <Card><p>No providers yet in this category. Try another service.</p></Card>;
	}

	return <div className="grid gap-3">{list.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>;
}
