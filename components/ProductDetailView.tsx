'use client';

import React, { useState } from 'react';
import { 
  Wrench, FileText, Link as LinkIcon, Info, MessageSquare, 
  ExternalLink, Download, FileText as DocIcon, Eye, ArrowLeft, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import DiagnosticAssistant from './DiagnosticAssistant';

interface ProductDetailViewProps {
  product: any;
  materials: any[];
}

export default function ProductDetailView({ product, materials }: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'assistant'>('overview');
  const [expandedTextDoc, setExpandedTextDoc] = useState<string | null>(null);
  
  // Track inventory state
  const [isOwned, setIsOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);

  React.useEffect(() => {
    async function checkOwnership() {
      try {
        const res = await fetch('/api/my-products');
        const data = await res.json();
        if (data.success && data.ownedProducts) {
          const exists = data.ownedProducts.some((op: any) => op.productId === product._id);
          setIsOwned(exists);
        }
      } catch (err) {
        console.error('Check ownership error:', err);
      } finally {
        setCheckingOwnership(false);
      }
    }
    checkOwnership();
  }, [product._id]);

  const handleTrackMaintenance = async () => {
    setTrackingLoading(true);
    try {
      const res = await fetch('/api/my-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id })
      });
      const data = await res.json();
      if (data.success) {
        setIsOwned(true);
      } else {
        alert(data.error || 'Failed to add product to inventory');
      }
    } catch (err) {
      console.error('Failed to track product:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const toggleExpandText = (id: string) => {
    if (expandedTextDoc === id) {
      setExpandedTextDoc(null);
    } else {
      setExpandedTextDoc(id);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Link */}
        <Link 
          href="/products" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Marketplace
        </Link>

        {/* Product Hero Banner */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 sm:p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>
          
          {/* Image */}
          <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-650 shrink-0 overflow-hidden">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Wrench className="h-10 w-10 text-zinc-750" />
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                {product.category}
              </span>
              
              {!checkingOwnership && (
                isOwned ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Tracking Maintenance
                  </span>
                ) : (
                  <button
                    onClick={handleTrackMaintenance}
                    disabled={trackingLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-all shadow-md shadow-cyan-500/5"
                  >
                    {trackingLoading ? 'Adding...' : 'Track Maintenance'}
                  </button>
                )
              )}
            </div>
            
            <h1 className="text-2xl font-extrabold text-white mt-3 sm:text-3xl">{product.name}</h1>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-2xl">{product.description}</p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex border-b border-zinc-900 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-550 hover:text-white'
            }`}
          >
            <Info className="h-4 w-4" />
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'docs'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-550 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            Documentation ({materials.length})
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'assistant'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-550 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Diagnostic Assistant
          </button>
        </div>

        {/* Tab Contents */}
        <div className="transition-all duration-300">
          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-8 md:grid-cols-3">
              {/* Description */}
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6">
                  <h2 className="text-lg font-bold text-white mb-4">About this Product</h2>
                  <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Specs Table */}
              <div className="md:col-span-1">
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Technical Specifications</h2>
                  {product.specs && product.specs.length > 0 ? (
                    <div className="flex flex-col divide-y divide-zinc-900">
                      {product.specs.map((spec: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-3 text-xs">
                          <span className="text-zinc-500 font-medium">{spec.label}</span>
                          <span className="text-zinc-200 font-semibold text-right">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-650 italic">No specifications listed.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Documentation Tab */}
          {activeTab === 'docs' && (
            <div>
              <h2 className="text-lg font-bold text-white mb-5">Knowledge Base & Manuals</h2>
              {materials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-900 p-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">No support materials are uploaded for this product yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {materials.map((m) => (
                    <div 
                      key={m._id}
                      className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-5 flex flex-col justify-between hover:border-zinc-850 hover:bg-zinc-900/30 transition-all group"
                    >
                      <div>
                        {/* Type Icon Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            m.type === 'pdf' ? 'bg-red-500/10 text-red-400' :
                            m.type === 'text' ? 'bg-emerald-500/10 text-emerald-400' :
                            m.type === 'link' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {m.type}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                          {m.title}
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Added: {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action buttons based on type */}
                      <div className="mt-6 border-t border-zinc-900 pt-4">
                        {m.type === 'pdf' && m.contentUrl && (
                          <a
                            href={m.contentUrl}
                            download
                            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-zinc-950 border border-zinc-850 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF Manual
                          </a>
                        )}

                        {m.type === 'link' && m.contentUrl && (
                          <a
                            href={m.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-zinc-950 border border-zinc-850 py-2 text-xs font-semibold text-cyan-400 hover:text-white hover:bg-zinc-900 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Resource Link
                          </a>
                        )}

                        {m.type === 'text' && (
                          <div className="space-y-3">
                            <button
                              onClick={() => toggleExpandText(m._id)}
                              className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-zinc-950 border border-zinc-850 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {expandedTextDoc === m._id ? 'Hide Content' : 'Read Content'}
                            </button>
                            {expandedTextDoc === m._id && (
                              <div className="rounded bg-zinc-950 p-3 border border-zinc-900 text-[10px] font-mono text-zinc-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-normal">
                                {m.rawText || 'No text content available.'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Diagnostic Assistant Tab */}
          {activeTab === 'assistant' && (
            <DiagnosticAssistant productId={product._id} productCategory={product.category} />
          )}
        </div>
      </div>
    </div>
  );
}
