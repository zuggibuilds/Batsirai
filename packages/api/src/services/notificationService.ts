import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import { pushService } from './pushService';
import { smsService } from './smsService';

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

export async function createNotification(userId: string, type: any, title: string, body: string, data?: any) {
  await prisma.notification.create({
    data: { userId, type, title, body, data },
  });
}

export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SENDGRID_FROM_EMAIL) {
    return;
  }
  await transporter.sendMail({
    from: process.env.SENDGRID_FROM_EMAIL,
    to,
    subject,
    text,
  });
}

export async function sendSMS(_to: string, _message: string) {
  await smsService.send(_to, _message);
}

export async function sendPush(_fcmToken: string, _title: string, _body: string) {
  await pushService.send(_fcmToken, _title, _body);
}

export const notificationService = {
  async sendBookingPaid(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        provider: { include: { user: true } },
        service: true,
      },
    });

    if (!booking) return;

    const providerUser = booking.provider.user;
    if (providerUser.fcmToken) {
      await pushService.send(
        providerUser.fcmToken,
        'New paid booking!',
        `${booking.customer.firstName} has booked your ${booking.service.name} service`,
        { bookingId, type: 'NEW_BOOKING' },
      );
    }

    await smsService.send(
      providerUser.phone,
      smsService.templates.newBookingProvider(
        `${booking.customer.firstName} ${booking.customer.lastName}`,
        booking.service.name,
      ),
    );

    await createNotification(
      providerUser.id,
      'BOOKING_CONFIRMED',
      'New paid booking',
      `${booking.customer.firstName} has booked your ${booking.service.name}`,
      { bookingId },
    );
  },

  async sendJobCompleted(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        provider: { include: { user: true } },
        payment: true,
      },
    });

    if (!booking || !booking.payment) return;

    const amount = Number(booking.payment.providerAmount || 0).toFixed(2);

    if (booking.customer.fcmToken) {
      await pushService.send(
        booking.customer.fcmToken,
        'Job complete!',
        'Your job has been completed. Please leave a review.',
        { bookingId, type: 'BOOKING_COMPLETED' },
      );
    }
    await smsService.send(booking.customer.phone, smsService.templates.jobCompleted(amount));

    const providerUser = booking.provider.user;
    if (providerUser.fcmToken) {
      await pushService.send(
        providerUser.fcmToken,
        'Payment released!',
        `K${amount} has been added to your payout balance`,
        { bookingId, type: 'PAYMENT_RELEASED' },
      );
    }
    await smsService.send(providerUser.phone, smsService.templates.paymentReceived(amount));

    await prisma.notification.createMany({
      data: [
        {
          userId: booking.customerId,
          type: 'BOOKING_COMPLETED',
          title: 'Job complete',
          body: 'Please take a moment to leave a review.',
          data: { bookingId },
        },
        {
          userId: providerUser.id,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment released',
          body: `K${amount} added to your balance`,
          data: { bookingId },
        },
      ],
    });
  },

  async sendProviderApproved(providerId: string): Promise<void> {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: true },
    });
    if (!provider) return;

    const user = provider.user;
    if (user.fcmToken) {
      await pushService.send(
        user.fcmToken,
        "You're approved!",
        'Your Batsirai provider account is live. Start receiving bookings!',
        { type: 'PROVIDER_APPROVED' },
      );
    }

    await smsService.send(user.phone, smsService.templates.providerApproved(user.firstName));
    await createNotification(
      user.id,
      'PROVIDER_APPROVED',
      'Account approved!',
      'Your provider account is live. Customers can now find and book you.',
    );
  },

  async sendCatalogueDecision(catalogueItemId: string, approved: boolean, reason?: string): Promise<void> {
    const item = await prisma.catalogueItem.findUnique({
      where: { id: catalogueItemId },
      include: { provider: { include: { user: true } } },
    });

    if (!item) return;

    const user = item.provider.user;
    const smsMessage = approved
      ? smsService.templates.catalogueApproved(item.title)
      : smsService.templates.catalogueRejected(item.title, reason || 'Does not meet quality standards');

    if (user.fcmToken) {
      await pushService.send(
        user.fcmToken,
        approved ? 'Catalogue listing approved' : 'Catalogue listing needs attention',
        approved ? `Your "${item.title}" listing is now live` : `"${item.title}" was not approved`,
        { catalogueItemId, type: approved ? 'CATALOGUE_APPROVED' : 'CATALOGUE_REJECTED' },
      );
    }

    await smsService.send(user.phone, smsMessage);
  },
};
