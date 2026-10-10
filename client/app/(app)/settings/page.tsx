'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  KeyRound,
  Sliders,
  CheckCircle2,
  Save,
  BrainCircuit,
  Lock,
  Mail,
  Building,
  BadgeCheck,
  AlertCircle,
  Loader2,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSession, updateProfile } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [roleTitle, setRoleTitle] = useState('Principal AI Researcher');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getSession();
        if (user) {
          setFullName(user.name || '');
          setEmail(user.email || '');
        }
        if (typeof window !== 'undefined') {
          const savedInst = localStorage.getItem('ros.settings.institution');
          if (savedInst) setInstitution(savedInst);
          else setInstitution('ResearchOS Core Intelligence Lab');

          const savedRole = localStorage.getItem('ros.settings.roleTitle');
          if (savedRole) setRoleTitle(savedRole);
          else setRoleTitle('Principal AI Researcher');

          const savedBio = localStorage.getItem('ros.settings.bio');
          if (savedBio) setBio(savedBio);
          else setBio('Focusing on Quantum Machine Learning, GNNs, Vector RAG Embeddings, and Automated Systematic Reviews.');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ros.settings.institution', institution);
        localStorage.setItem('ros.settings.roleTitle', roleTitle);
        localStorage.setItem('ros.settings.bio', bio);
      }

      await updateProfile({
        name: fullName.trim(),
        email: email.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      router.refresh();
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = (fullName ? fullName.trim().charAt(0) : 'U').toUpperCase();

  return (
    <div className="w-full space-y-8 animate-fade-in-up pb-12">
      {/* 1. HERO HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white via-indigo-50/60 to-slate-50 border border-slate-200/90 shadow-2xs relative overflow-hidden group">
        {/* Ambient Radial Glow */}
        <div
          className="absolute -right-12 -top-12 w-72 h-72 pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%)' }}
        />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-[11px] font-bold tracking-tight">
            <BrainCircuit className="w-3.5 h-3.5 text-accent" />
            <span>Account & Workspace Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Profile & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Manage your academic research profile, security credentials, vector RAG ingestion defaults, and workspace notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-mono text-slate-600 shadow-2xs shrink-0 relative z-10">
          <BadgeCheck className="w-4 h-4 text-emerald-500" />
          <span>Pro Research Subscription</span>
        </div>
      </div>

      {/* 2. PROFILE HERO CARD */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-indigo-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-accent/20 shrink-0">
            {initial}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">{fullName || (loading ? 'Loading...' : 'Researcher')}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-accent text-[10px] font-bold uppercase tracking-wider">
                {roleTitle || 'AI Researcher'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {email || (loading ? '...' : 'No email')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> {institution || 'Research Lab'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:self-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Workspace Verified
          </span>
        </div>
      </div>

      {/* 3. SETTINGS FORM */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* SECTION A: PROFILE DETAILS */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <User className="w-4 h-4 text-accent" />
            <h3 className="text-base font-bold text-slate-900">Personal & Academic Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your Full Name"
                required
                className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Academic / Professional Title</label>
              <Input
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                placeholder="e.g. Principal AI Researcher"
                className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Research Institution / Organization</label>
              <Input
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="e.g. Stanford University / ResearchOS Intelligence Lab"
                className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Research Focus & Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Describe your research domains, specializations, and focus..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none text-slate-800 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: SECURITY & AUTHENTICATION */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <Lock className="w-4 h-4 text-accent" />
            <h3 className="text-base font-bold text-slate-900">Security & Credentials</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Current Password (optional, needed to change password)</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-accent">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
                <p className="text-slate-500 text-[11px]">Protect your workspace credentials with TOTP authenticator app support.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold">
              Enabled
            </span>
          </div>
        </div>

        {/* SECTION C: WORKSPACE PREFERENCES */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="text-base font-bold text-slate-900">AI Ingestion & RAG Engine Defaults</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Default Paper Limit Per Project</label>
              <select className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all">
                <option value="20">20 Papers (Standard Discovery Speed)</option>
                <option value="50">50 Papers (Deep Literature Synthesis)</option>
                <option value="100">100 Papers (Exhaustive Meta-Analysis)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Vector Index Dimensions</label>
              <select className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all">
                <option value="1536">Qdrant 1536-dim Cosine Similarity (Fast)</option>
                <option value="3072">Qdrant 3072-dim High Density (Ultra Accuracy)</option>
              </select>
            </div>
          </div>
        </div>

        {/* FEEDBACK & SUBMIT ACTIONS */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Account & preferences updated successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-500">All changes are synchronized directly with your ResearchOS user profile.</span>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Profile Changes
                </>
              )}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
