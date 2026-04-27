export type Category = {
  id: string;
  name: string;
  slug: string;
  colorHex: string;
  icon: string;
};

export type CatalogueItem = {
  id: string;
  serviceName: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo?: number;
  imageUrl: string;
};

export type Provider = {
  id: string;
  name: string;
  categorySlug: string;
  avatarUrl: string;
  rating: number;
  distanceKm: number;
  priceFrom: number;
  locationAddress: string;
  bio: string;
  catalogue: CatalogueItem[];
};

export type Booking = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  locationAddress: string;
  quotedPrice: number;
};

const categoryNames = [
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Carpentry',
  'Painting',
  'Gardening',
  'Driving',
  'Tutoring',
  'Beauty',
  'Hairdressing',
  'Masonry',
  'Welding',
  'Mechanics',
  'Appliance Repair',
  'Moving',
  'Catering',
  'Photography',
  'Videography',
  'Laundry',
  'Security',
  'IT Support',
  'Event Planning',
  'Childcare',
];

const palette = ['#12343B', '#2D6A4F', '#E76F51', '#355070', '#7A5C61', '#0081A7', '#9C6644'];
const icons = ['⚡', '🔧', '🧹', '🪚', '🎨', '🌿', '🚗', '📚', '💄', '💇', '🧱', '🔥', '🛠️', '📺', '📦', '🍽️', '📷', '🎬', '🧺', '🛡️', '💻', '🎉', '🧒'];

export const categories: Category[] = categoryNames.map((name, index) => ({
  id: `cat-${index + 1}`,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  colorHex: palette[index % palette.length],
  icon: icons[index % icons.length],
}));

const baseCatalogue: CatalogueItem[] = [
  {
    id: 'item-1',
    serviceName: 'Emergency Repair',
    title: 'Rapid Response Package',
    description: 'Same-day arrival, diagnostics, and immediate fix where possible.',
    priceFrom: 180,
    priceTo: 600,
    imageUrl: 'https://images.unsplash.com/photo-1621905252472-e8f0ee6f0f62?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'item-2',
    serviceName: 'Scheduled Service',
    title: 'Planned Maintenance Visit',
    description: 'Preventive checks and tune-ups for homes and offices.',
    priceFrom: 220,
    priceTo: 720,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'item-3',
    serviceName: 'Premium Service',
    title: 'End-to-End Pro Bundle',
    description: 'Full service with materials sourcing and quality assurance.',
    priceFrom: 450,
    priceTo: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1603714228686-3072a5f7f7c0?auto=format&fit=crop&w=900&q=80',
  },
];

export const providers: Provider[] = [
  {
    id: 'prov-1',
    name: 'Lusaka Spark Electric',
    categorySlug: 'electrical',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    rating: 4.8,
    distanceKm: 2.4,
    priceFrom: 180,
    locationAddress: 'Kabulonga, Lusaka',
    bio: 'Certified electricians for homes, offices, and retail fit-outs.',
    catalogue: baseCatalogue,
  },
  {
    id: 'prov-2',
    name: 'PipeFix Zambia - Kelvin Mwale',
    categorySlug: 'plumbing',
    avatarUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=200&q=80',
    rating: 4.8,
    distanceKm: 3.2,
    priceFrom: 210,
    locationAddress: 'Woodlands Extension, Lusaka',
    bio: 'Licensed plumber specializing in leak detection, pipe replacement, geyser and water heater servicing, and emergency home call-outs.',
    catalogue: baseCatalogue,
  },
  {
    id: 'prov-3',
    name: 'CleanWave Home Care',
    categorySlug: 'cleaning',
    avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
    rating: 4.7,
    distanceKm: 1.9,
    priceFrom: 150,
    locationAddress: 'Roma, Lusaka',
    bio: 'Deep cleaning for apartments, homes, and office spaces.',
    catalogue: baseCatalogue,
  },
  {
    id: 'prov-4',
    name: 'TutorCircle Zambia',
    categorySlug: 'tutoring',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    rating: 4.9,
    distanceKm: 6.2,
    priceFrom: 120,
    locationAddress: 'Kalingalinga, Lusaka',
    bio: 'Math, science, and exam prep with vetted tutors.',
    catalogue: baseCatalogue,
  },
  {
    id: 'prov-5',
    name: 'DriveRight Chauffeurs',
    categorySlug: 'driving',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 4.5,
    distanceKm: 3.7,
    priceFrom: 200,
    locationAddress: 'Olympia, Lusaka',
    bio: 'On-demand drivers for daily commutes and event transport.',
    catalogue: baseCatalogue,
  },
];

export const bookings: Booking[] = [
  {
    id: 'book-1001',
    providerId: 'prov-1',
    providerName: 'Lusaka Spark Electric',
    serviceName: 'Rapid Response Package',
    status: 'PENDING',
    scheduledAt: '2026-04-22T09:00:00.000Z',
    locationAddress: 'Leopards Hill Road, Lusaka',
    quotedPrice: 320,
  },
  {
    id: 'book-1002',
    providerId: 'prov-2',
    providerName: 'PipeFix Zambia',
    serviceName: 'Planned Maintenance Visit',
    status: 'IN_PROGRESS',
    scheduledAt: '2026-04-20T13:30:00.000Z',
    locationAddress: 'Ibex Hill, Lusaka',
    quotedPrice: 410,
  },
  {
    id: 'book-1003',
    providerId: 'prov-3',
    providerName: 'CleanWave Home Care',
    serviceName: 'End-to-End Pro Bundle',
    status: 'COMPLETED',
    scheduledAt: '2026-04-16T08:00:00.000Z',
    locationAddress: 'Mass Media, Lusaka',
    quotedPrice: 500,
  },
];
