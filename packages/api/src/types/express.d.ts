import { JwtAdminPayload, JwtUserPayload } from '@batsirai/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      admin?: JwtAdminPayload;
    }
  }
}

export {};
