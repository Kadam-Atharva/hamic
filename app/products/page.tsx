'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Wrench, FileText, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';

// Main Marketplace Component wrapped in Suspense
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-zinc-400">Loading marketplace...</p>
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All',
    'Air Conditioners',
    'Washing Machines',
    'Water Purifiers',
    'Consumer Electronics',
    'Scooters & Mobility',
    'Industrial Equipment'
  ];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== 'All') queryParams.set('category', selectedCategory);
        if (search) queryParams.set('search', search);

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [search, selectedCategory]);

  // Sync state if URL changes
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(search, selectedCategory);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    updateUrl(search, category);
  };

  const updateUrl = (searchTerm: string, category: string) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category !== 'All') params.set('category', category);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Product Marketplace
          </h1>
          <p className="mt-2 text-zinc-400">
            Search for registered machinery, consumer appliances, or electronics to troubleshoot issues or download manuals.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search products by model or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </form>

          {/* Categories bar */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-zinc-950 glow-cyan'
                    : 'bg-zinc-905 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-16 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
              We couldn't find any products matching your search criteria. Try using different keywords or select another category.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); updateUrl('', 'All'); }}
              className="mt-6 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-350 hover:bg-zinc-800 hover:text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product._id}
                className="flex flex-col rounded-2xl bg-zinc-900/40 p-6 border border-zinc-900 hover:border-zinc-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 group"
              >
                {/* Product Image Fallback or Actual */}
                <div className="relative mb-5 flex h-48 w-full items-center justify-center rounded-xl bg-zinc-950/80 border border-zinc-900 overflow-hidden">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                      <Wrench className="h-10 w-10 text-zinc-700" />
                      <span className="text-xs uppercase tracking-wider">No Image Uploaded</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 rounded bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    {product.category}
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {product.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-zinc-500 line-clamp-3">
                  {product.description}
                </p>

                {/* Specs teaser */}
                {product.specs && product.specs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.specs.slice(0, 2).map((spec: any, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="rounded bg-zinc-900 border border-zinc-850 px-2 py-1 text-[10px] font-semibold text-zinc-400"
                      >
                        {spec.label}: {spec.value}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-zinc-850/60 pt-4 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Registered: {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                  
                  <Link
                    href={`/products/${product._id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-cyan-500/25 px-4 py-2 text-xs font-bold text-cyan-400 transition-all hover:text-white"
                  >
                    Troubleshoot
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
