'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Wrench, LayoutDashboard, Store, LogOut, User, LogIn, Menu, X, ShieldAlert, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  initialUser: any;
}

export default function Navbar({ initialUser }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(initialUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync state if initialUser changes
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

    // Check auth client-side periodically or on navigation to keep in sync
    useEffect(() => {
      async function checkAuth() {
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Navbar auth check failed', err);
        }
      }
      
      checkAuth();
    }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 glow-cyan">
                <Wrench className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
              </div>
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                HAMIC
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                pathname === '/products' ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Store className="h-4 w-4" />
              Marketplace
            </Link>

            <Link
              href="/marketplace"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                pathname === '/marketplace' ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Parts & Tools
            </Link>

            {user?.role === 'company' && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard') ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Company Dashboard
              </Link>
            )}

            {user?.role === 'user' && (
              <Link
                href="/my-products"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/my-products') ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wrench className="h-4 w-4" />
                My Products
              </Link>
            )}
          </div>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 border border-zinc-800">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-zinc-300 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'company' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-transparent px-3 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-900 hover:text-zinc-200"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-600 text-zinc-950 px-4 py-2 text-sm font-semibold transition-all glow-cyan"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-4 md:hidden flex flex-col gap-4">
          <Link
            href="/products"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-base font-medium py-2 ${
              pathname === '/products' ? 'text-cyan-400' : 'text-zinc-400'
            }`}
          >
            <Store className="h-5 w-5" />
            Marketplace
          </Link>

          <Link
            href="/marketplace"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-base font-medium py-2 ${
              pathname === '/marketplace' ? 'text-cyan-400' : 'text-zinc-400'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            Parts & Tools
          </Link>

          {user?.role === 'company' && (
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2 text-base font-medium py-2 ${
                pathname.startsWith('/dashboard') ? 'text-cyan-400' : 'text-zinc-400'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              Company Dashboard
            </Link>
          )}

          {user?.role === 'user' && (
            <Link
              href="/my-products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2 text-base font-medium py-2 ${
                pathname.startsWith('/my-products') ? 'text-cyan-400' : 'text-zinc-400'
              }`}
            >
              <Wrench className="h-5 w-5" />
              My Products
            </Link>
          )}

          <hr className="border-zinc-850" />

          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 py-2">
                <User className="h-5 w-5 text-cyan-400" />
                <span className="text-base text-zinc-300">{user.name}</span>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-xs font-bold text-cyan-400 uppercase">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-zinc-950"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
