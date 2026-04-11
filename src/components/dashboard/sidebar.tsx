'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { LayoutDashboard, BookOpen, Users, Settings, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/registry', label: 'Registry', icon: BookOpen },
  { href: '/dashboard/donors', label: 'Donors', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  priestName: string;
  slug: string;
}

export function Sidebar({ priestName, slug }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-burgundy-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-cream/10">
        <Link href="/" className="font-cormorant text-2xl text-cream font-light tracking-wide block mb-1">
          Ad Altare
        </Link>
        <p className="font-inter text-xs text-cream/40 uppercase tracking-[0.2em]">Dashboard</p>
      </div>

      {/* Priest Name */}
      <div className="px-6 py-4 border-b border-cream/10">
        <p className="font-cormorant text-lg text-cream font-light">Fr. {priestName}</p>
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-inter text-xs text-cream/40 hover:text-gold-400 transition-colors flex items-center gap-1 mt-0.5"
        >
          <ExternalLink className="w-3 h-3" />
          View public page
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-sm font-inter text-sm transition-colors',
                isActive
                  ? 'bg-cream/15 text-cream'
                  : 'text-cream/60 hover:text-cream hover:bg-cream/10'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-6 py-5 border-t border-cream/10 flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
        <span className="font-inter text-xs text-cream/50">Account</span>
      </div>
    </aside>
  );
}
