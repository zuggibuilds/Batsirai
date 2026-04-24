import { env } from '@batsirai/config';

export function computePaymentBreakdown(amount: number) {
  const platformCommission = Number((amount * env.PLATFORM_COMMISSION_RATE).toFixed(2));
  const providerAmount = Number((amount - platformCommission).toFixed(2));
  return { platformCommission, providerAmount };
}

export function verifyFlutterwaveSignature(signature?: string) {
  return signature === env.FLUTTERWAVE_SECRET_HASH;
}
