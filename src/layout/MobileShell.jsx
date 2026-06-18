import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutGrid, Apple, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/log', icon: Apple, label: 'Food Log' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const HIDE_NAV = ['/onboarding', '/scanner'];

export default function MobileShell() {
  const { pathname } = useLocation();
  const hideNav = HIDE_NAV.some((p) => pathname === p || pathname.startsWith('/scanner'));

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden m-0 p-0 bg-[hsl(var(--bg))]">
      <main
        className="flex-1 min-h-0 w-full max-w-lg mx-auto overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>
      {!hideNav && (
        <nav className="mobile-nav" aria-label="Main navigation">
          <div className="mobile-nav__row mx-auto max-w-lg px-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 transition-colors leading-none min-h-0 overflow-hidden touch-target',
                    isActive ? 'text-white' : 'text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-5 w-5 shrink-0', isActive && 'stroke-[2.5]')} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={cn('text-[10px] font-semibold leading-none', isActive && 'text-[11px] font-bold')}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
