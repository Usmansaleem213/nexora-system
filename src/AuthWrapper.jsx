import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import App from './App';
import CustomerPortal from './CustomerPortal';

export default function AuthWrapper() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else { setUserRole(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    setUserRole(data?.role || 'customer');
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSignup) {
      // Step 1: Supabase auth signup
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone } }
      });

      if (signupError) {
        setError(signupError.message);
        setSubmitting(false);
        return;
      }

      // Step 2: profiles table mein save karo
      if (data?.user) {
        await supabase.from('profiles').insert({
  full_name: name,
  email: email,
  phone: phone,
  created_at: new Date().toISOString()
});
      }

      setError('✅ Account ban gaya! Ab Sign In karo.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-blue-400 text-xl font-bold animate-pulse">NEXORA Loading...</div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo & Company Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider text-blue-500">NEXORA</h1>
          <p className="text-slate-300 font-semibold mt-1">Courier & Logistics</p>
          <p className="text-slate-500 text-xs mt-2">Pakistan's Trusted International Shipping Partner</p>

          {/* Contact Info Bar */}
          <div className="flex justify-center gap-4 mt-4">
            <a href="tel:+923350961234" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-all">
  📞 +92 335 096 1234
</a>
<a href="https://wa.me/923350961234" target="_blank" className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-400 transition-all">
  💬 WhatsApp
</a>
<a href="mailto:nexora85@gmail.com" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-all">
  ✉️ nexora85@gmail.com
</a>
          </div>
          <p className="text-xs text-slate-500 mt-1">📍 Karachi, Pakistan</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {isSignup ? '🚀 Create Your Account' : '🔐 Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Full Name *</label>
                  <input
                    type="text"
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Muhammad Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="03XX-XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-slate-400 font-medium">Email Address *</label>
              <input
                type="email"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Password *</label>
              <input
                type="password"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className={`text-xs p-3 rounded-lg ${error.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all text-sm uppercase tracking-wider mt-2"
            >
              {submitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800 pt-5">
            <p className="text-slate-400 text-sm">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => { setIsSignup(!isSignup); setError(''); setPhone(''); }}
                className="text-blue-400 font-bold ml-2 hover:text-blue-300 transition-all"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2025 Nexora Courier & Logistics • Karachi, Pakistan
        </p>
      </div>
    </div>
  );

  // ADMIN PORTAL
  if (userRole === 'admin') return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg shadow-lg">
        <span className="text-xs text-emerald-400 font-bold">👑 ADMIN</span>
        <span className="text-xs text-slate-400">{session.user.email}</span>
        <button type="button" onClick={handleLogout} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-md transition-all">
          Logout
        </button>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 border-t border-slate-800 py-2 px-6 flex justify-center gap-6">
        <a href="tel:+923350961234" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-all">📞 +92 335 096 1234</a>
        <a href="https://wa.me/923350961234" target="_blank" className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-400 transition-all">💬 WhatsApp</a>
        <a href="mailto:nexora85@gmail.com" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-all">✉️ nexora85@gmail.com</a>
        <span className="text-xs text-slate-600">📍 Karachi, Pakistan</span>
      </div>
      <App />
    </div>
  );

  // CUSTOMER PORTAL
  return <CustomerPortal session={session} onLogout={handleLogout} />;
}