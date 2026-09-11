'use client';

import { useState } from 'react';
import { login, register, UserResponse } from '@/lib/api';
import { Database, Mail, Lock, Loader2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (user: UserResponse) => void;
}

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await login(email, password);
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => {
          onAuthSuccess(response.user);
        }, 800);
      } else {
        const response = await register(email, password);
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          onAuthSuccess(response.user);
        }, 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Radial Gradient Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />

      {/* Animated Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative w-full max-w-md space-y-8 z-10">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-600 p-3 shadow-lg shadow-purple-500/20 animate-pulse">
            <Database className="h-7 w-7 text-white font-bold" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Querium <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">DB</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Natural Language to SQL Database Assistant
          </p>
        </div>

        {/* Card Body with Glassmorphism */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-2xl p-8 transition-all duration-300 hover:border-slate-700/80">
          <div className="mb-6 flex justify-center gap-2 rounded-lg bg-slate-950/60 p-1 border border-slate-800/80">
            <button
              onClick={() => !isLogin && toggleAuthMode()}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${isLogin
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => isLogin && toggleAuthMode()}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${!isLogin
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Validation / Alert Message */}
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400 flex items-start gap-2">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-sm text-purple-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-lg bg-slate-950 border border-slate-800 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-purple-500/10 hover:from-purple-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick info on sign up modal */}
          {isLogin && (
            <div className="mt-6 border-t border-slate-800/60 pt-4 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/5 border border-purple-500/10 px-2.5 py-0.5 text-xs text-purple-400">
                <Sparkles className="h-3 w-3" />
                <span>Have Fun!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
