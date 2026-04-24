import Flutterwave from 'flutterwave-node-v3';
import { prisma } from '../lib/prisma';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  process.env.FLUTTERWAVE_SECRET_KEY || '',
);

const SUBSCRIPTION_FEE = parseFloat(process.env.PROVIDER_SUBSCRIPTION_FEE || '150');

export const subscriptionService = {
  async activateSubscription(providerId: string): Promise<void> {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiry,
      },
    });
  },

  async isSubscriptionActive(providerId: string): Promise<boolean> {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { subscriptionStatus: true, subscriptionExpiresAt: true },
    });

    if (!provider) return false;
    if (provider.subscriptionStatus !== 'ACTIVE') return false;
    if (!provider.subscriptionExpiresAt) return false;

    return provider.subscriptionExpiresAt > new Date();
  },

  async initiateSubscriptionPayment(providerId: string): Promise<string> {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { user: true },
    });

    if (!provider) throw new Error('Provider not found');

    const txRef = `sub_${providerId}_${Date.now()}`;
    const response = await flw.Payment.initiate({
      tx_ref: txRef,
      amount: SUBSCRIPTION_FEE,
      currency: 'ZMW',
      redirect_url: `${process.env.WEB_URL}/dashboard/subscription/callback`,
      customer: {
        email: provider.user.email,
        phone_number: provider.user.phone,
        name: `${provider.user.firstName} ${provider.user.lastName}`,
      },
      customizations: {
        title: 'Batsirai Provider Subscription',
        description: 'Monthly listing fee - K150/month',
      },
      meta: {
        providerId,
        type: 'SUBSCRIPTION',
      },
    } as any);

    return response.data.link;
  },

  async expireStaleSubscriptions(): Promise<void> {
    const now = new Date();
    await prisma.provider.updateMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: { lt: now },
      },
      data: {
        subscriptionStatus: 'EXPIRED',
        isAvailable: false,
      },
    });

    console.log(`[Subscription cron] Expired stale subscriptions at ${now.toISOString()}`);
  },
};
