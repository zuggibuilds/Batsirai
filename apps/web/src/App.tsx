import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  HomePage,
  CategoriesPage,
  CategoryDetailPage,
  ProviderPage,
  ProviderBookPage,
  SearchPage,
  BookingsPage,
  BookingDetailPage,
  BookingReviewPage,
  ProfilePage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  DashboardPage,
  CustomerDashboardPage,
  ProviderDashboardPage,
  DashboardCataloguePage,
  DashboardCatalogueNewPage,
  DashboardCatalogueEditPage,
  DashboardBookingsPage,
  DashboardBookingDetailPage,
  DashboardEarningsPage,
  DashboardAvailabilityPage,
  DashboardProfilePage,
  OnboardingPage,
} from './pages/pages';

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RouteFrame><HomePage /></RouteFrame>} />
        <Route path="/categories" element={<RouteFrame><CategoriesPage /></RouteFrame>} />
        <Route path="/categories/:slug" element={<RouteFrame><CategoryDetailPage /></RouteFrame>} />
        <Route path="/providers/:id" element={<RouteFrame><ProviderPage /></RouteFrame>} />
        <Route path="/providers/:id/book" element={<RouteFrame><ProviderBookPage /></RouteFrame>} />
        <Route path="/search" element={<RouteFrame><SearchPage /></RouteFrame>} />
        <Route path="/bookings" element={<RouteFrame><BookingsPage /></RouteFrame>} />
        <Route path="/bookings/:id" element={<RouteFrame><BookingDetailPage /></RouteFrame>} />
        <Route path="/bookings/:id/review" element={<RouteFrame><BookingReviewPage /></RouteFrame>} />
        <Route path="/profile" element={<RouteFrame><ProfilePage /></RouteFrame>} />
        <Route path="/auth/login" element={<RouteFrame><LoginPage /></RouteFrame>} />
        <Route path="/auth/register" element={<RouteFrame><RegisterPage /></RouteFrame>} />
        <Route path="/auth/forgot-password" element={<RouteFrame><ForgotPasswordPage /></RouteFrame>} />

        <Route path="/dashboard" element={<RouteFrame><DashboardPage /></RouteFrame>} />
        <Route path="/dashboard/customer" element={<RouteFrame><CustomerDashboardPage /></RouteFrame>} />
        <Route path="/dashboard/provider" element={<RouteFrame><ProviderDashboardPage /></RouteFrame>} />
        <Route path="/dashboard/catalogue" element={<RouteFrame><DashboardCataloguePage /></RouteFrame>} />
        <Route path="/dashboard/catalogue/new" element={<RouteFrame><DashboardCatalogueNewPage /></RouteFrame>} />
        <Route path="/dashboard/catalogue/:id" element={<RouteFrame><DashboardCatalogueEditPage /></RouteFrame>} />
        <Route path="/dashboard/bookings" element={<RouteFrame><DashboardBookingsPage /></RouteFrame>} />
        <Route path="/dashboard/bookings/:id" element={<RouteFrame><DashboardBookingDetailPage /></RouteFrame>} />
        <Route path="/dashboard/earnings" element={<RouteFrame><DashboardEarningsPage /></RouteFrame>} />
        <Route path="/dashboard/availability" element={<RouteFrame><DashboardAvailabilityPage /></RouteFrame>} />
        <Route path="/dashboard/profile" element={<RouteFrame><DashboardProfilePage /></RouteFrame>} />
        <Route path="/onboarding" element={<RouteFrame><OnboardingPage /></RouteFrame>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function RouteFrame({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
