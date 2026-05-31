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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) setError(error.message);
      else setError('✅ Account ban gaya! Ab Sign In karo.');
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-wider text-blue-500">NEXORA</h1>
          <p className="text-slate-400 text-sm mt-1">Courier & Logistics Portal</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {isSignup ? '🚀 Create Account' : '🔐 Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs text-slate-400 font-medium">Full Name</label>
                <input
                  type="text"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Muhammad Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 font-medium">Email Address</label>
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
              <label className="text-xs text-slate-400 font-medium">Password</label>
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
                onClick={() => { setIsSignup(!isSignup); setError(''); }}
                className="text-blue-400 font-bold ml-2 hover:text-blue-300 transition-all"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
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
      <App />
    </div>
  );

  // CUSTOMER PORTAL
  return <CustomerPortal session={session} onLogout={handleLogout} />;
}