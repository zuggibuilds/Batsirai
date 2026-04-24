import { Navigate, Route, Routes } from 'react-router-dom';
import {
  LoginPage,
  DashboardPage,
  ProvidersPage,
  ProviderDetailPage,
  CustomersPage,
  CustomerDetailPage,
  CataloguePage,
  CatalogueItemPage,
  BookingsPage,
  BookingDetailPage,
  DisputesPage,
  DisputeDetailPage,
  PaymentsPage,
  PayoutsPage,
  ReportsPage,
  SettingsPage,
  SecurityPage,
  AdminsPage,
  AuditLogPage,
} from './pages/pages';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/providers" element={<ProvidersPage />} />
      <Route path="/providers/:id" element={<ProviderDetailPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
      <Route path="/catalogue" element={<CataloguePage />} />
      <Route path="/catalogue/:itemId" element={<CatalogueItemPage />} />
      <Route path="/bookings" element={<BookingsPage />} />
      <Route path="/bookings/:id" element={<BookingDetailPage />} />
      <Route path="/disputes" element={<DisputesPage />} />
      <Route path="/disputes/:id" element={<DisputeDetailPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/payments/payouts" element={<PayoutsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/admins" element={<AdminsPage />} />
      <Route path="/audit-log" element={<AuditLogPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
