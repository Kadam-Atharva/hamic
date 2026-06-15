'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wrench, CheckCircle, AlertTriangle, Calendar, 
  Trash2, ArrowRight, ShieldCheck, Clock, RefreshCw 
} from 'lucide-react';

export default function MyProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ownedProducts, setOwnedProducts] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load user session and owned products list
  const loadData = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push('/login?redirect=/my-products');
        return;
      }
      setUser(authData.user);

      const productsRes = await fetch('/api/my-products');
      const productsData = await productsRes.json();
      if (productsData.success) {
        setOwnedProducts(productsData.ownedProducts);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to stop tracking maintenance for this product? All tasks will be deleted.')) {
      return;
    }
    setActionLoading(productId);
    try {
      const res = await fetch('/api/my-products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Failed to remove product');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setActionLoading(taskId);
    try {
      const res = await fetch('/api/my-products/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: !currentCompleted })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Failed to update task');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Compile tasks
  const allTasks = ownedProducts.flatMap(op => 
    op.tasks.map((t: any) => ({
      ...t,
      productName: op.product.name,
      productImage: op.product.imageUrl
    }))
  );

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);
  
  const overdueTasks = now ? allTasks.filter(t => !t.completed && new Date(t.dueDate) < now) : [];
  const upcomingTasks = now ? allTasks.filter(t => !t.completed && new Date(t.dueDate) >= now) : [];
  const completedTasks = allTasks.filter(t => t.completed).sort((a, b) => new Date(b.completedAt || b.dueDate).getTime() - new Date(a.completedAt || a.dueDate).getTime());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-zinc-500 font-semibold">Loading your inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            My Support Dashboard
          </h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xl">
            Manage your registered appliances, perform diagnostic sessions, and track scheduled maintenance reminders.
          </p>
        </div>

        {ownedProducts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-12 text-center max-w-md mx-auto mt-8">
            <Wrench className="mx-auto h-12 w-12 text-zinc-700" />
            <h3 className="mt-4 text-lg font-bold text-white">No products registered</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Browse products in the marketplace and click "Track Maintenance" to monitor schedules and get help.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 px-4 py-2 text-sm font-bold text-zinc-950 transition-all shadow-md shadow-cyan-500/5"
            >
              Go to Marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Owned Products List */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Wrench className="h-4 w-4 text-cyan-400" />
                My Equipment ({ownedProducts.length})
              </h2>

              <div className="flex flex-col gap-4">
                {ownedProducts.map((op) => (
                  <div 
                    key={op._id} 
                    className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 hover:border-zinc-800 transition-all relative overflow-hidden group"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="h-14 w-14 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 overflow-hidden">
                        {op.product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={op.product.imageUrl} alt={op.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <Wrench className="h-6 w-6 text-zinc-750" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{op.product.name}</h4>
                        <p className="text-[11px] text-zinc-500 font-medium uppercase mt-0.5">{op.product.category}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between gap-3">
                      <Link
                        href={`/products/${op.productId}`}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all"
                      >
                        Troubleshoot
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      
                      <button
                        onClick={() => handleRemoveProduct(op.productId)}
                        disabled={actionLoading === op.productId}
                        className="text-zinc-650 hover:text-red-400 p-1 rounded transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Columns: Maintenance Tasks Panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue Attention ({overdueTasks.length})
                  </h2>

                  <div className="flex flex-col gap-3">
                    {overdueTasks.map((t) => (
                      <div 
                        key={t._id} 
                        className="rounded-xl border border-red-500/20 bg-red-950/5 p-4 flex items-start gap-4 hover:border-red-500/35 transition-all"
                      >
                        <button
                          onClick={() => handleToggleTask(t._id, t.completed)}
                          disabled={actionLoading === t._id}
                          className="mt-0.5 h-5 w-5 rounded-md border border-red-500/40 hover:border-red-500 flex items-center justify-center shrink-0 bg-transparent transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5 opacity-0 hover:opacity-100 text-red-400 transition-opacity" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-zinc-100">{t.title}</h4>
                            <span className="text-[10px] rounded px-1.5 py-0.5 font-bold uppercase tracking-wider bg-red-500/10 text-red-400">
                              Overdue
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                          <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-550 font-medium">
                            <span className="flex items-center gap-1 text-red-400/80">
                              <Calendar className="h-3 w-3" />
                              Was due {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="truncate">Product: {t.productName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Tasks */}
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  Upcoming Maintenance ({upcomingTasks.length})
                </h2>

                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6 border border-dashed border-zinc-900 rounded-xl bg-zinc-900/5">
                    No upcoming maintenance tasks. You are all set!
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {upcomingTasks.map((t) => {
                      const daysRemaining = now ? Math.max(0, Math.ceil((new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      
                      return (
                        <div 
                          key={t._id} 
                          className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 flex items-start gap-4 hover:border-zinc-800 transition-all"
                        >
                          <button
                            onClick={() => handleToggleTask(t._id, t.completed)}
                            disabled={actionLoading === t._id}
                            className="mt-0.5 h-5 w-5 rounded-md border border-zinc-800 hover:border-cyan-500 flex items-center justify-center shrink-0 bg-transparent transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5 opacity-0 hover:opacity-100 text-cyan-400 transition-opacity" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-zinc-100">{t.title}</h4>
                              <span className="text-[10px] rounded px-1.5 py-0.5 font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
                                Every {t.intervalMonths} mo
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                            <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-550 font-medium">
                              <span className="flex items-center gap-1 text-cyan-400/80">
                                <Clock className="h-3 w-3" />
                                In {daysRemaining} days ({new Date(t.dueDate).toLocaleDateString()})
                              </span>
                              <span>•</span>
                              <span className="truncate">Product: {t.productName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History / Completed Logs */}
              {completedTasks.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-zinc-400 flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Completed Actions Log ({completedTasks.length})
                  </h2>

                  <div className="flex flex-col gap-3">
                    {completedTasks.map((t) => (
                      <div 
                        key={t._id} 
                        className="rounded-xl border border-zinc-900/60 bg-zinc-900/10 p-4 flex items-start gap-4 opacity-60"
                      >
                        <div className="mt-0.5 h-5 w-5 rounded-md border border-emerald-500/20 flex items-center justify-center shrink-0 bg-emerald-950/10">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-zinc-300 line-through">{t.title}</h4>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-550 font-medium">
                            <span className="text-emerald-400/70">
                              Completed {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'recently'}
                            </span>
                            <span>•</span>
                            <span className="truncate">Product: {t.productName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
