import React, { useState } from 'react';
import { Vault3DBackground } from '../Vault3DBackground';
import { registerUser, authErrorMessage, type AuthUser } from '../../auth/authStore';

interface SignupPageProps {
  onSignupSuccess: (user: AuthUser) => void;
  onGoLogin: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onGoLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { score, label: 'Fair', color: '#F97316' };
    if (score <= 3) return { score, label: 'Good', color: '#EAB308' };
    return { score, label: 'Strong', color: '#22C55E' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const result = await registerUser(fullName, email, password, confirmPw);
      if (result.ok && result.user) {
        onSignupSuccess(result.user);
      } else {
        setError(authErrorMessage(result.error!));
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#09090B]">
      {/* 3D Background */}
      <Vault3DBackground />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090B]/80 via-[#0b0a0f]/60 to-[#09090B]/80 pointer-events-none z-10" />

      {/* Signup Card */}
      <div className="relative z-20 w-full max-w-md px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9B1B30] to-[#4A0E17] border border-[#D4AF37]/30 shadow-2xl mb-3">
            <svg className="w-7 h-7 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#D4AF37]">VELVET</span>{' '}
            <span className="text-[#F3E5AB]">VAULT</span>
          </h1>
          <p className="text-stone-400 text-xs mt-1 tracking-widest uppercase">Create Your Secure Vault</p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/60">
          <h2 className="text-lg font-semibold text-[#F3E5AB] mb-1">Join Velvet Vault</h2>
          <p className="text-stone-500 text-xs mb-5">Your data stays on your device — always.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide uppercase">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Alexandra Cipher"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#F3E5AB] placeholder-stone-600 text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:bg-white/[0.07] transition-all"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@velvet-vault.io"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#F3E5AB] placeholder-stone-600 text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:bg-white/[0.07] transition-all"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.05] border border-white/10 text-[#F3E5AB] placeholder-stone-600 text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:bg-white/[0.07] transition-all"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#D4AF37] transition-colors" tabIndex={-1}>
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>{strength.label} password</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 tracking-wide uppercase">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.05] border text-[#F3E5AB] placeholder-stone-600 text-sm focus:outline-none transition-all ${
                    confirmPw.length > 0 && confirmPw !== password
                      ? 'border-red-500/50 focus:border-red-500'
                      : confirmPw.length > 0 && confirmPw === password
                      ? 'border-green-500/50 focus:border-green-500'
                      : 'border-white/10 focus:border-[#D4AF37]/60 focus:bg-white/[0.07]'
                  }`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#D4AF37] transition-colors" tabIndex={-1}>
                  {showConfirmPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {confirmPw.length > 0 && confirmPw !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
              {confirmPw.length > 0 && confirmPw === password && (
                <p className="text-xs text-green-400 mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#9B1B30]/20 border border-[#9B1B30]/40">
                <svg className="w-4 h-4 text-[#F87171] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-xs text-[#FCA5A5]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#9B1B30] to-[#721422] hover:from-[#B22234] hover:to-[#9B1B30] border border-[#D4AF37]/30 text-[#F3E5AB] font-semibold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-[#9B1B30]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating Vault…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  Create My Vault
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.07]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-xs text-stone-600">Already have an account?</span>
            </div>
          </div>

          <button
            onClick={onGoLogin}
            disabled={loading}
            className="w-full py-2.5 px-6 rounded-xl bg-transparent border border-[#D4AF37]/30 text-[#D4AF37] font-medium text-sm hover:bg-[#D4AF37]/10 transition-all duration-200"
          >
            Sign In Instead
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-stone-600 mt-5">
          🔒 100% client-side · credentials hashed with SHA-256 · zero network calls
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
