/**
 * CubeMail Login Page
 * 
 * User authentication for existing CubeMail accounts.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, 
  Shield, Zap, Sparkles
} from 'lucide-react';
import { CubeLogo } from '@/components/brand/CubeLogo';

import '../cubemail.css';
import '../signup/auth.css';

// ============================================================================
// LOGIN FORM COMPONENT
// ============================================================================

export default function CubeMailLogin() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/mail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="auth-page">
      <div className="auth-sidebar">
        <Link href="/cubemail" className="auth-logo">
          <CubeLogo variant="horizontal" size="md" theme="light" />
        </Link>
        
        <div className="auth-sidebar__content">
          <h2>Welcome back</h2>
          <p>Access your private, secure email with zero compromises.</p>
          
          <div className="auth-sidebar__features">
            <div className="auth-sidebar__feature">
              <Shield className="h-5 w-5" />
              <span>Privacy First</span>
            </div>
            <div className="auth-sidebar__feature">
              <Zap className="h-5 w-5" />
              <span>Lightning Fast</span>
            </div>
            <div className="auth-sidebar__feature">
              <Sparkles className="h-5 w-5" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
        
        <div className="auth-sidebar__testimonial">
          <p>"Switching to CubeMail was the best decision. No more ads, no more tracking—just email."</p>
          <div className="auth-sidebar__author">
            <div className="auth-sidebar__avatar">MJ</div>
            <div>
              <strong>Marcus Johnson</strong>
              <span>Software Engineer</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-main">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <h1>Log in to CubeMail</h1>
            <p>Enter your credentials to access your inbox</p>
          </div>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="h-5 w-5" />
                <input
                  type="text"
                  name="email"
                  placeholder="you@cubemail.pro"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrapper">
                <Lock className="h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="auth-options">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <span>Remember me</span>
              </label>
              <Link href="/cubemail/forgot-password" className="auth-forgot">
                Forgot password?
              </Link>
            </div>
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-loading">Signing in...</span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          
          <div className="auth-social">
            <button className="auth-social-btn google">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="auth-social-btn apple">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>
          
          <p className="auth-footer-link">
            Don't have an account?{' '}
            <Link href="/cubemail/signup">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
