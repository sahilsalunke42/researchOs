'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { register } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, name });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 font-sans">
      {/* Subtle Back to Home Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-accent transition-colors duration-200 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header & Small Badge */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-light text-accent text-[11px] font-semibold">
          <span>ResearchOS</span>
          <span className="opacity-50">•</span>
          <span>Workspace Onboarding</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Create your workspace</h1>
        <p className="text-xs text-slate-500">Set up your workspace and start organizing your research.</p>
      </div>

      {/* Error Alert Presentation */}
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-start gap-2.5 text-xs animate-in fade-in-50 duration-200">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Registration failed</p>
            <p className="text-red-700/90 mt-0.5 text-[11px] leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Form Input Fields */}
      <div className="space-y-3.5">
        {/* Full Name Field */}
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full name</Label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
              className="pl-10 h-11 rounded-[10px] border-[#CBD5E1] bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email address</Label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10 h-11 rounded-[10px] border-[#CBD5E1] bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a secure password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="pl-10 pr-10 h-11 rounded-[10px] border-[#CBD5E1] bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Create Account Button */}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-11 rounded-[10px] text-sm font-semibold bg-accent hover:bg-accent-hover active:scale-[0.99] text-white shadow-sm transition-all duration-200 mt-1"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Creating account…
          </>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            Create account <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>

      {/* Bottom Switch Link */}
      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-accent hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
