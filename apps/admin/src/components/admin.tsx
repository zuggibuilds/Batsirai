import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Overview' },
  { to: '/providers', label: 'Providers' },
  { to: '/customers', label: 'Customers' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/disputes', label: 'Disputes' },
  { to: '/payments', label: 'Payments' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
  { to: '/security', label: 'Security' },
  { to: '/audit-log', label: 'Audit Log' },
];

export function Layout({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const location = useLocation();

  return (
    <div className="admin-shell min-h-screen">
      <header className="admin-topbar text-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/65">Control Center</p>
            <Link to="/" className="font-heading text-xl">Batsirai Admin</Link>
          </div>
          <div className="flex items-center gap-2">
            <button className="admin-chip" type="button">Live status</button>
            <button className="admin-chip" type="button">Admin Support</button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-6 md:grid-cols-[210px_minmax(0,1fr)] md:px-6">
        <aside className="admin-sidebar">
          <nav className="grid gap-1">
            {navLinks.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <Link key={item.to} to={item.to} className={`admin-nav-link ${active ? 'admin-nav-link-active' : ''}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section>
          <div className="admin-title-wrap">
            <div>
              <h1 className="font-heading text-3xl">{title}</h1>
              {subtitle ? <p className="admin-subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            {children}
          </motion.div>
        </section>
      </main>
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card rounded-xl p-4">
      <p className="text-sm text-admin-slate">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export function RoleGate({ role, children }: { role: string[]; children: React.ReactNode }) {
  const currentRole = localStorage.getItem('adminRole') ?? 'SUPPORT';
  if (!role.includes(currentRole)) {
    return null;
  }
  return <>{children}</>;
}

export function Surface({ children }: { children: ReactNode }) {
  return <div className="admin-card rounded-xl p-4 md:p-5">{children}</div>;
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string>>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-admin-line/80">
      <table className="admin-table min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell) => (
                <td key={`${cell}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  searchPlaceholder,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: string[];
  searchPlaceholder?: string;
}) {
  return (
    <div className="admin-toolbar">
      <input
        className="admin-input"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder ?? 'Search records'}
      />
      {statusOptions && onStatusChange ? (
        <select
          className="admin-select"
          aria-label="Filter records by status"
          value={status ?? 'ALL'}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
