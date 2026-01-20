'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Shield } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  twoFactorCode: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  twoFactorCode?: string;
  general?: string;
}

export default function InvestorLoginPage(): React.ReactElement {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [kycRequired, setKycRequired] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (requires2FA && !formData.twoFactorCode) {
      newErrors.twoFactorCode = '2FA code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          twoFactorCode: formData.twoFactorCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.requires2FA) {
        setRequires2FA(true);
        return;
      }

      if (data.kycRequired) {
        setKycRequired(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('cube_investor_token', data.token);
      }

      router.push(data.redirectTo || '/investors/dashboard');
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (kycRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">KYC Verification Required</h2>
            <p className="text-amber-200 mb-6">
              To access your investor dashboard, please complete our KYC verification process.
            </p>
            <Link
              href="/investors/kyc"
              className="inline-block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg"
            >
              Start KYC Verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 p-4">
      <div className="w-full max-w-md">
        <Link href="/investors" className="inline-flex items-center gap-2 text-amber-300 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Investor Relations
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Investor Portal Login</h1>
          <p className="text-amber-200 mt-1">Access your investment dashboard</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-amber-100 mb-1">
                Investor Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={requires2FA}
                  className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${
                    errors.email ? 'border-red-500' : 'border-white/20'
                  } rounded-lg text-white placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                  placeholder="investor@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-amber-100 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={requires2FA}
                  className={`w-full pl-11 pr-11 py-3 bg-white/5 border ${
                    errors.password ? 'border-red-500' : 'border-white/20'
                  } rounded-lg text-white placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            {requires2FA && (
              <div className="animate-in slide-in-from-top duration-300">
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-amber-100 mb-1">
                  Two-Factor Authentication Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                  <input
                    type="text"
                    id="twoFactorCode"
                    name="twoFactorCode"
                    value={formData.twoFactorCode}
                    onChange={handleChange}
                    maxLength={6}
                    className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${
                      errors.twoFactorCode ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white text-center tracking-widest text-lg font-mono placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    placeholder="000000"
                  />
                </div>
                {errors.twoFactorCode && <p className="mt-1 text-sm text-red-400">{errors.twoFactorCode}</p>}
                <p className="mt-2 text-xs text-amber-300/70">Enter the 6-digit code from your authenticator app</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {requires2FA ? 'Verifying...' : 'Signing in...'}
                </>
              ) : (
                requires2FA ? 'Verify & Continue' : 'Access Investor Portal'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-amber-200 text-sm">
              Interested in investing?{' '}
              <Link href="/investors" className="text-amber-300 hover:text-white font-medium">
                Learn more
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-200 text-xs text-center">
            🔒 Secure investor portal. All sessions are encrypted and monitored for security.
          </p>
        </div>
      </div>
    </div>
  );
}
