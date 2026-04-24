import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

const messaging = admin.apps.length ? admin.messaging() : null;

export const pushService = {
  async send(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!fcmToken || !messaging) return;
    try {
      await messaging.send({
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (error) {
      console.error('[Push] Failed to send:', error);
    }
  },

  async sendToMultiple(fcmTokens: string[], title: string, body: string): Promise<void> {
    if (!fcmTokens.length || !messaging) return;
    try {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
      });
    } catch (error) {
      console.error('[Push] Multicast failed:', error);
    }
  },
};
