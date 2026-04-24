import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categoryDefinitions = [
  { name: 'Electrical', slug: 'electrical', colorHex: '#0A4D68' },
  { name: 'Plumbing', slug: 'plumbing', colorHex: '#088395' },
  { name: 'Cleaning', slug: 'cleaning', colorHex: '#05BFDB' },
  { name: 'Carpentry', slug: 'carpentry', colorHex: '#845EC2' },
  { name: 'Painting', slug: 'painting', colorHex: '#D65DB1' },
  { name: 'Gardening', slug: 'gardening', colorHex: '#00C9A7' },
  { name: 'Driving', slug: 'driving', colorHex: '#0081CF' },
  { name: 'Tutoring', slug: 'tutoring', colorHex: '#FFC75F' },
  { name: 'Beauty', slug: 'beauty', colorHex: '#F9F871' },
  { name: 'Hairdressing', slug: 'hairdressing', colorHex: '#FF8066' },
  { name: 'Masonry', slug: 'masonry', colorHex: '#C34A36' },
  { name: 'Welding', slug: 'welding', colorHex: '#4D8076' },
  { name: 'Mechanics', slug: 'mechanics', colorHex: '#4B4453' },
  { name: 'Appliance Repair', slug: 'appliance-repair', colorHex: '#2C73D2' },
  { name: 'Moving', slug: 'moving', colorHex: '#008F7A' },
  { name: 'Catering', slug: 'catering', colorHex: '#FF6F91' },
  { name: 'Photography', slug: 'photography', colorHex: '#2F4B7C' },
  { name: 'Videography', slug: 'videography', colorHex: '#665191' },
  { name: 'Laundry', slug: 'laundry', colorHex: '#A05195' },
  { name: 'Security', slug: 'security', colorHex: '#003F5C' },
  { name: 'IT Support', slug: 'it-support', colorHex: '#006F9A' },
  { name: 'Event Planning', slug: 'event-planning', colorHex: '#FFA600' },
  { name: 'Childcare', slug: 'childcare', colorHex: '#7ED957' },
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.catalogueImage.deleteMany();
  await prisma.catalogueItem.deleteMany();
  await prisma.providerAvailability.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();

  const categories = await Promise.all(
    categoryDefinitions.map((category, i) =>
      prisma.category.create({
        data: {
          ...category,
          description: `${category.name} services`,
          iconUrl: `/icons/${category.slug}.svg`,
          sortOrder: i + 1,
        },
      }),
    ),
  );

  const services = [] as { id: string; categoryId: string; name: string; slug: string }[];
  for (const category of categories) {
    for (let i = 1; i <= 11; i += 1) {
      const service = await prisma.service.create({
        data: {
          categoryId: category.id,
          name: `${category.name} Service ${i}`,
          slug: `${category.slug}-service-${i}`,
          description: `Professional ${category.name.toLowerCase()} service ${i}`,
        },
      });
      services.push(service);
    }
  }

  const adminPasswordHash = await bcrypt.hash('Admin@2026!', 12);
  await prisma.adminUser.create({
    data: {
      email: 'admin@batsirai.com',
      passwordHash: adminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const providerPasswordHash = await bcrypt.hash('Provider@2026!', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@2026!', 10);

  const providers = [] as { userId: string; providerId: string }[];
  for (let i = 1; i <= 5; i += 1) {
    const user = await prisma.user.create({
      data: {
        email: `provider${i}@batsirai.com`,
        phone: `2609700000${i}`,
        passwordHash: providerPasswordHash,
        firstName: `Provider${i}`,
        lastName: 'Lusaka',
        role: 'PROVIDER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        locationLat: -15.42 + i * 0.01,
        locationLng: 28.28 + i * 0.01,
        locationAddress: 'Lusaka, Zambia',
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        businessName: `Lusaka Pro Services ${i}`,
        bio: 'Trusted verified provider in Lusaka.',
        idDocumentUrl: `https://example.com/docs/id-${i}.pdf`,
        certificationUrl: `https://example.com/docs/cert-${i}.pdf`,
        isVerified: true,
        verificationStatus: 'APPROVED',
        serviceAreaLat: -15.4167,
        serviceAreaLng: 28.2833,
        serviceAreaRadiusKm: 20,
        averageRating: 4.2 + i * 0.1,
        totalJobsCompleted: 20 + i,
        totalReviews: 10 + i,
        isAvailable: true,
      },
    });

    for (let day = 1; day <= 5; day += 1) {
      await prisma.providerAvailability.create({
        data: {
          providerId: provider.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          isAvailable: true,
        },
      });
    }

    providers.push({ userId: user.id, providerId: provider.id });
  }

  const customers = [] as string[];
  for (let i = 1; i <= 10; i += 1) {
    const customer = await prisma.user.create({
      data: {
        email: `customer${i}@batsirai.com`,
        phone: `2609600001${String(i).padStart(2, '0')}`,
        passwordHash: customerPasswordHash,
        firstName: `Customer${i}`,
        lastName: 'Demo',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        locationLat: -15.4167,
        locationLng: 28.2833,
        locationAddress: 'Lusaka, Zambia',
      },
    });
    customers.push(customer.id);
  }

  for (let i = 0; i < providers.length; i += 1) {
    const service = services[i * 3];
    const item = await prisma.catalogueItem.create({
      data: {
        providerId: providers[i].providerId,
        serviceId: service.id,
        title: `${service.name} Premium Package`,
        description: 'Fast response and quality guaranteed.',
        priceFrom: 150,
        priceTo: 500,
        estimatedHours: 2,
        status: 'APPROVED',
        isActive: true,
      },
    });

    for (let img = 1; img <= 3; img += 1) {
      await prisma.catalogueImage.create({
        data: {
          catalogueItemId: item.id,
          url: `https://example.com/images/${item.id}-${img}.jpg`,
          thumbnailUrl: `https://example.com/images/${item.id}-${img}-thumb.jpg`,
          altText: `${item.title} image ${img}`,
          widthPx: 1200,
          heightPx: 1200,
          fileSizeBytes: 240000,
          isPrimary: img === 1,
          reviewStatus: 'APPROVED',
        },
      });
    }
  }

  const bookingStates = [
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ] as const;

  for (let i = 0; i < 12; i += 1) {
    const provider = providers[i % providers.length];
    const service = services[(i + 7) % services.length];
    const customerId = customers[i % customers.length];
    const status = bookingStates[i % bookingStates.length];

    const booking = await prisma.booking.create({
      data: {
        customerId,
        providerId: provider.providerId,
        serviceId: service.id,
        status,
        scheduledAt: new Date(Date.now() + (i + 1) * 86400000),
        locationAddress: 'Lusaka, Zambia',
        locationLat: -15.4167,
        locationLng: 28.2833,
        quotedPrice: 200 + i * 30,
        finalPrice: status === 'COMPLETED' ? 200 + i * 30 : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
        cancellationReason: status === 'CANCELLED' ? 'Customer unavailable' : null,
      },
    });

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        status,
        changedBy: customerId,
        note: `Seeded status ${status}`,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.quotedPrice,
        platformCommission: booking.quotedPrice * 0.15,
        providerAmount: booking.quotedPrice * 0.85,
        status:
          status === 'COMPLETED'
            ? 'RELEASED'
            : status === 'ACCEPTED' || status === 'IN_PROGRESS'
              ? 'IN_ESCROW'
              : 'PENDING',
        paymentMethod: 'card',
      },
    });

    if (status === 'COMPLETED') {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          customerId,
          providerId: provider.providerId,
          rating: 4 + (i % 2),
          comment: 'Excellent service and professionalism.',
        },
      });
    }
  }

  console.log('Seed complete: categories=23, services=253, providers=5, customers=10');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
