'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Wrench, FileText, Cpu, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/products');
    }
  };

  const categories = [
    { name: 'Air Conditioners', count: 12, icon: '❄️' },
    { name: 'Washing Machines', count: 8, icon: '🧺' },
    { name: 'Water Purifiers', count: 5, icon: '💧' },
    { name: 'Consumer Electronics', count: 19, icon: '📱' },
    { name: 'Scooters & Mobility', count: 6, icon: '🛵' },
    { name: 'Industrial Equipment', count: 4, icon: '⚙️' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none pulse-glow"></div>

      <div className="z-10 w-full max-w-5xl text-center">
        {/* Banner badge */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-4 py-1.5 text-xs font-semibold text-cyan-400">
          <ShieldCheck className="h-4 w-4" />
          Powered by Trusted Manufacturer Manuals
        </div>

        {/* Hero title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          The Intelligent Support Assistant for{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Every Product
          </span>
        </h1>

        {/* Hero description */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
          Stop digging through complex PDF manuals. Our diagnostic support assistant functions like a virtual mechanic, investigating symptoms and isolating solutions step-by-step.
        </p>

        {/* Large search bar */}
        <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
          <div className="relative flex items-center rounded-2xl bg-zinc-900/90 p-2 border border-zinc-800 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 shadow-2xl transition-all">
            <Search className="ml-3 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search for your product (e.g. Acme Air Conditioner, WashX Pro)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-base text-white placeholder-zinc-500 outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-6 py-3 font-semibold text-zinc-950 transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/products"
            className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-850 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-all"
          >
            Browse Marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register?role=company"
            className="rounded-lg bg-transparent border border-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
          >
            Register Company
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="mt-20">
          <h2 className="text-xl font-bold tracking-tight text-white mb-8">
            Explore Support by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/40 p-6 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/70 transition-all group"
              >
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-zinc-300 text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-28 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/20 border border-zinc-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
              <Wrench className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Technician Reasoning</h3>
            <p className="mt-2 text-sm text-zinc-500 text-center">
              Our assistant diagnoses through step-by-step testing and elimination of possible failures rather than just returning documents.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/20 border border-zinc-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Manufacturer Verified</h3>
            <p className="mt-2 text-sm text-zinc-500 text-center">
              All answers are sourced directly from verified manufacturer support manuals, text guides, and video resources.
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/20 border border-zinc-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Hybrid Core</h3>
            <p className="mt-2 text-sm text-zinc-500 text-center">
              Operates instantly via local diagnostic engine rule-trees, and leverages Gemini Generative AI when keys are supplied.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
