export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  OPS_MANAGER: ['providers.*', 'customers.*', 'bookings.*', 'disputes.*', 'dashboard.*'],
  CATALOGUE_REVIEWER: ['catalogue.*', 'dashboard.stats'],
  FINANCE_ADMIN: ['payments.*', 'payouts.*', 'reports.*', 'dashboard.*'],
  SUPPORT: ['customers.read', 'bookings.read', 'dashboard.stats'],
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS;

export const PLATFORM_DEFAULTS = {
  platformCommissionRate: 0.15,
  minImageWidth: 1080,
  minImageHeight: 1080,
  minCatalogueImages: 3,
};

export type JwtUserPayload = {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
};

export type JwtAdminPayload = {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OPS_MANAGER' | 'CATALOGUE_REVIEWER' | 'FINANCE_ADMIN' | 'SUPPORT';
};
