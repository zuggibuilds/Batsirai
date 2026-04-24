import AfricasTalking from 'africastalking';

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY || '',
  username: process.env.AT_USERNAME || '',
});

const sms = at.SMS;

export const smsService = {
  async send(to: string, message: string): Promise<void> {
    try {
      const phone = to.startsWith('+') ? to : `+260${to.replace(/^0/, '')}`;
      await sms.send({
        to: [phone],
        message,
        from: process.env.AT_SENDER_ID || 'BATSIRAI',
      });
    } catch (error) {
      console.error('[SMS] Failed to send:', error);
    }
  },

  templates: {
    bookingConfirmed: (providerName: string, date: string) =>
      `Batsirai: Your booking with ${providerName} is confirmed for ${date}. Track it in the app.`,
    bookingAccepted: (providerName: string) =>
      `Batsirai: ${providerName} has accepted your booking and is on their way. Open the app to track.`,
    jobStarted: (providerName: string) =>
      `Batsirai: ${providerName} has started your job. You will be notified when complete.`,
    jobCompleted: (amount: string) =>
      `Batsirai: Job complete! K${amount} payment has been processed. Please leave a review.`,
    newBookingProvider: (customerName: string, service: string) =>
      `Batsirai: New booking from ${customerName} for ${service}. Open the app to accept or decline.`,
    paymentReceived: (amount: string) =>
      `Batsirai: K${amount} has been added to your payout balance. Keep up the great work!`,
    disputeOpened: () =>
      'Batsirai: A dispute has been raised on your booking. Our team will review it within 48 hours.',
    providerApproved: (name: string) =>
      `Batsirai: Congratulations ${name}! Your account has been approved. You can now receive bookings.`,
    catalogueApproved: (serviceName: string) =>
      `Batsirai: Your catalogue listing "${serviceName}" has been approved and is now live.`,
    catalogueRejected: (serviceName: string, reason: string) =>
      `Batsirai: Your listing "${serviceName}" was not approved. Reason: ${reason}. Please resubmit.`,
  },
};
