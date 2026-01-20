/**
 * CubeMail Signup Page
 * 
 * User registration for new CubeMail accounts.
 * Supports both free and premium tier signups.
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Mail, Lock, User, Eye, EyeOff, ArrowRight, 
  Check, Sparkles, Shield, Zap
} from 'lucide-react';

import '../cubemail.css';
import './auth.css';

// ============================================================================
// SIGNUP FORM COMPONENT
// ============================================================================

function SignupFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: searchParams.get('email') || '',
    password: '',
    confirmPassword: '',
    fullName: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const plan = searchParams.get('plan') || 'free';

  const passwordStrength = React.useMemo(() => {
    const password = formData.password;
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'red' };
    if (score <= 4) return { score, label: 'Medium', color: 'yellow' };
    return { score, label: 'Strong', color: 'green' };
  }, [formData.password]);

  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      
      setCheckingUsername(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reserved = ['admin', 'support', 'help', 'info', 'contact'];
      setUsernameAvailable(!reserved.includes(formData.username.toLowerCase()));
      setCheckingUsername(false);
    };
    
    const debounce = setTimeout(checkUsername, 300);
    return () => clearTimeout(debounce);
  }, [formData.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (!usernameAvailable) {
      setError('This username is not available');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!formData.acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }
    
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/cubemail/welcome');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
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
          <Mail className="h-8 w-8" />
          <span>CubeMail</span>
        </Link>
        
        <div className="auth-sidebar__content">
          <h2>Join 50,000+ users</h2>
          <p>Experience email the way it should be—private, powerful, and free.</p>
          
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
          <p>"Finally, an email service that respects my privacy. The AI screener is a game-changer."</p>
          <div className="auth-sidebar__author">
            <div className="auth-sidebar__avatar">SC</div>
            <div>
              <strong>Sarah Chen</strong>
              <span>Product Designer</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-main">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <h1>Create your account</h1>
            <p>
              {plan === 'premium' 
                ? 'Start your 14-day Premium trial' 
                : 'Get started for free'}
            </p>
          </div>
          
          {plan === 'premium' && (
            <div className="auth-premium-badge">
              <Sparkles className="h-4 w-4" />
              <span>Premium Plan - 14-day free trial</span>
            </div>
          )}
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <User className="h-5 w-5" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrapper email-input">
                <Mail className="h-5 w-5" />
                <input
                  type="text"
                  name="username"
                  placeholder="yourname"
                  value={formData.username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                    setFormData(prev => ({ ...prev, username: value }));
                  }}
                  required
                />
                <span className="auth-email-domain">@cubemail.pro</span>
              </div>
              {formData.username.length >= 3 && (
                <div className={`auth-username-status ${usernameAvailable === true ? 'available' : usernameAvailable === false ? 'taken' : ''}`}>
                  {checkingUsername ? (
                    <span>Checking availability...</span>
                  ) : usernameAvailable === true ? (
                    <><Check className="h-4 w-4" /> {formData.username}@cubemail.pro is available!</>
                  ) : usernameAvailable === false ? (
                    <span>This username is already taken</span>
                  ) : null}
                </div>
              )}
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
              {formData.password && (
                <div className="auth-password-strength">
                  <div className={`auth-password-bar ${passwordStrength.color}`}>
                    <div style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                  </div>
                  <span className={passwordStrength.color}>{passwordStrength.label}</span>
                </div>
              )}
            </div>
            
            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock className="h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            
            <div className="auth-checkbox">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
              />
              <label htmlFor="acceptTerms">
                I agree to the{' '}
                <Link href="/terms">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy">Privacy Policy</Link>
              </label>
            </div>
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-loading">Creating account...</span>
              ) : (
                <>
                  Create Account
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
            Already have an account?{' '}
            <Link href="/cubemail/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT WITH SUSPENSE
// ============================================================================

export default function CubeMailSignup() {
  return (
    <Suspense fallback={<div className="auth-loading-page">Loading...</div>}>
      <SignupFormContent />
    </Suspense>
  );
}
