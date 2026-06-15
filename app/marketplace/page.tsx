'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, Wrench, ChevronRight, HelpCircle, Loader2, Tag, 
  ShoppingBag, Truck, ExternalLink, ShieldCheck, Check, 
  ShoppingCart, Star, ArrowLeft 
} from 'lucide-react';

export default function PartsMarketplacePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-zinc-400">Loading parts marketplace...</p>
        </div>
      </div>
    }>
      <PartsMarketplaceContent />
    </Suspense>
  );
}

interface Part {
  id: string;
  name: string;
  type: string;
  category: string;
  text: string;
  price: string;
  score: number;
}

function PartsMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialType = searchParams.get('type') || 'All';

  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState(initialType);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    email: '',
    address: '',
    zip: '',
    paymentMethod: 'card'
  });

  const categories = [
    { label: 'All', value: 'All' },
    { label: 'Air Conditioners', value: 'ac' },
    { label: 'Washing Machines', value: 'washer' },
    { label: 'General Tools', value: 'general' }
  ];

  const types = ['All', 'Spare Part', 'Tool', 'Consumable'];

  useEffect(() => {
    async function fetchParts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('query', search);
        if (selectedCategory !== 'All') queryParams.set('category', selectedCategory);

        const res = await fetch(`/api/parts?${queryParams.toString()}`);
        const data = await res.json();
        
        if (data.success) {
          let filteredParts = data.parts;
          if (selectedType !== 'All') {
            filteredParts = filteredParts.filter((p: Part) => p.type === selectedType);
          }
          setParts(filteredParts);
        }
      } catch (err) {
        console.error('Failed to fetch parts', err);
      } finally {
        setLoading(false);
      }
    }

    fetchParts();
  }, [search, selectedCategory, selectedType]);

  // Sync state if URL changes
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || 'All');
    setSelectedType(searchParams.get('type') || 'All');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(search, selectedCategory, selectedType);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    updateUrl(search, category, selectedType);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    updateUrl(search, selectedCategory, type);
  };

  const updateUrl = (searchTerm: string, category: string, type: string) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category !== 'All') params.set('category', category);
    if (type !== 'All') params.set('type', type);
    router.push(`/marketplace?${params.toString()}`);
  };

  const openPurchaseModal = (part: Part) => {
    setSelectedPart(part);
    setPurchaseStep('details');
    setCheckoutForm({
      fullName: '',
      email: '',
      address: '',
      zip: '',
      paymentMethod: 'card'
    });
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseStep('success');
  };

  const getCompatibleInfo = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ac':
        return 'Acme Air Conditioner (650000000000000000000001)';
      case 'washer':
        return 'WashMaster Pro (650000000000000000000003)';
      default:
        return 'Universal (Compatible with all ACs, washing machines, and electronic appliances)';
    }
  };

  const getRandomRating = (id: string) => {
    // Deterministic rating based on id length/hash
    const score = (id.charCodeAt(0) % 5) + 5;
    const rating = score > 9 ? 5.0 : 4.0 + (score % 10) / 10;
    return rating.toFixed(1);
  };

  const getRandomReviews = (id: string) => {
    return (id.charCodeAt(0) * 3) % 150 + 12;
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8 text-white relative">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Parts & Tools Marketplace
            </h1>
            <p className="mt-2 text-zinc-400">
              Procure certified spare parts, professional tools, and repair supplies recommended by Hamic's diagnostic engine.
            </p>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-400">
              <ShieldCheck className="h-4 w-4" />
              100% Genuine Certified Parts
            </span>
          </div>
        </div>

        {/* Filters & Search controls */}
        <div className="mb-8 grid gap-4 md:grid-cols-12 items-center">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search parts, belts, filters, tape..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </form>

          {/* Categories select buttons */}
          <div className="md:col-span-5 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-cyan-500 text-zinc-950 glow-cyan'
                    : 'bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Type filter buttons */}
          <div className="md:col-span-3 flex justify-end gap-1.5 bg-zinc-900 border border-zinc-850 rounded-xl p-1 w-fit ml-auto md:ml-0 md:mr-0">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => handleTypeSelect(t)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all ${
                  selectedType === t
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                {t === 'All' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Results grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : parts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-16 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-zinc-650 mb-4" />
            <h3 className="text-lg font-bold text-white">No items found</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
              We couldn't find any tools or parts matching your current filters. Try relaxing your search terms.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedType('All'); updateUrl('', 'All', 'All'); }}
              className="mt-6 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-350 hover:bg-zinc-800 hover:text-white"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parts.map((part) => (
              <div
                key={part.id}
                className="flex flex-col rounded-2xl bg-zinc-900/40 p-6 border border-zinc-900 hover:border-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 group"
              >
                {/* Badge Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    part.type === 'Spare Part' 
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                      : part.type === 'Tool' 
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}>
                    {part.type}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    Category: {part.category === 'ac' ? 'AC Units' : part.category === 'washer' ? 'Washing' : 'Universal'}
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-md font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {part.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-zinc-500 line-clamp-3 leading-relaxed">
                  {part.text}
                </p>

                {/* Rating & Reviews */}
                <div className="mt-4 flex items-center gap-1 text-zinc-400 text-xs">
                  <div className="flex text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <span className="font-bold text-zinc-300">{getRandomRating(part.id)}</span>
                  <span className="text-zinc-600">•</span>
                  <span>({getRandomReviews(part.id)} reviews)</span>
                </div>

                {/* Price and Action */}
                <div className="mt-6 border-t border-zinc-850 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 block">Retail Price</span>
                    <span className="text-lg font-extrabold text-white">{part.price}</span>
                  </div>
                  
                  <button
                    onClick={() => openPurchaseModal(part)}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-450 px-4 py-2 text-xs font-bold text-zinc-950 transition-all shadow-md shadow-cyan-500/10"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PURCHASE DIALOG MODAL */}
      {selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl rounded-2xl border border-zinc-850 bg-zinc-900 p-6 md:p-8 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedPart(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm bg-zinc-800 hover:bg-zinc-750 p-2 rounded-full transition-colors"
            >
              ✕
            </button>

            {purchaseStep === 'details' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wide">
                    {selectedPart.type}
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold">
                    Category: {selectedPart.category.toUpperCase()}
                  </span>
                </div>

                <h2 className="text-xl font-bold md:text-2xl text-white">
                  {selectedPart.name}
                </h2>
                
                <div className="mt-2 text-zinc-400 leading-relaxed text-sm">
                  {selectedPart.text}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4">
                    <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Retail Price</span>
                    <span className="text-2xl font-black text-white">{selectedPart.price}</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">✓ In Stock & Ready to Ship</span>
                  </div>

                  <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4">
                    <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Estimated Delivery</span>
                    <span className="text-sm font-semibold flex items-center gap-1.5 text-zinc-200 mt-1">
                      <Truck className="h-4 w-4 text-cyan-400" />
                      2-3 Business Days (Standard)
                    </span>
                    <span className="text-[10px] text-zinc-400 block mt-1">Free delivery with Hamic Premium</span>
                  </div>
                </div>

                {/* Compatibility specifications */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Compatible Products</h4>
                  <div className="rounded-xl bg-zinc-950/70 border border-zinc-850 p-3.5 text-sm text-cyan-450 font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>{getCompatibleInfo(selectedPart.category)}</span>
                  </div>
                </div>

                {/* Dealer links */}
                <div className="mt-6 border-t border-zinc-850 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Authorized Retailers</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <a 
                      href="https://amazon.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-3 text-xs text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-900 transition-all"
                    >
                      <span className="font-semibold text-white">Amazon Spares</span>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                    </a>
                    
                    <a 
                      href="https://homedepot.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-3 text-xs text-zinc-300 hover:border-orange-500/50 hover:bg-zinc-900 transition-all"
                    >
                      <span className="font-semibold text-white">Home Depot</span>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                    </a>

                    <div className="flex items-center justify-between rounded-lg bg-cyan-950/30 border border-cyan-800/30 px-3.5 py-3 text-xs text-cyan-300">
                      <div>
                        <span className="font-bold block text-white">Hamic Depot</span>
                        <span className="text-[10px] text-cyan-400">Save 5% Instantly</span>
                      </div>
                      <Check className="h-4 w-4 text-cyan-400" />
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-8 pt-4 border-t border-zinc-850 flex justify-end">
                  <button
                    onClick={() => setPurchaseStep('checkout')}
                    className="w-full sm:w-auto rounded-xl bg-cyan-500 hover:bg-cyan-450 px-8 py-3.5 text-sm font-bold text-zinc-950 transition-all tracking-wider uppercase shadow-lg shadow-cyan-500/10"
                  >
                    Proceed to Order
                  </button>
                </div>
              </div>
            )}

            {purchaseStep === 'checkout' && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <button 
                  type="button"
                  onClick={() => setPurchaseStep('details')}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-white font-bold bg-zinc-800 px-3 py-1.5 rounded-lg mb-4"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>

                <h3 className="text-lg font-bold text-white border-b border-zinc-850 pb-2">
                  Hamic Quick Checkout
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-450">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      value={checkoutForm.fullName}
                      onChange={(e) => setCheckoutForm({...checkoutForm, fullName: e.target.value})}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-850 p-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-450">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="john@example.com"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-850 p-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-450">Shipping Address</label>
                  <input 
                    type="text" 
                    required
                    placeholder="123 Repair Lane, Techville"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-850 p-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-450">Zip / Postal Code</label>
                    <input 
                      type="text" 
                      required
                      placeholder="94043"
                      value={checkoutForm.zip}
                      onChange={(e) => setCheckoutForm({...checkoutForm, zip: e.target.value})}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-850 p-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-450">Payment Method</label>
                    <select 
                      value={checkoutForm.paymentMethod}
                      onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-850 p-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    >
                      <option value="card">Credit / Debit Card</option>
                      <option value="cod">Cash on Delivery</option>
                      <option value="care">Hamic Care Warranty Plan</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-850 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-zinc-400">Total Charged:</span>
                    <span className="text-xl font-extrabold text-white">{selectedPart.price}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-450 py-3.5 text-sm font-bold text-zinc-950 tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/10"
                  >
                    Confirm Purchase
                  </button>
                </div>
              </form>
            )}

            {purchaseStep === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-black text-white">Order Confirmed!</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Thank you for your order. A confirmation email and tracking link have been dispatched to <strong className="text-white">{checkoutForm.email}</strong>.
                </p>

                <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4 max-w-sm mx-auto text-left space-y-2 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Order Reference:</span>
                    <span className="font-bold text-white uppercase">HM-{Math.random().toString(36).substr(2, 9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Arrival:</span>
                    <span className="font-bold text-cyan-400">3 Days (Free Shipping)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ship To:</span>
                    <span className="font-bold text-zinc-200">{checkoutForm.address}</span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="rounded-lg bg-zinc-800 border border-zinc-750 px-6 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
