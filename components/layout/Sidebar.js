'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: '⬛' },
  { href: '/setup',        label: 'Setup',        icon: '⚙' },
  { href: '/reviews',      label: 'Reviews',      icon: '★' },
  { href: '/testimonials', label: 'Testimonials', icon: '🖼' },
  { href: '/analytics',    label: 'Analytics',    icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 flex flex-col z-40"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #b8922a, #F0C040)' }}>R</div>
        <span className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>Revora.io</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ color: active ? '#ffffff' : 'var(--sidebar-text)', background: active ? 'var(--sidebar-active)' : 'transparent' }}>
              <span className="w-5 text-center text-base">{icon}</span>
              {label}
              {active && <span className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, #b8922a, #F0C040)' }} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sidebar-text)')}>
          <span className="w-5 text-center">↩</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
