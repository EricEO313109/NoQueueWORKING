import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Apple, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/log', icon: Apple, label: 'Food Log' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const HIDE_NAV = ['/onboarding', '/scanner', '/describe-meal'];

export default function MobileShell() {
  const { pathname } = useLocation();
  const hideNav = HIDE_NAV.some((p) => pathname === p || pathname.startsWith('/scanner'));

  return (
    <div className="h-app w-full bg-[hsl(var(--bg))] flex flex-col overflow-hidden">
      <main
        className="w-full max-w-lg mx-auto flex-1 grow min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>
      {!hideNav && (
        <nav
          className="flex-shrink-0 h-16 max-h-20 box-border w-full bg-[hsl(var(--bg))] border-t border-white/[0.06]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="grid grid-cols-3 items-center h-full max-w-lg mx-auto px-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 touch-target transition-colors leading-none',
                    isActive ? 'text-white' : 'text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div animate={{ scale: isActive ? 1.05 : 1 }} transition={{ duration: 0.15 }}>
                      <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
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
