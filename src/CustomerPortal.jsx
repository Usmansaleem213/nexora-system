import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function CustomerPortal({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    receiver_name: '', receiver_address: '', receiver_phone: '',
    receiver_email: '', destination: '', weight: '', service: '', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatedLabel, setGeneratedLabel] = useState(null);
  const labelRef = useRef(null);

  const customerEmail = session.user.email;
  const customerName = session.user.user_metadata?.full_name || customerEmail;

  useEffect(() => {
    fetchMyShipments();
  }, []);

  const fetchMyShipments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_ledgers')
      .select('*')
      .eq('sender_email', customerEmail)
      .order('id', { ascending: false });
    if (data) setShipments(data);
    setLoading(false);
  };

  const [submitError, setSubmitError] = useState('');

  const handleNewShipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    const awb = 'UT-REQ-' + Math.floor(100000 + Math.random() * 900000);
    const { error } = await supabase.from('customer_ledgers').insert([{
      sender_name: customerName,
      sender_email: customerEmail,
      sender_address: '',
      sender_phone: '',
      receiver: formData.receiver_name,
      receiver_address: formData.receiver_address,
      receiver_phone: formData.receiver_phone,
      receiver_email: formData.receiver_email,
      destination: formData.destination,
      weight: formData.weight,
      service: formData.service,
      nexora_airwaybill: awb,
      remote_status: 'Non-Remote',
      debit: 0, credit: 0, petrol: 0, remote_charges: 0, buying_rate: 0,
      forwarding_awb: '', forward_vendor: '',
      status: 'pending'
    }]);
    if (!error) {
      setGeneratedLabel({
        awb, sender_name: customerName, sender_email: customerEmail,
        receiver_name: formData.receiver_name, receiver_address: formData.receiver_address,
        receiver_phone: formData.receiver_phone, destination: formData.destination,
        weight: formData.weight, service: formData.service,
        date: new Date().toLocaleDateString()
      });
      setFormData({ receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '', destination: '', weight: '', service: '', notes: '' });
      fetchMyShipments();
    } else {
      setSubmitError('❌ Booking fail ho gayi: ' + error.message);
    }
    setSubmitting(false);
  };

  const handleDownloadLabel = () => {
    const label = generatedLabel;
    const html = `<html><head><style>body{font-family:Arial,sans-serif;padding:20px}.label{border:4px solid black;padding:24px;max-width:500px;margin:auto}.title{font-size:28px;font-weight:900}.awb{font-size:22px;font-weight:900;border-top:2px solid black;border-bottom:2px solid black;padding:10px 0;margin:12px 0}.row{margin:6px 0;font-size:14px}.label-bottom{margin-top:16px;font-size:12px;color:#555}</style></head><body><div class="label"><div class="title">UT INTERNATIONAL</div><div class="awb">${label.awb}</div><div class="row"><strong>From:</strong> ${label.sender_name}</div><div class="row"><strong>To:</strong> ${label.receiver_name}</div><div class="row"><strong>Address:</strong> ${label.receiver_address}</div><div class="row"><strong>Phone:</strong> ${label.receiver_phone}</div><div class="row"><strong>Destination:</strong> ${label.destination}</div><div class="row"><strong>Weight:</strong> ${label.weight} KG</div><div class="row"><strong>Service:</strong> ${label.service}</div><div class="row"><strong>Date:</strong> ${label.date}</div><div class="label-bottom">This is a UT International booking reference. Final carrier label will be provided separately.</div></div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Nexora_Label_${label.awb}.html`; a.click();
  };

  const totalSpending = shipments.reduce((sum, s) => sum + Number(s.debit || 0) + Number(s.petrol || 0) + Number(s.remote_charges || 0), 0);
  const totalPaid = shipments.reduce((sum, s) => sum + Number(s.credit || 0), 0);
  const totalOutstanding = totalSpending - totalPaid;

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">

      {/* SIDEBAR */}
      <div className="w-64 bg-purple-950/90 border-r border-purple-800/40 flex flex-col justify-between fixed h-full">
        <div>
          <div className="p-6 border-b border-purple-800/40">
            <h1 className="text-xl font-black tracking-wider text-purple-500">NEXORA</h1>
            <p className="text-xs text-purple-300 mt-1">Customer Portal</p>
          </div>
          <nav className="p-4 space-y-2">
            {[
              { id: 'dashboard',    icon: '📊', label: 'Dashboard' },
              { id: 'new_shipment', icon: '📦', label: 'New Shipment' },
              { id: 'my_shipments', icon: '📑', label: 'My Shipments' },
              { id: 'tracking',     icon: '🔍', label: 'Track Parcel' },
              { id: 'profile',      icon: '👤', label: 'My Profile' },
            ].map(tab => (
              <button key={tab.id} type="button"
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'new_shipment') setGeneratedLabel(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-300 hover:bg-purple-900/60 hover:text-white'}`}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-purple-800/40">
          <p className="text-xs text-purple-300 mb-1 truncate">{customerEmail}</p>
          <button type="button" onClick={onLogout}
            className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-2 rounded-lg text-sm font-bold transition-all">
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 pl-64 p-8">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Welcome, {customerName}! 👋</h2>
            <p className="text-purple-300 mb-6">Here's your shipment overview</p>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-purple-950/90 border border-purple-800/40 p-5 rounded-xl">
                <p className="text-xs text-purple-300">Total Shipments</p>
                <p className="text-3xl font-black text-purple-400 mt-1">{shipments.length}</p>
              </div>
              <div className="bg-purple-950/90 border border-purple-800/40 p-5 rounded-xl">
                <p className="text-xs text-purple-300">Total Spending</p>
                <p className="text-3xl font-black text-yellow-400 mt-1">Rs {totalSpending.toLocaleString()}</p>
              </div>
              <div className="bg-purple-950/90 border border-purple-800/40 p-5 rounded-xl">
                <p className="text-xs text-purple-300">Amount Paid</p>
                <p className="text-3xl font-black text-green-400 mt-1">Rs {totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-purple-950/90 border border-purple-800/40 p-5 rounded-xl">
                <p className="text-xs text-purple-300">Outstanding</p>
                <p className="text-3xl font-black text-red-400 mt-1">Rs {totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-purple-950/90 border border-purple-800/40 rounded-xl p-6">
              <h3 className="font-bold text-purple-200 mb-4">Recent Shipments</h3>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-purple-300 border-b border-purple-700/50 text-xs uppercase">
                    <th className="pb-3 px-2">AWB</th>
                    <th className="pb-3 px-2">Receiver</th>
                    <th className="pb-3 px-2">Destination</th>
                    <th className="pb-3 px-2">Service</th>
                    <th className="pb-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.slice(0, 5).map(s => (
                    <tr key={s.id} className="border-b border-purple-800/40 hover:bg-purple-900/60/30">
                      <td className="py-3 px-2 font-mono text-purple-400 text-xs">{s.nexora_airwaybill}</td>
                      <td className="py-3 px-2 text-white">{s.receiver}</td>
                      <td className="py-3 px-2 text-purple-200">{s.destination}</td>
                      <td className="py-3 px-2"><span className="bg-purple-900/60 px-2 py-0.5 rounded text-xs text-blue-300">{s.service}</span></td>
                      <td className="py-3 px-2 text-right font-mono text-yellow-400">Rs {Number(s.debit || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NEW SHIPMENT */}
        {activeTab === 'new_shipment' && (
          <div className="max-w-2xl mx-auto">
            {!generatedLabel ? (
              <>
                <h2 className="text-2xl font-black text-white mb-2">New Shipment Request 📦</h2>
                <p className="text-purple-300 mb-6">Fill in the details — label will be generated instantly!</p>
                <div className="bg-purple-950/90 border border-purple-700/50 rounded-xl p-8">
                  <form onSubmit={handleNewShipment} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-purple-300">Receiver Name *</label>
                        <input className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="John Doe" value={formData.receiver_name}
                          onChange={(e) => setFormData({...formData, receiver_name: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-xs text-purple-300">Receiver Phone *</label>
                        <input className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="+1 234 567 8900" value={formData.receiver_phone}
                          onChange={(e) => setFormData({...formData, receiver_phone: e.target.value})} required />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-purple-300">Receiver Address *</label>
                        <input className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="123 Street, City, Country" value={formData.receiver_address}
                          onChange={(e) => setFormData({...formData, receiver_address: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-xs text-purple-300">Receiver Email</label>
                        <input type="email" className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="receiver@email.com" value={formData.receiver_email}
                          onChange={(e) => setFormData({...formData, receiver_email: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs text-purple-300">Destination Country *</label>
                        <input className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="United Kingdom" value={formData.destination}
                          onChange={(e) => setFormData({...formData, destination: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-xs text-purple-300">Weight (kg) *</label>
                        <input type="number" className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                          placeholder="2.5" value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: e.target.value})} required />
                      </div>
                      <div>
              <label className="text-xs text-purple-300">Shipment Date *</label>
              <input 
                type="date" 
                className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white" 
                value={formData.shipment_date || ''} 
                onChange={(e) => setFormData({...formData, shipment_date: e.target.value})} 
                required 
              />
            </div>

            <div>
              <label className="text-xs text-purple-300">Preferred Service *</label>
              <select className="w-full mt-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm" value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} required>
                <option value="">Select Service</option>
                <option value="DHL">DHL</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="Skynet">Skynet</option>
                <option value="Aramex">Aramex</option>
                <option value="TCS">TCS</option>
                <option value="Other">Other </option>
              </select>
            </div>
                    </div>
                    {submitError && (
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-xs">
                        {submitError}
                      </div>
                    )}
                    <button type="submit" disabled={submitting}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all text-sm uppercase tracking-wider">
                      {submitting ? 'Generating...' : '📦 Submit & Generate Label'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-2xl font-black text-white mb-2">✅ Shipment Booked!</h2>
                <p className="text-purple-300 mb-6">Your label is ready — save or print it</p>
                <div ref={labelRef} className="bg-white text-black p-8 rounded-xl border-4 border-black shadow-2xl max-w-md mx-auto mb-6">
                  <div className="border-b-2 border-black pb-3 mb-4">
                    <h1 className="text-2xl font-black tracking-widest">UT INTERNATIONAL</h1>
                    <p className="text-xs text-gray-500">Courier & International Shipping</p>
                  </div>
                  <div className="bg-black text-white text-center py-3 px-4 rounded mb-4">
                    <p className="text-xs font-bold text-gray-300 mb-1">BOOKING REFERENCE</p>
                    <p className="text-xl font-black font-mono tracking-wider">{generatedLabel.awb}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-400 font-bold">FROM</p>
                      <p className="font-bold">{generatedLabel.sender_name}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-400 font-bold">SERVICE</p>
                      <p className="font-black text-blue-700">{generatedLabel.service}</p>
                    </div>
                  </div>
                  <div className="border-2 border-black rounded p-3 mb-4">
                    <p className="text-xs text-gray-500 font-bold mb-1">DELIVER TO</p>
                    <p className="text-lg font-black">{generatedLabel.receiver_name}</p>
                    <p className="text-sm text-gray-600">{generatedLabel.receiver_address}</p>
                    <p className="text-sm font-bold">{generatedLabel.receiver_phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-bold">DESTINATION</p>
                      <p className="font-black text-lg">{generatedLabel.destination}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold">WEIGHT</p>
                      <p className="font-black text-lg">{generatedLabel.weight} KG</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 mt-4 pt-3 text-xs text-gray-400 text-center">
                    Date: {generatedLabel.date} • nexora-logistics.com
                  </div>
                </div>
                <div className="flex gap-3 max-w-md mx-auto">
                  <button type="button" onClick={handleDownloadLabel}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all text-sm">
                    📥 Download Label
                  </button>
                  <button type="button" onClick={() => window.print()}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all text-sm">
                    🖨️ Print Label
                  </button>
                  <button type="button" onClick={() => setGeneratedLabel(null)}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all text-sm">
                    ➕ New Shipment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY SHIPMENTS */}
        {activeTab === 'my_shipments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">My Shipments & Ledger 📑</h2>
                <p className="text-purple-300 text-sm mt-1">Complete history of all your parcels</p>
              </div>
              <button type="button"
                onClick={() => {
                  const rows = shipments.map((s, i) =>
                    `${i+1},${s.nexora_airwaybill},${s.receiver},${s.destination},${s.service},${s.debit || 0},${s.credit || 0},${new Date(s.created_at).toLocaleDateString()}`
                  ).join('\n');
                  const csv = `S.No,AWB,Receiver,Destination,Service,Debit,Credit,Date\n${rows}`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'nexora_ledger.csv'; a.click();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all">
                📥 Download CSV
              </button>
            </div>
            <div className="bg-purple-950/90 border border-purple-700/50 rounded-xl p-6 overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead>
                  <tr className="text-purple-300 border-b border-purple-700/50 text-xs uppercase">
                    <th className="pb-3 px-2">S.No</th>
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">AWB</th>
                    <th className="pb-3 px-2">Receiver</th>
                    <th className="pb-3 px-2">Destination</th>
                    <th className="pb-3 px-2">Service</th>
                    <th className="pb-3 px-2 text-right">Amount</th>
                    <th className="pb-3 px-2 text-right text-green-400">Paid</th>
                    <th className="pb-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="text-center py-8 text-purple-300">Loading...</td></tr>
                  ) : shipments.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-purple-300">No shipments yet</td></tr>
                  ) : shipments.map((s, idx) => (
                    <tr key={s.id} className="border-b border-purple-800/40 hover:bg-purple-900/60/30">
                      <td className="py-3 px-2 text-purple-400/70">{shipments.length - idx}</td>
                      <td className="py-3 px-2 text-purple-300 text-xs">{s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-2 font-mono text-purple-400 text-xs">{s.nexora_airwaybill}</td>
                      <td className="py-3 px-2 text-white font-medium">{s.receiver}</td>
                      <td className="py-3 px-2 text-purple-200">{s.destination}</td>
                      <td className="py-3 px-2"><span className="bg-purple-900/60 px-2 py-0.5 rounded text-xs text-blue-300">{s.service}</span></td>
                      <td className="py-3 px-2 text-right font-mono text-yellow-400">Rs {Number(s.debit || 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono text-green-400">Rs {Number(s.credit || 0).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.forwarding_awb ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                          {s.forwarding_awb ? 'Dispatched' : 'Processing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TRACKING ──────────────────────────────────────────────────────── */}
        {activeTab === 'tracking' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">Track Your Parcel 🔍</h2>
            <p className="text-purple-300 mb-6">Enter your Nexora AWB number to see live tracking</p>
            <TrackingSection shipments={shipments} />
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-white mb-6">My Profile 👤</h2>
            <div className="bg-purple-950/90 border border-purple-700/50 rounded-xl p-8 space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-3xl font-black">
                  {customerName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <label className="text-xs text-purple-300">Full Name</label>
                <p className="text-white font-bold mt-1 bg-purple-900/60 p-3 rounded-lg">{customerName}</p>
              </div>
              <div>
                <label className="text-xs text-purple-300">Email Address</label>
                <p className="text-white font-bold mt-1 bg-purple-900/60 p-3 rounded-lg">{customerEmail}</p>
              </div>
              <div>
                <label className="text-xs text-purple-300">Account Type</label>
                <p className="text-purple-400 font-bold mt-1 bg-purple-900/60 p-3 rounded-lg">Customer</p>
              </div>
              <div>
                <label className="text-xs text-purple-300">Total Shipments</label>
                <p className="text-white font-bold mt-1 bg-purple-900/60 p-3 rounded-lg">{shipments.length} Parcels</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── TRACKING SECTION COMPONENT ────────────────────────────────────────────────
function TrackingSection({ shipments }) {
  const [trackingNo, setTrackingNo] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [trackingUpdates, setTrackingUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // All possible statuses with their styles
  const statusStyleMap = {
    'Shipment Booked':        { color: 'bg-blue-900/40 text-purple-400 border-purple-500/30',       dot: 'bg-purple-500',    icon: '📋' },
    'Picked Up':              { color: 'bg-cyan-900/40 text-cyan-400 border-cyan-500/30',       dot: 'bg-cyan-500',    icon: '🛵' },
    'Arrived at Origin Hub':  { color: 'bg-indigo-900/40 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-500',  icon: '🏭' },
    'Departed Origin':        { color: 'bg-violet-900/40 text-violet-400 border-violet-500/30', dot: 'bg-violet-500',  icon: '✈️' },
    'In Transit':             { color: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500',  icon: '🚚' },
    'Arrived at Transit Hub': { color: 'bg-orange-900/40 text-orange-400 border-orange-500/30', dot: 'bg-orange-400',  icon: '🔄' },
    'Departed Transit Hub':   { color: 'bg-pink-900/40 text-pink-400 border-pink-500/30',       dot: 'bg-pink-500',    icon: '🛫' },
    'Arrived at Destination': { color: 'bg-teal-900/40 text-teal-400 border-teal-500/30',       dot: 'bg-teal-500',    icon: '🛬' },
    'Customs Clearance':      { color: 'bg-purple-900/40 text-purple-400 border-purple-500/30', dot: 'bg-purple-500',  icon: '🛃' },
    'Customs Released':       { color: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', icon: '✅' },
    'Out for Delivery':       { color: 'bg-lime-900/40 text-lime-400 border-lime-500/30',       dot: 'bg-lime-500',    icon: '🏃' },
    'Delivery Attempted':     { color: 'bg-amber-900/40 text-amber-400 border-amber-500/30',    dot: 'bg-amber-500',   icon: '🔔' },
    'Delivered':              { color: 'bg-green-900/40 text-green-400 border-green-500/30',    dot: 'bg-green-500',   icon: '📬' },
    'Delayed':                { color: 'bg-red-900/40 text-red-400 border-red-500/30',          dot: 'bg-red-500',     icon: '⚠️' },
    'On Hold':                { color: 'bg-slate-700/60 text-purple-200 border-slate-500/30',    dot: 'bg-slate-400',   icon: '⏸️' },
    'Exception':              { color: 'bg-red-900/60 text-red-300 border-red-400/40',          dot: 'bg-red-600',     icon: '🚨' },
  };

  const getStyle = (status) =>
    statusStyleMap[status] || { color: 'bg-purple-900/60 text-purple-300 border-slate-600', dot: 'bg-slate-500', icon: '📍' };

  const handleTrack = async (e) => {
    e.preventDefault();
    // Search in customer's own shipments first, then allow any AWB
    const found = shipments.find(s =>
      s.nexora_airwaybill?.toLowerCase() === trackingNo.trim().toLowerCase()
    );

    if (found) {
      setResult(found);
      setNotFound(false);
    } else {
      // Try fetching from DB even if not in current customer's shipments
      const { data } = await supabase
        .from('customer_ledgers')
        .select('*')
        .ilike('nexora_airwaybill', trackingNo.trim())
        .single();
      if (data) {
        setResult(data);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
        setTrackingUpdates([]);
        return;
      }
    }

    // Fetch tracking updates from tracking_updates table
    setLoadingUpdates(true);
    const { data: updates } = await supabase
      .from('tracking_updates')
      .select('*')
      .ilike('awb', trackingNo.trim())
      .order('created_at', { ascending: false });
    if (updates) setTrackingUpdates(updates);
    setLoadingUpdates(false);
  };

  // Latest status
  const latestStatus = trackingUpdates.length > 0 ? trackingUpdates[0].status : null;
  const latestStyle = latestStatus ? getStyle(latestStatus) : null;

  return (
    <div>
      {/* Search Box */}
      <form onSubmit={handleTrack} className="flex gap-3 mb-6">
        <input
          className="flex-1 bg-purple-900/60 border border-purple-700/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
          placeholder="Enter Nexora AWB e.g. NX-123456789"
          value={trackingNo}
          onChange={(e) => setTrackingNo(e.target.value)}
          required
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-lg transition-all">
          🔍 Track
        </button>
      </form>

      {notFound && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-red-400 text-sm">
          ❌ No shipment found with this AWB number.
        </div>
      )}

      {result && (
        <div className="space-y-4">

          {/* Shipment Summary Card */}
          <div className="bg-purple-950/90 border border-purple-700/50 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-purple-300 mb-1">Nexora AWB</p>
                <p className="text-xl font-black font-mono text-purple-400">{result.nexora_airwaybill}</p>
              </div>
              {latestStatus ? (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${latestStyle.color}`}>
                  {getStyle(latestStatus).icon} {latestStatus}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-700">
                  ⏳ Processing
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-purple-300">Receiver</p><p className="text-white font-medium">{result.receiver}</p></div>
              <div><p className="text-xs text-purple-300">Destination</p><p className="text-white font-medium">{result.destination}</p></div>
              <div><p className="text-xs text-purple-300">Service</p><p className="text-purple-400 font-bold">{result.service}</p></div>
              <div><p className="text-xs text-purple-300">Weight</p><p className="text-white font-medium">{result.weight} KG</p></div>
              {result.forwarding_awb && (
                <div className="col-span-2">
                  <p className="text-xs text-purple-300">Carrier AWB</p>
                  <p className="text-emerald-400 font-mono font-bold">{result.forward_vendor}: {result.forwarding_awb}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="bg-purple-950/90 border border-purple-700/50 rounded-xl p-6">
            <h3 className="font-bold text-slate-200 mb-5 flex items-center gap-2">
              📍 Tracking Timeline
              {loadingUpdates && <span className="text-xs text-purple-400/70 font-normal">Loading...</span>}
            </h3>

            {!loadingUpdates && trackingUpdates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📦</p>
                <p className="text-purple-300 text-sm font-medium">Shipment is being processed</p>
                <p className="text-purple-400/70 text-xs mt-1">Tracking updates will appear here once your parcel is on the move</p>
              </div>
            )}

            {trackingUpdates.length > 0 && (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-slate-700/60 rounded-full"></div>

                <div className="space-y-0">
                  {trackingUpdates.map((update, idx) => {
                    const style = getStyle(update.status);
                    const isLatest = idx === 0;
                    return (
                      <div key={update.id} className={`flex gap-4 relative pl-9 pb-6 ${isLatest ? '' : 'opacity-70'}`}>

                        {/* Timeline dot */}
                        <div className={`
                          absolute left-[8px] top-1 w-[15px] h-[15px] rounded-full border-2 border-slate-900 flex-shrink-0
                          ${style.dot}
                          ${isLatest ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-white/30 shadow-lg' : ''}
                        `}></div>

                        {/* Card */}
                        <div className={`
                          flex-1 rounded-xl p-4 border transition-all
                          ${isLatest
                            ? 'bg-purple-900/60/80 border-slate-500/60 shadow-md'
                            : 'bg-purple-900/60/20 border-purple-700/50/30'
                          }
                        `}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            {/* Status badge */}
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-bold ${style.color}`}>
                              <span>{style.icon}</span>
                              {update.status}
                            </span>
                            {isLatest && (
                              <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold tracking-wide flex-shrink-0">
                                LATEST
                              </span>
                            )}
                          </div>

                          {/* Location */}
                          <p className={`font-bold text-sm ${isLatest ? 'text-white' : 'text-purple-200'}`}>
                            📍 {update.location}
                          </p>

                          {/* Description */}
                          {update.description && (
                            <p className="text-purple-300 text-xs mt-1 leading-relaxed">
                              {update.description}
                            </p>
                          )}

                          {/* Time */}
                          <p className="text-purple-400/70 text-xs mt-2 flex items-center gap-1">
                            🕐 {new Date(update.created_at).toLocaleString('en-PK', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Origin point at bottom */}
                  <div className="flex gap-4 relative pl-9">
                    <div className="absolute left-[8px] top-1 w-[15px] h-[15px] rounded-full border-2 border-purple-700/50 bg-slate-600 flex-shrink-0"></div>
                    <div className="flex-1 pb-2">
                      <p className="text-purple-400/70 text-xs font-medium">
                        📋 Shipment registered in Nexora system
                      </p>
                      {result.created_at && (
                        <p className="text-slate-600 text-xs mt-0.5">
                          {new Date(result.created_at).toLocaleString('en-PK', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
