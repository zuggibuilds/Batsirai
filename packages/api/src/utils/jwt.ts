import jwt from 'jsonwebtoken';
import { env } from '@batsirai/config';
import { JwtAdminPayload, JwtUserPayload } from '@batsirai/shared';

function withExpiry(expiresIn: string): jwt.SignOptions {
  return { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
}

export function signAccessToken(payload: JwtUserPayload) {
  return jwt.sign(payload, env.JWT_SECRET, withExpiry(env.JWT_ACCESS_EXPIRY));
}

export function signRefreshToken(payload: JwtUserPayload) {
  return jwt.sign(payload, env.JWT_SECRET, withExpiry(env.JWT_REFRESH_EXPIRY));
}

export function verifyUserToken(token: string): JwtUserPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
}

export function signAdminToken(payload: JwtAdminPayload) {
  return jwt.sign(payload, env.ADMIN_JWT_SECRET, withExpiry(env.ADMIN_JWT_EXPIRY));
}

export function verifyAdminToken(token: string): JwtAdminPayload {
  return jwt.verify(token, env.ADMIN_JWT_SECRET) as JwtAdminPayload;
}
