import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, SlidersHorizontal } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/week', label: 'Analytics', icon: BarChart3 },
  { to: '/goal', label: 'Program', icon: SlidersHorizontal },
];

export default function AppLayout() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden m-0 p-0 bg-[hsl(var(--bg))]">
      <main
        className="flex-1 min-h-0 w-full max-w-lg mx-auto overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="Main navigation">
        <div className="mobile-nav__row mx-auto max-w-lg">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors touch-target ${
                  isActive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function DefaultRedirect() {
  return <Navigate to="/" replace />;
}
