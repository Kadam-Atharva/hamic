'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Wrench, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as 'company' | 'user') || 'user';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'company' | 'user'>(defaultRole);
  const [companyDesc, setCompanyDesc] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setError('');
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        role
      };

      if (role === 'company') {
        payload.companyDetails = {
          description: companyDesc,
          website: companyWebsite,
          logoUrl: companyLogo
        };
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        // Redirect based on role
        if (role === 'company') {
          router.push('/dashboard');
        } else {
          router.push('/products');
        }
        router.refresh();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 glow-cyan">
              <Wrench className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <span>HAMIC</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Sign up to get support or manage your manufacturing profile.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector tab */}
          <div className="flex rounded-lg bg-zinc-950 p-1 mb-6 border border-zinc-900">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 rounded-md py-2.5 text-xs font-bold transition-all ${
                role === 'user'
                  ? 'bg-zinc-900 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Standard User
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              className={`flex-1 rounded-md py-2.5 text-xs font-bold transition-all ${
                role === 'company'
                  ? 'bg-zinc-900 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Company Creator
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {role === 'company' ? 'Company / Brand Name' : 'Full Name'}
              </label>
              <input
                type="text"
                placeholder={role === 'company' ? 'e.g. Acme Appliances' : 'e.g. John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            {/* Extra fields if role is company */}
            {role === 'company' && (
              <div className="space-y-5 border-t border-zinc-900 pt-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Company Description
                  </label>
                  <textarea
                    placeholder="Short description of your brand..."
                    value={companyDesc}
                    onChange={(e) => setCompanyDesc(e.target.value)}
                    rows={2}
                    className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full mt-1.5 rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Company Logo URL
                  </label>
                  <div className="mt-1.5 flex gap-3">
                    <input
                      type="text"
                      placeholder="/uploads/logo.png"
                      value={companyLogo}
                      onChange={(e) => setCompanyLogo(e.target.value)}
                      className="flex-1 rounded-lg bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/50"
                    />
                    <label className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 px-4 py-2 text-xs font-semibold cursor-pointer flex items-center justify-center shrink-0">
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
                                setCompanyLogo(data.url);
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-bold py-3 text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4.5 w-4.5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-zinc-500">Already have an account? </span>
            <Link href="/login" className="font-semibold text-cyan-400 hover:text-white transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
