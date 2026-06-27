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

  // PUBLIC TRACKING STATES
  const [showTracking, setShowTracking] = useState(false);
  const [trackAwb, setTrackAwb] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackUpdates, setTrackUpdates] = useState([]);
  const [trackMsg, setTrackMsg] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

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

  // PUBLIC TRACKING — no login needed
  const handlePublicTrack = async (e) => {
    e.preventDefault();
    setTrackLoading(true);
    setTrackMsg('');
    setTrackResult(null);
    setTrackUpdates([]);

    const { data: shipment } = await supabase
      .from('customer_ledgers')
      .select('*')
      .eq('nexora_airwaybill', trackAwb.trim())
      .single();

    if (!shipment) {
      setTrackMsg('❌ Koi shipment nahi mila is tracking number se');
      setTrackLoading(false);
      return;
    }

    setTrackResult(shipment);

    const { data: updates } = await supabase
      .from('tracking_updates')
      .select('*')
      .eq('awb', shipment.nexora_airwaybill)
      .order('date', { ascending: false });

    if (updates) setTrackUpdates(updates);
    setTrackLoading(false);
  };

  const trackingStatusColors = {
    'Shipment Booked': 'bg-blue-900/40 text-blue-400 border-blue-500/30',
    'Picked Up': 'bg-cyan-900/40 text-cyan-400 border-cyan-500/30',
    'In Transit': 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30',
    'Customs Clearance': 'bg-purple-900/40 text-purple-400 border-purple-500/30',
    'Out for Delivery': 'bg-lime-900/40 text-lime-400 border-lime-500/30',
    'Delivered': 'bg-green-900/40 text-green-400 border-green-500/30',
    'Delayed': 'bg-red-900/40 text-red-400 border-red-500/30',
  };

  const ContactBar = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-purple-950/90 border-t border-purple-800/40 py-2 px-6 flex justify-center gap-6">
      <a href="tel:+923350961243" className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-400 transition-all">📞 +92 335 096 1243</a>
      <a href="https://wa.me/923350961243" target="_blank" className="flex items-center gap-1 text-xs text-purple-300 hover:text-green-400 transition-all">💬 WhatsApp</a>
      <a href="mailto:nexora85@gmail.com" className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-400 transition-all">✉️ nexora85@gmail.com</a>
      <span className="text-xs text-slate-600">📍 Karachi, Pakistan</span>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-purple-400 text-xl font-bold animate-pulse">UT International Trade Loading...</div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider text-purple-500">UT INTERNATIONAL TRADE</h1>
          <p className="text-purple-200 font-semibold mt-1">Courier & Logistics</p>
          <p className="text-purple-400/70 text-xs mt-2">Pakistan's Trusted International Shipping Partner</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="tel:+923350961243" className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-400 transition-all">📞 +92 335 096 1243</a>
            <a href="https://wa.me/923350961243" target="_blank" className="flex items-center gap-1 text-xs text-purple-300 hover:text-green-400 transition-all">💬 WhatsApp</a>
            <a href="mailto:nexora85@gmail.com" className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-400 transition-all">✉️ nexora85@gmail.com</a>
          </div>
          <p className="text-xs text-purple-400/70 mt-1">📍 Karachi, Pakistan</p>
        </div>

        {!showTracking ? (
          <>
            <div className="bg-purple-950/90 border border-purple-700/50 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">
                {isSignup ? '🚀 Create Your Account' : '🔐 Welcome Back'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <>
                    <div>
                      <label className="text-xs text-purple-300 font-medium">Full Name *</label>
                      <input type="text" className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all" placeholder="Muhammad Ali" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-xs text-purple-300 font-medium">Phone Number *</label>
                      <input type="tel" className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all" placeholder="03XX-XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs text-purple-300 font-medium">Email Address *</label>
                  <input type="email" className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-purple-300 font-medium">Password *</label>
                  <input type="password" className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>

                {error && (
                  <div className={`text-xs p-3 rounded-lg ${error.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all text-sm uppercase tracking-wider mt-2">
                  {submitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-purple-800/40 pt-5">
                <p className="text-purple-300 text-sm">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}
                  <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); setPhone(''); }} className="text-purple-400 font-bold ml-2 hover:text-blue-300 transition-all">
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </div>

            {/* TRACK WITHOUT LOGIN BUTTON */}
            <button
              type="button"
              onClick={() => { setShowTracking(true); setTrackResult(null); setTrackMsg(''); setTrackAwb(''); }}
              className="w-full mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              📦 Track Your Parcel (No Login Required)
            </button>
          </>
        ) : (
          /* PUBLIC TRACKING PANEL */
          <div className="bg-purple-950/90 border border-purple-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">📦 Track Your Parcel</h2>
              <button type="button" onClick={() => setShowTracking(false)} className="text-purple-300 hover:text-white text-sm">✕ Close</button>
            </div>

            <form onSubmit={handlePublicTrack} className="flex gap-2 mb-4">
              <input
                className="flex-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Enter Tracking Number e.g. UT-123456789"
                value={trackAwb}
                onChange={(e) => setTrackAwb(e.target.value)}
                required
              />
              <button type="submit" disabled={trackLoading} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-5 rounded-lg transition-all text-sm">
                {trackLoading ? '...' : '🔍'}
              </button>
            </form>

            {trackMsg && (
              <div className="bg-red-900/30 text-red-400 border border-red-700 text-sm p-3 rounded-lg mb-4">
                {trackMsg}
              </div>
            )}

            {trackResult && (
              <div className="space-y-4">
                <div className="bg-purple-900/40 border border-purple-700/40 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-purple-300">Tracking Number</p>
                      <p className="text-lg font-black font-mono text-white">{trackResult.nexora_airwaybill}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600/40 text-purple-200 border border-purple-500/40">
                      {trackResult.service}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-purple-300">Receiver</p><p className="text-white font-medium">{trackResult.receiver}</p></div>
                    <div><p className="text-xs text-purple-300">Destination</p><p className="text-white font-medium">{trackResult.destination}</p></div>
                    <div><p className="text-xs text-purple-300">Weight</p><p className="text-white font-medium">{trackResult.weight} KG</p></div>
                    <div><p className="text-xs text-purple-300">Booked On</p><p className="text-white font-medium">{trackResult.date ? new Date(trackResult.date).toLocaleDateString() : 'N/A'}</p></div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-purple-300 mb-3 font-bold">📍 Shipment Journey</p>
                  {trackUpdates.length === 0 ? (
                    <p className="text-purple-400/60 text-xs text-center py-4">Abhi tak koi tracking update nahi hai — booking process mein hai</p>
                  ) : (
                    <div className="space-y-2">
                      {trackUpdates.map((update, idx) => (
                        <div key={update.id} className={`rounded-lg p-3 border ${idx === 0 ? 'bg-purple-900/50 border-purple-600/50' : 'bg-purple-900/20 border-purple-800/30'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${trackingStatusColors[update.status] || 'bg-slate-800 text-slate-400 border-slate-600'}`}>
                                {update.status}
                              </span>
                              {idx === 0 && <span className="ml-2 text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">LATEST</span>}
                              <p className="text-white text-sm font-bold mt-1">📍 {update.location}</p>
                              {update.description && <p className="text-purple-300/70 text-xs mt-0.5">{update.description}</p>}
                            </div>
                          </div>
                          <p className="text-purple-400/60 text-[10px] mt-1.5">
                            🕐 {new Date(update.date).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">© 2025 UT International Trade • Karachi, Pakistan</p>
      </div>
    </div>
  );

  // ADMIN PORTAL
  if (userRole === 'admin') return (
    <div className="relative pb-10">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-purple-950/90 border border-purple-700/50 px-3 py-2 rounded-lg shadow-lg">
        <span className="text-xs text-emerald-400 font-bold">👑 ADMIN</span>
        <span className="text-xs text-purple-300">{session.user.email}</span>
        <button type="button" onClick={handleLogout} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-md transition-all">Logout</button>
      </div>
      <ContactBar />
      <App isAdmin={true} currentUserId={session.user.id} />
    </div>
  );

  // STAFF PORTAL
  if (userRole === 'staff') return (
    <div className="relative pb-10">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-purple-950/90 border border-purple-700/50 px-3 py-2 rounded-lg shadow-lg">
        <span className="text-xs text-purple-400 font-bold">🔧 STAFF</span>
        <span className="text-xs text-purple-300">{session.user.email}</span>
        <button type="button" onClick={handleLogout} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-md transition-all">Logout</button>
      </div>
      <ContactBar />
      <App isAdmin={false} currentUserId={session.user.id} />
    </div>
  );

  // CUSTOMER PORTAL
  return <CustomerPortal session={session} onLogout={handleLogout} />;
}