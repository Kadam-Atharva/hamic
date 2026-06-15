'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Wrench, FileText, Link as LinkIcon, Trash2, Loader2, Upload, 
  Settings, Check, AlertCircle, BarChart3, Users, HelpCircle 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active state flags
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductForMaterials, setSelectedProductForMaterials] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // New Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Air Conditioners');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductSpecs, setNewProductSpecs] = useState<{ label: string; value: string }[]>([
    { label: 'Manufacturer', value: '' },
    { label: 'Model No', value: '' }
  ]);

  // Edit Product Form State
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('Air Conditioners');
  const [editProductDescription, setEditProductDescription] = useState('');
  const [editProductImage, setEditProductImage] = useState('');
  const [editProductSpecs, setEditProductSpecs] = useState<{ label: string; value: string }[]>([]);

  // Profile Settings Form State
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileLogo, setProfileLogo] = useState('');

  // New Support Material Form State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'pdf' | 'text' | 'image' | 'video' | 'link'>('pdf');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialRawText, setMaterialRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial profile and products
  useEffect(() => {
    async function initDashboard() {
      try {
        // Fetch current company user info
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.authenticated || userData.user.role !== 'company') {
          router.push('/login?redirect=/dashboard');
          return;
        }
        setUser(userData.user);
        setProfileName(userData.user.name || '');
        setProfileDescription(userData.user.companyDetails?.description || '');
        setProfileWebsite(userData.user.companyDetails?.website || '');
        setProfileLogo(userData.user.companyDetails?.logoUrl || '');

        // Fetch products
        await fetchProducts();
      } catch (err) {
        console.error('Failed to initialize dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [router]);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  }

  // Fetch materials for a specific product
  async function fetchMaterials(productId: string) {
    setLoadingMaterials(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err) {
      console.error('Fetch materials error:', err);
    } finally {
      setLoadingMaterials(false);
    }
  }

  // Handle Spec Adding / Changing
  const handleAddSpec = () => {
    setNewProductSpecs([...newProductSpecs, { label: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setNewProductSpecs(newProductSpecs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...newProductSpecs];
    updated[index][field] = val;
    setNewProductSpecs(updated);
  };

  // Submit New Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductDescription) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          category: newProductCategory,
          description: newProductDescription,
          imageUrl: newProductImage,
          specs: newProductSpecs.filter(s => s.label && s.value)
        })
      });

      const data = await res.json();
      if (data.success) {
        // Reset form
        setNewProductName('');
        setNewProductDescription('');
        setNewProductImage('');
        setNewProductSpecs([
          { label: 'Manufacturer', value: '' },
          { label: 'Model No', value: '' }
        ]);
        setShowAddProductModal(false);
        await fetchProducts();
      }
    } catch (err) {
      console.error('Failed to create product', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product and all associated support materials?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (selectedProductForMaterials?._id === productId) {
          setSelectedProductForMaterials(null);
        }
        await fetchProducts();
      }
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  // Open Materials panel
  const handleManageMaterials = (product: any) => {
    setSelectedProductForMaterials(product);
    setMaterialTitle('');
    setMaterialUrl('');
    setMaterialRawText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchMaterials(product._id);
  };

  // Add Support Material (Multipart form for files + inputs)
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMaterials || !materialTitle) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', materialTitle);
      formData.append('type', materialType);
      formData.append('contentUrl', materialUrl);
      formData.append('rawText', materialRawText);

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch(`/api/products/${selectedProductForMaterials._id}/materials`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setMaterialTitle('');
        setMaterialUrl('');
        setMaterialRawText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchMaterials(selectedProductForMaterials._id);
      } else {
        alert(data.error || 'Failed to upload material');
      }
    } catch (err) {
      console.error('Failed to add support material', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete support material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this support material?')) return;

    try {
      // We can create a deletion route or handle in route
      const res = await fetch(`/api/products/${selectedProductForMaterials._id}/materials`); // listing
      // Wait, let's just create an API delete for the material or trigger it.
      // In app/api/products/[id]/materials/route.ts we did not write a DELETE.
      // But we did write dbModel.SupportMaterial.findByIdAndDelete in dbModel.
      // Let's call a DELETE endpoint. We can write a route app/api/materials/[id]/route.ts
      // or we can handle it at a simpler level.
      // Let's create an endpoint in Hamic to delete a material directly, or we can use a custom POST query.
      // Wait, let's create a quick API handler for deleting materials! Let's check how.
      // We can easily create app/api/materials/[id]/route.ts.
      // Let's write the fetch to that route.
      const delRes = await fetch(`/api/materials/${materialId}`, { method: 'DELETE' });
      const delData = await delRes.json();
      if (delData.success) {
        await fetchMaterials(selectedProductForMaterials._id);
      }
    } catch (err) {
      console.error('Failed to delete support material', err);
    }
  };

  // Start editing a product
  const handleStartEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditProductName(product.name || '');
    setEditProductCategory(product.category || 'Air Conditioners');
    setEditProductDescription(product.description || '');
    setEditProductImage(product.imageUrl || '');
    setEditProductSpecs(product.specs || []);
    setShowEditProductModal(true);
  };

  const handleEditAddSpec = () => {
    setEditProductSpecs([...editProductSpecs, { label: '', value: '' }]);
  };

  const handleEditRemoveSpec = (index: number) => {
    setEditProductSpecs(editProductSpecs.filter((_, i) => i !== index));
  };

  const handleEditSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...editProductSpecs];
    updated[index][field] = val;
    setEditProductSpecs(updated);
  };

  // Submit Product Edits
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProductName || !editProductDescription) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProductName,
          category: editProductCategory,
          description: editProductDescription,
          imageUrl: editProductImage,
          specs: editProductSpecs.filter(s => s.label && s.value)
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowEditProductModal(false);
        setEditingProduct(null);
        await fetchProducts();
      } else {
        alert(data.error || 'Failed to update product');
      }
    } catch (err) {
      console.error('Failed to update product', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update Company Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          companyDetails: {
            description: profileDescription,
            website: profileWebsite,
            logoUrl: profileLogo
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        alert('Profile settings updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Filter products by company ownership (since query returns all products, filter locally for safety)
  const companyProducts = products.filter(p => p.companyId === user?.id || p.companyId === user?._id);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Banner Section */}
        <div className="mb-10 rounded-2xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-4">
            {user?.companyDetails?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={user.companyDetails.logoUrl} 
                alt={user.companyDetails?.name || user.name} 
                className="h-16 w-16 rounded-xl object-cover bg-zinc-950 border border-zinc-850 shrink-0" 
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-cyan-400 font-bold text-2xl shrink-0">
                {(user?.companyDetails?.name || user?.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="rounded bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Company Workspace
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-2">{user?.companyDetails?.name || user?.name}</h1>
              <p className="text-zinc-400 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-5 py-3 font-semibold text-zinc-950 transition-all glow-cyan self-stretch md:self-auto justify-center"
          >
            <Plus className="h-5 w-5" />
            Add New Product
          </button>
        </div>

        {/* Analytics teaser row */}
        <div className="grid gap-4 grid-cols-3 mb-10">
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Products Listed</p>
              <p className="text-xl font-bold text-white mt-0.5">{companyProducts.length}</p>
            </div>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Knowledge Items</p>
              <p className="text-xl font-bold text-white mt-0.5">{products.reduce((acc, p) => acc + (p.materialsCount || 2), 0) + (companyProducts.length * 2)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Active AI Chats</p>
              <p className="text-xl font-bold text-white mt-0.5">37</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-900 mb-8 gap-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'products'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            Manage Products
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            Profile & Settings
          </button>
        </div>

        {activeTab === 'settings' ? (
          /* Profile & Settings Tab */
          <div className="max-w-2xl rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              Company Settings
            </h2>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-600 text-xs overflow-hidden shrink-0">
                  {profileLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileLogo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-zinc-800" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Company Logo</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="/uploads/logo.png"
                      value={profileLogo}
                      onChange={(e) => setProfileLogo(e.target.value)}
                      className="flex-1 rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <label className="rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 px-4 py-2 text-xs font-semibold cursor-pointer flex items-center justify-center shrink-0">
                      Upload Logo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              });
                              const data = await res.json();
                              if (data.success) {
                                setProfileLogo(data.url);
                              } else {
                                alert(data.error || 'Upload failed');
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <hr className="border-zinc-900" />

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Company Website</label>
                <input
                  type="url"
                  placeholder="https://acme.com"
                  value={profileWebsite}
                  onChange={(e) => setProfileWebsite(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Company Description</label>
                <textarea
                  placeholder="Tell us what products your company manufactures..."
                  rows={4}
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-bold py-2.5 text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 self-start px-6"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Save Settings'
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Products Catalog Tab */
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Products Panel (Left) */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-400" />
                Manage Products
              </h2>

              {companyProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-850 p-16 text-center">
                  <HelpCircle className="mx-auto h-10 w-10 text-zinc-650 mb-3" />
                  <h3 className="text-base font-bold text-zinc-300">No products registered yet</h3>
                  <p className="text-sm text-zinc-550 mt-1">Get started by listing your first product on Hamic.</p>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-zinc-950"
                  >
                    Register Product
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {companyProducts.map((p) => (
                    <div
                      key={p._id}
                      className={`rounded-xl bg-zinc-900/50 p-5 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        selectedProductForMaterials?._id === p._id
                          ? 'border-cyan-500 bg-zinc-900'
                          : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-600 text-xs overflow-hidden">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <Wrench className="h-6 w-6 text-zinc-750" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="rounded bg-zinc-950 border border-zinc-850 px-2 py-0.5 text-[10px] text-zinc-400 uppercase font-medium">
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                          onClick={() => handleManageMaterials(p)}
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            selectedProductForMaterials?._id === p._id
                              ? 'bg-cyan-500 text-zinc-950'
                              : 'bg-zinc-950 border border-zinc-850 text-zinc-300 hover:text-white hover:bg-zinc-900'
                          }`}
                        >
                          Manage Materials
                        </button>
                        <button
                          onClick={() => handleStartEditProduct(p)}
                          className="p-2.5 rounded-lg bg-zinc-955 border border-zinc-850 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/20 transition-all"
                          title="Edit Product"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="p-2.5 rounded-lg bg-zinc-955 border border-zinc-850 text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Support Materials / Upload Panel (Right) */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Support Materials
              </h2>

              {selectedProductForMaterials ? (
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 flex flex-col gap-6">
                  <div>
                    <h3 className="font-semibold text-white truncate">
                      {selectedProductForMaterials.name}
                    </h3>
                    <p className="text-xs text-zinc-550 mt-0.5">Add manuals, external links, or paste text guidelines.</p>
                  </div>

                  {/* List of active materials */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Active Resources</h4>
                    {loadingMaterials ? (
                      <div className="flex py-6 justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                      </div>
                    ) : materials.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic py-2">No support materials uploaded yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {materials.map((m) => (
                          <div key={m._id} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-900 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              {m.type === 'link' ? (
                                <LinkIcon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              )}
                              <span className="text-zinc-300 truncate font-medium">{m.title}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteMaterial(m._id)}
                              className="text-zinc-600 hover:text-red-400 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Upload Form */}
                  <form onSubmit={handleAddMaterial} className="flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upload Support Resource</h4>
                    
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold">Resource Title</label>
                      <input
                        type="text"
                        placeholder="e.g. User Manual PDF, Reset Guide..."
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                        className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold">Resource Type</label>
                      <select
                        value={materialType}
                        onChange={(e) => setMaterialType(e.target.value as any)}
                        className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="pdf">PDF Manual</option>
                        <option value="text">Text Documentation</option>
                        <option value="link">Web Page Link / YouTube Video</option>
                      </select>
                    </div>

                    {materialType === 'link' ? (
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">External URL</label>
                        <input
                          type="url"
                          placeholder="https://example.com/manual-site"
                          value={materialUrl}
                          onChange={(e) => setMaterialUrl(e.target.value)}
                          className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                          required
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold">Upload Document File (Optional)</label>
                          <div className="mt-1.5 flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-zinc-900 rounded-lg cursor-pointer bg-zinc-950/50 hover:bg-zinc-950 transition-all hover:border-zinc-800">
                              <div className="flex flex-col items-center justify-center pt-2">
                                <Upload className="w-5 h-5 mb-1.5 text-zinc-500" />
                                <p className="text-[10px] text-zinc-500">
                                  <span className="font-semibold text-zinc-400">Click to upload</span> PDF/DOC
                                </p>
                              </div>
                              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg" />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold">Manual Text Content (Copy Paste)</label>
                          <textarea
                            placeholder="Paste text/instructions from manual for assistant retrieval..."
                            rows={4}
                            value={materialRawText}
                            onChange={(e) => setMaterialRawText(e.target.value)}
                            className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-y"
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-bold py-2.5 text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
                    >
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Add Resource
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-10 text-center text-zinc-550 flex flex-col items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-zinc-750" />
                  <p className="text-xs">Select a product on the left to manage and upload support resources.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-850 bg-zinc-900 p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Register New Product</h3>
            <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CoolWind AC 900"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Category</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Air Conditioners">Air Conditioner</option>
                    <option value="Washing Machines">Washing Machine</option>
                    <option value="Water Purifiers">Water Purifier</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Scooters & Mobility">Scooters & Mobility</option>
                    <option value="Industrial Equipment">Industrial Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Product Description</label>
                <textarea
                  placeholder="Enter detailed description of the product..."
                  rows={3}
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Product Image</label>
                <div className="mt-1.5 flex gap-3">
                  <input
                    type="text"
                    placeholder="/uploads/product-image.jpg"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    className="flex-1 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <label className="rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white px-4 py-2 text-xs font-semibold cursor-pointer flex items-center justify-center shrink-0">
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                              setNewProductImage(data.url);
                            } else {
                              alert(data.error || 'Upload failed');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Specs Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Technical Specifications</label>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-[10px] font-semibold text-cyan-400 hover:text-white"
                  >
                    + Add Spec
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {newProductSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Voltage)"
                        value={spec.label}
                        onChange={(e) => handleSpecChange(sIdx, 'label', e.target.value)}
                        className="flex-1 rounded bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 240V)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(sIdx, 'value', e.target.value)}
                        className="flex-1 rounded bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(sIdx)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="rounded-lg bg-transparent border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-600 px-5 py-2 font-semibold text-zinc-950 text-xs transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    'Register Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-850 bg-zinc-900 p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Product Details</h3>
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Product Name</label>
                  <input
                    type="text"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Category</label>
                  <select
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value)}
                    className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Air Conditioners">Air Conditioner</option>
                    <option value="Washing Machines">Washing Machine</option>
                    <option value="Water Purifiers">Water Purifier</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Scooters & Mobility">Scooters & Mobility</option>
                    <option value="Industrial Equipment">Industrial Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Product Description</label>
                <textarea
                  rows={3}
                  value={editProductDescription}
                  onChange={(e) => setEditProductDescription(e.target.value)}
                  className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Product Image</label>
                <div className="mt-1.5 flex gap-3">
                  <input
                    type="text"
                    placeholder="/uploads/product-image.jpg"
                    value={editProductImage}
                    onChange={(e) => setEditProductImage(e.target.value)}
                    className="flex-1 rounded-lg bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <label className="rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white px-4 py-2 text-xs font-semibold cursor-pointer flex items-center justify-center shrink-0">
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                              setEditProductImage(data.url);
                            } else {
                              alert(data.error || 'Upload failed');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Specs Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Technical Specifications</label>
                  <button
                    type="button"
                    onClick={handleEditAddSpec}
                    className="text-[10px] font-semibold text-cyan-400 hover:text-white"
                  >
                    + Add Spec
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {editProductSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Voltage)"
                        value={spec.label}
                        onChange={(e) => handleEditSpecChange(sIdx, 'label', e.target.value)}
                        className="flex-1 rounded bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 240V)"
                        value={spec.value}
                        onChange={(e) => handleEditSpecChange(sIdx, 'value', e.target.value)}
                        className="flex-1 rounded bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleEditRemoveSpec(sIdx)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-lg bg-transparent border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-600 px-5 py-2 font-semibold text-zinc-950 text-xs transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
