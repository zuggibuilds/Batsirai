import cron from 'node-cron';
import { subscriptionService } from '../services/subscriptionService';

export function startSubscriptionCron(): void {
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running subscription expiry check...');
    await subscriptionService.expireStaleSubscriptions();
  });
}
