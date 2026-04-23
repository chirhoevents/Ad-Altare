'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard, BookOpen, Users, Settings, ExternalLink,
  CalendarDays, Search, Menu, X, UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  { href: '/dashboard/registry', label: 'Registry', icon: BookOpen },
  { href: '/dashboard/donors', label: 'Donors', icon: Users },
  { href: '/dashboard/rsvp', label: 'RSVP', icon: CalendarDays },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  priestName: string;
  slug: string;
  profilePhotoUrl: string | null;
}

export function Sidebar({ priestName, slug, profilePhotoUrl }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function close() { setMobileOpen(false); }

  const initials = priestName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  // Photo circle that links to My Profile
  function ProfilePhoto() {
    return (
      <Link
        href="/dashboard/profile"
        onClick={close}
        title="Edit profile"
        className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-cream/20 hover:ring-cream/60 transition-all focus:outline-none focus-visible:ring-cream/60"
      >
        {profilePhotoUrl ? (
          <Image src={profilePhotoUrl} alt={priestName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-burgundy-600">
            <span className="font-cormorant text-xl text-cream font-light">{initials}</span>
          </div>
        )}
      </Link>
    );
  }

  function NavLinks() {
    return (
      <>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-sm font-inter text-sm transition-colors',
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

        <div className="px-3 pb-2">
          <Link
            href="/directory"
            onClick={close}
            className="flex items-center gap-3 px-3 py-3 rounded-sm font-inter text-sm text-cream/60 hover:text-cream hover:bg-cream/10 transition-colors"
          >
            <Search className="w-4 h-4 shrink-0" />
            Find a Priest
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-burgundy-800 flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-cream/10 flex justify-center">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Ad Altare"
              width={540}
              height={205}
              className="h-11 w-auto"
              quality={100}
            />
          </Link>
        </div>

        {/* Priest identity */}
        <div className="px-5 py-4 border-b border-cream/10 flex items-center gap-3">
          <ProfilePhoto />
          <div className="min-w-0">
            <p className="font-cormorant text-lg text-cream font-light leading-tight truncate">{priestName}</p>
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
        </div>

        <NavLinks />

        {/* User */}
        <div className="px-6 py-5 border-t border-cream/10 flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          <span className="font-inter text-xs text-cream/50">Account</span>
        </div>
      </aside>

      {/* ── Mobile top bar (< lg) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-burgundy-800 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Ad Altare"
            width={540}
            height={205}
            className="h-8 w-auto"
            quality={100}
          />
        </Link>
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1 text-cream/70 hover:text-cream transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-near-black/60" onClick={close} />

          <div className="relative w-72 max-w-[85vw] bg-burgundy-800 flex flex-col shadow-xl">
            {/* Drawer header */}
            <div className="px-4 py-4 border-b border-cream/10 flex items-center justify-between">
              <Link href="/" onClick={close}>
                <Image
                  src="/images/logo.png"
                  alt="Ad Altare"
                  width={540}
                  height={205}
                  className="h-9 w-auto"
                  quality={100}
                />
              </Link>
              <button onClick={close} aria-label="Close menu" className="p-1 text-cream/60 hover:text-cream transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Priest identity */}
            <div className="px-5 py-4 border-b border-cream/10 flex items-center gap-3">
              <ProfilePhoto />
              <div className="min-w-0">
                <p className="font-cormorant text-lg text-cream font-light leading-tight truncate">{priestName}</p>
                <a
                  href={`/p/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="font-inter text-xs text-cream/40 hover:text-gold-400 transition-colors flex items-center gap-1 mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  View public page
                </a>
              </div>
            </div>

            <NavLinks />

            {/* User */}
            <div className="px-6 py-5 border-t border-cream/10 flex items-center gap-3">
              <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
              <span className="font-inter text-xs text-cream/50">Account</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
