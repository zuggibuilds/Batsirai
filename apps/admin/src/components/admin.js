import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    { to: '/audit-log', label: 'Audit Log' },
];
export function Layout({ title, subtitle, children, actions, }) {
    const location = useLocation();
    return (_jsxs("div", { className: "admin-shell min-h-screen", children: [_jsx("header", { className: "admin-topbar text-white", children: _jsxs("div", { className: "mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 md:px-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-[0.16em] text-white/65", children: "Control Center" }), _jsx(Link, { to: "/", className: "font-heading text-xl", children: "Batsirai Admin" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "admin-chip", type: "button", children: "Live status" }), _jsx("button", { className: "admin-chip", type: "button", children: "Admin Support" })] })] }) }), _jsxs("main", { className: "mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-6 md:grid-cols-[210px_minmax(0,1fr)] md:px-6", children: [_jsx("aside", { className: "admin-sidebar", children: _jsx("nav", { className: "grid gap-1", children: navLinks.map((item) => {
                                const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                                return (_jsx(Link, { to: item.to, className: `admin-nav-link ${active ? 'admin-nav-link-active' : ''}`, children: item.label }, item.to));
                            }) }) }), _jsxs("section", { children: [_jsxs("div", { className: "admin-title-wrap", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-heading text-3xl", children: title }), subtitle ? _jsx("p", { className: "admin-subtitle", children: subtitle }) : null] }), actions ? _jsx("div", { className: "flex flex-wrap items-center gap-2", children: actions }) : null] }), _jsx(motion.div, { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }, className: "mt-4", children: children })] })] })] }));
}
export function MetricCard({ label, value }) {
    return (_jsxs("div", { className: "admin-card rounded-xl p-4", children: [_jsx("p", { className: "text-sm text-admin-slate", children: label }), _jsx("p", { className: "text-2xl font-bold", children: value })] }));
}
export function RoleGate({ role, children }) {
    const currentRole = localStorage.getItem('adminRole') ?? 'SUPPORT';
    if (!role.includes(currentRole)) {
        return null;
    }
    return _jsx(_Fragment, { children: children });
}
export function Surface({ children }) {
    return _jsx("div", { className: "admin-card rounded-xl p-4 md:p-5", children: children });
}
export function DataTable({ columns, rows, }) {
    return (_jsx("div", { className: "overflow-x-auto rounded-xl border border-admin-line/80", children: _jsxs("table", { className: "admin-table min-w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: rows.map((row, index) => (_jsx("tr", { children: row.map((cell) => (_jsx("td", { children: cell }, `${cell}-${index}`))) }, `${row[0]}-${index}`))) })] }) }));
}
export function TableToolbar({ search, onSearchChange, status, onStatusChange, statusOptions, searchPlaceholder, }) {
    return (_jsxs("div", { className: "admin-toolbar", children: [_jsx("input", { className: "admin-input", value: search, onChange: (event) => onSearchChange(event.target.value), placeholder: searchPlaceholder ?? 'Search records' }), statusOptions && onStatusChange ? (_jsxs("select", { className: "admin-select", value: status ?? 'ALL', onChange: (event) => onStatusChange(event.target.value), children: [_jsx("option", { value: "ALL", children: "All statuses" }), statusOptions.map((option) => (_jsx("option", { value: option, children: option }, option)))] })) : null] }));
}
