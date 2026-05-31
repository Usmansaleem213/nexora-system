import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [returnTab, setReturnTab] = useState('new_shipment');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    sender_name: '', sender_address: '', sender_phone: '', sender_email: '',
    receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '',
    destination: '', weight: '', service: ''
  });
  const [ledgerData, setLedgerData] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [labelData, setLabelData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sender_name: '', sender_address: '', sender_phone: '', sender_email: '',
    receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '',
    destination: '', weight: '', service: '',
    remote_status: 'Non-Remote',
    debit: 0, credit: 0, petrol: 0, remote_charges: 0,
    buying_rate: 0, forwarding_awb: '', forward_vendor: ''
  });

  const fetchLedger = async () => {
    const { data } = await supabase
      .from('customer_ledgers')
      .select('*')
      .not('status', 'eq', 'pending')
      .order('id', { ascending: false });
    if (data) setLedgerData(data);
  };

  const fetchPending = async () => {
    const { data } = await supabase
      .from('customer_ledgers')
      .select('*')
      .eq('status', 'pending')
      .order('id', { ascending: false });
    if (data) setPendingData(data);
  };

  useEffect(() => {
    fetchLedger();
    fetchPending();
  }, []);

  const handleApprovePending = (item) => {
    setEditId(item.id);
    setEditFormData({
      sender_name: item.sender_name || '',
      sender_address: item.sender_address || '',
      sender_phone: item.sender_phone || '',
      sender_email: item.sender_email || '',
      receiver_name: item.receiver || '',
      receiver_address: item.receiver_address || '',
      receiver_phone: item.receiver_phone || '',
      receiver_email: item.receiver_email || '',
      destination: item.destination || '',
      weight: item.weight || '',
      service: item.service || '',
      remote_status: 'Non-Remote',
      debit: 0, credit: 0, petrol: 0, remote_charges: 0,
      buying_rate: 0, forwarding_awb: '', forward_vendor: ''
    });
    setIsModalOpen(true);
  };

  const handleRejectPending = async (id) => {
    if (window.confirm('Is request ko reject karein?')) {
      await supabase.from('customer_ledgers').delete().eq('id', id);
      fetchPending();
    }
  };

  const getUniqueCustomers = () => {
    const customersMap = {};
    ledgerData.forEach(item => {
      if (item.sender_name) {
        const nameKey = item.sender_name.trim();
        if (!customersMap[nameKey]) {
          customersMap[nameKey] = {
            name: nameKey,
            phone: item.sender_phone || 'N/A',
            email: item.sender_email || 'N/A',
            address: item.sender_address || 'N/A',
            totalShipments: 0
          };
        }
        customersMap[nameKey].totalShipments += 1;
      }
    });
    return Object.values(customersMap);
  };

  const handleViewLabel = (item, fromTab) => {
    setLabelData({
      nexoraTracking: item.nexora_airwaybill,
      receiver_name: item.receiver,
      destination: item.destination,
      service: item.service
    });
    setReturnTab(fromTab);
    setActiveTab('new_shipment');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nexoraTracking = "NX-" + Math.floor(100000000 + Math.random() * 900000000);
    const dbPayload = {
      nexora_airwaybill: nexoraTracking, receiver: formData.receiver_name, destination: formData.destination,
      weight: formData.weight, service: formData.service, sender_name: formData.sender_name,
      sender_address: formData.sender_address, sender_phone: formData.sender_phone, sender_email: formData.sender_email,
      receiver_address: formData.receiver_address, receiver_phone: formData.receiver_phone, receiver_email: formData.receiver_email,
      remote_status: 'Non-Remote', debit: 0, credit: 0, petrol: 0, remote_charges: 0,
      buying_rate: 0, forwarding_awb: '', forward_vendor: '', status: 'approved'
    };
    const { error } = await supabase.from('customer_ledgers').insert([dbPayload]);
    if (!error) {
      setReturnTab('new_shipment');
      setLabelData({ ...formData, nexoraTracking });
      fetchLedger();
      setFormData({
        sender_name: '', sender_address: '', sender_phone: '', sender_email: '',
        receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '',
        destination: '', weight: '', service: ''
      });
    } else {
      alert("Error saving data: " + error.message);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditFormData({
      sender_name: item.sender_name || '', sender_address: item.sender_address || '',
      sender_phone: item.sender_phone || '', sender_email: item.sender_email || '',
      receiver_name: item.receiver || '', receiver_address: item.receiver_address || '',
      receiver_phone: item.receiver_phone || '', receiver_email: item.receiver_email || '',
      destination: item.destination || '', weight: item.weight || '', service: item.service || '',
      remote_status: item.remote_status || 'Non-Remote',
      debit: item.debit || 0, credit: item.credit || 0, petrol: item.petrol || 0,
      remote_charges: item.remote_charges || 0, buying_rate: item.buying_rate || 0,
      forwarding_awb: item.forwarding_awb || '', forward_vendor: item.forward_vendor || ''
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('customer_ledgers')
      .update({
        sender_name: editFormData.sender_name, sender_address: editFormData.sender_address,
        sender_phone: editFormData.sender_phone, sender_email: editFormData.sender_email,
        receiver: editFormData.receiver_name, receiver_address: editFormData.receiver_address,
        receiver_phone: editFormData.receiver_phone, receiver_email: editFormData.receiver_email,
        destination: editFormData.destination, weight: editFormData.weight, service: editFormData.service,
        remote_status: editFormData.remote_status,
        debit: Number(editFormData.debit), credit: Number(editFormData.credit),
        petrol: Number(editFormData.petrol), remote_charges: Number(editFormData.remote_charges),
        buying_rate: Number(editFormData.buying_rate),
        forwarding_awb: editFormData.forwarding_awb, forward_vendor: editFormData.forward_vendor,
        status: 'approved'
      })
      .eq('id', editId);

    if (!error) {
      setIsModalOpen(false);
      fetchLedger();
      fetchPending();
    } else {
      alert("Update failed: " + error.message);
    }
  };

  const getCalculatedLedger = (customerName) => {
    let filtered = ledgerData.filter(item => item.sender_name && item.sender_name.trim() === customerName);
    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.nexora_airwaybill && item.nexora_airwaybill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.receiver && item.receiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.forwarding_awb && item.forwarding_awb.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (startDate) filtered = filtered.filter(item => item.created_at && new Date(item.created_at) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(item => item.created_at && new Date(item.created_at) <= new Date(endDate + 'T23:59:59'));

    const chronological = [...filtered].reverse();
    let runningSum = 0;
    const withBalance = chronological.map((item) => {
      const d = Number(item.debit || 0);
      const c = Number(item.credit || 0);
      const p = Number(item.petrol || 0);
      const rc = Number(item.remote_charges || 0);
      const buy = Number(item.buying_rate || 0);
      runningSum = runningSum + d + p + rc - c;
      const totalSale = d + p + rc;
      const shipmentProfit = totalSale > 0 ? (totalSale - buy) : 0;
      return { ...item, runningBalance: runningSum, profit: shipmentProfit };
    });
    return withBalance.reverse();
  };

  const getLedgerMetrics = (customerName) => {
    const list = getCalculatedLedger(customerName);
    let totalOutstanding = list.length > 0 ? list[0].runningBalance : 0;
    let totalPaid = list.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    let totalProfit = list.reduce((sum, item) => sum + Number(item.profit || 0), 0);
    return { totalOutstanding, totalPaid, totalProfit, totalCount: list.length };
  };

  const shareLedgerWhatsApp = (customerName) => {
    const metrics = getLedgerMetrics(customerName);
    const text = `Dear Customer, here is your statement summary for *${customerName}* from *Nexora Courier & Logistics*:\n\n📦 *Total Shipments:* ${metrics.totalCount}\n💳 *Total Amount Paid:* Rs ${metrics.totalPaid.toLocaleString()}\n⚠️ *Current Outstanding Balance:* Rs ${metrics.totalOutstanding.toLocaleString()}\n\nThank you for choosing Nexora!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">

      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between fixed h-full">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-black tracking-wider text-blue-500">NEXORA ERP</h1>
            <p className="text-xs text-slate-400 mt-1">Global Logistics Control</p>
          </div>
          <nav className="p-4 space-y-2">
            <button type="button" onClick={() => { setActiveTab('pending'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'pending' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>🔔</span> Pending Requests
              {pendingData.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{pendingData.length}</span>
              )}
            </button>
            <button type="button" onClick={() => { setActiveTab('new_shipment'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'new_shipment' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>📦</span> New Shipment
            </button>
            <button type="button" onClick={() => { setActiveTab('history'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>📑</span> Shipment History
            </button>
            <button type="button" onClick={() => { setActiveTab('customers'); setSelectedCustomer(null); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>👥</span> Customers / Ledgers
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">v3.0 • Premium ERP Suite</div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 pl-64 p-8">

        {/* PENDING REQUESTS TAB */}
        {activeTab === 'pending' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-black text-white">🔔 Pending Shipment Requests</h2>
              <span className="bg-orange-500 text-white text-sm font-black px-3 py-1 rounded-full">{pendingData.length} New</span>
            </div>

            {pendingData.length === 0 ? (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-16 text-center">
                <p className="text-4xl mb-4">✅</p>
                <p className="text-slate-400 font-medium">Koi pending request nahi hai</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingData.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/60 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-4 gap-6 flex-1">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Customer</p>
                          <p className="font-bold text-white">{item.sender_name}</p>
                          <p className="text-xs text-slate-400">{item.sender_email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Receiver</p>
                          <p className="font-bold text-white">{item.receiver}</p>
                          <p className="text-xs text-slate-400">{item.receiver_phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Destination</p>
                          <p className="font-bold text-blue-400">{item.destination}</p>
                          <p className="text-xs text-slate-400">{item.weight} KG • {item.service}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">AWB</p>
                          <p className="font-mono text-xs text-slate-300">{item.nexora_airwaybill}</p>
                          <p className="text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <button type="button" onClick={() => handleApprovePending(item)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all">
                          ✅ Approve
                        </button>
                        <button type="button" onClick={() => handleRejectPending(item.id)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-all">
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEW SHIPMENT TAB */}
        {activeTab === 'new_shipment' && (
          <div>
            {!labelData ? (
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 text-blue-400">New Shipment Entry</h2>
                <div className="grid grid-cols-2 gap-4">
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Name" value={formData.sender_name} onChange={(e) => setFormData({...formData, sender_name: e.target.value})} required />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Name" value={formData.receiver_name} onChange={(e) => setFormData({...formData, receiver_name: e.target.value})} required />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Address" value={formData.sender_address} onChange={(e) => setFormData({...formData, sender_address: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Address" value={formData.receiver_address} onChange={(e) => setFormData({...formData, receiver_address: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Phone" value={formData.sender_phone} onChange={(e) => setFormData({...formData, sender_phone: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Phone Number" value={formData.receiver_phone} onChange={(e) => setFormData({...formData, receiver_phone: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Email" value={formData.sender_email} onChange={(e) => setFormData({...formData, sender_email: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Email" value={formData.receiver_email} onChange={(e) => setFormData({...formData, receiver_email: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Destination" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Weight (kg)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                  <select className="col-span-2 bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-slate-300" value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})} required>
                    <option value="">Select Service</option>
                    <option value="DHL">DHL</option><option value="FedEx">FedEx</option><option value="UPS">UPS</option><option value="Skynet">Skynet</option><option value="Aramex">Aramex</option><option value="TCS">TCS</option><option value="Other">Other</option>
                  </select>
                </div>
                <button type="submit" className="w-full mt-6 bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all text-sm uppercase tracking-wider text-white">Generate Label</button>
              </form>
            ) : (
              <div className="max-w-md mx-auto bg-white text-black p-6 rounded-lg border-4 border-black shadow-2xl">
                <h1 className="text-2xl font-black">NEXORA LOGISTICS</h1>
                <p className="text-3xl font-black my-4 border-y-2 border-black py-2">{labelData.nexoraTracking}</p>
                <p><strong>To:</strong> {labelData.receiver_name}</p>
                <p><strong>Dest:</strong> {labelData.destination}</p>
                <p><strong>Service:</strong> {labelData.service}</p>
                <div className="flex gap-2 mt-6">
                  <button type="button" onClick={() => window.print()} className="flex-1 bg-black text-white py-2 font-bold hover:bg-zinc-800">Print</button>
                  <button type="button" onClick={() => { setActiveTab(returnTab); setLabelData(null); }} className="flex-1 bg-gray-300 py-2 font-bold text-black hover:bg-gray-400">Back</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400">All Shipments History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-sm">
                    <th className="pb-3 px-2">AWB / Tracking</th>
                    <th className="pb-3 px-2">Sender</th>
                    <th className="pb-3 px-2">Receiver</th>
                    <th className="pb-3 px-2">Destination</th>
                    <th className="pb-3 px-2">Service</th>
                    <th className="pb-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {ledgerData.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-2 text-blue-400 font-mono font-bold">{item.nexora_airwaybill}</td>
                      <td className="py-3.5 px-2 text-slate-300">{item.sender_name || 'N/A'}</td>
                      <td className="py-3.5 px-2 font-medium text-white">{item.receiver}</td>
                      <td className="py-3.5 px-2 text-slate-300">{item.destination}</td>
                      <td className="py-3.5 px-2"><span className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-300 font-semibold">{item.service}</span></td>
                      <td className="py-3.5 px-2 text-center flex justify-center gap-3">
                        <button type="button" onClick={() => handleViewLabel(item, 'history')} className="text-blue-400 font-bold hover:text-blue-300 transition-all">Label</button>
                        <button type="button" onClick={() => handleEditClick(item)} className="text-yellow-500 font-bold hover:text-yellow-400 transition-all">Edit</button>
                        <button type="button" onClick={async () => { if(window.confirm("Delete this entry?")) { await supabase.from('customer_ledgers').delete().eq('id', item.id); fetchLedger(); } }} className="text-red-500 font-bold hover:text-red-400 transition-all">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="max-w-7xl mx-auto">
            {!selectedCustomer ? (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Customer Directory (Senders)</h2>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700 text-sm">
                      <th className="pb-3 px-2">Customer Name</th>
                      <th className="pb-3 px-2">Phone</th>
                      <th className="pb-3 px-2">Total Parcels</th>
                      <th className="pb-3 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {getUniqueCustomers().map((cust, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-2 font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => setSelectedCustomer(cust.name)}>👤 {cust.name}</td>
                        <td className="py-3.5 px-2 text-slate-300">{cust.phone}</td>
                        <td className="py-3.5 px-2 font-mono"><span className="bg-slate-800 px-2 py-0.5 rounded text-green-400 font-bold">{cust.totalShipments}</span></td>
                        <td className="py-3.5 px-2 text-center">
                          <button type="button" onClick={() => setSelectedCustomer(cust.name)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all">View Full Ledger</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {(() => {
                  const metrics = getLedgerMetrics(selectedCustomer);
                  return (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">Outstanding Balance</p>
                        <p className="text-xl font-black text-yellow-400 mt-1">Rs {metrics.totalOutstanding.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">Total Amount Paid</p>
                        <p className="text-xl font-black text-green-400 mt-1">Rs {metrics.totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">Net Profit (Nexora Only)</p>
                        <p className="text-xl font-black text-emerald-400 mt-1">Rs {metrics.totalProfit.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">Total Shipments</p>
                        <p className="text-xl font-black text-blue-400 mt-1">{metrics.totalCount} Parcels</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Premium Ledger Panel</span>
                      <h2 className="text-2xl font-black text-white mt-1">{selectedCustomer}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => shareLedgerWhatsApp(selectedCustomer)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">🟢 WhatsApp Share</button>
                      <button type="button" onClick={() => setSelectedCustomer(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-all">Back to List</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 bg-slate-950 p-4 rounded-lg mb-6 border border-slate-800">
                    <input type="text" className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500" placeholder="🔍 Search AWB, Receiver or Vendor No..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">From:</span>
                      <input type="date" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">To:</span>
                      <input type="date" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[1500px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700 uppercase tracking-wider font-semibold">
                          <th className="pb-3 px-2">S.No</th>
                          <th className="pb-3 px-2">Date</th>
                          <th className="pb-3 px-2">Service</th>
                          <th className="pb-3 px-2">Nexora AWB</th>
                          <th className="pb-3 px-2">Forwarding AWB</th>
                          <th className="pb-3 px-2">Receiver</th>
                          <th className="pb-3 px-2">Weight</th>
                          <th className="pb-3 px-2">Destination</th>
                          <th className="pb-3 px-2">Remote</th>
                          <th className="pb-3 px-2 text-right">Debit</th>
                          <th className="pb-3 px-2 text-right text-red-300">Remote Chg</th>
                          <th className="pb-3 px-2 text-right text-orange-400">Petrol</th>
                          <th className="pb-3 px-2 text-right text-green-400">Credit</th>
                          <th className="pb-3 px-2 text-right text-yellow-400">Balance</th>
                          <th className="pb-3 px-2 text-right text-emerald-400">Profit</th>
                          <th className="pb-3 px-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {getCalculatedLedger(selectedCustomer).map((item, idx, arr) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-all">
                            <td className="py-3 px-2 text-slate-500 font-mono">{arr.length - idx}</td>
                            <td className="py-3 px-2 text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-3 px-2 font-bold text-blue-400">{item.service}</td>
                            <td className="py-3 px-2 font-mono font-bold text-slate-300">{item.nexora_airwaybill}</td>
                            <td className="py-3 px-2 font-mono text-slate-400">{item.forwarding_awb ? `${item.forward_vendor || 'Partner'}: ${item.forwarding_awb}` : 'Pending'}</td>
                            <td className="py-3 px-2 text-white font-medium">{item.receiver}</td>
                            <td className="py-3 px-2 font-mono">{item.weight || '0'} KG</td>
                            <td className="py-3 px-2 text-slate-300">{item.destination}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.remote_status === 'Remote' ? 'bg-red-900/50 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                {item.remote_status || 'Non-Remote'}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-slate-300">Rs {Number(item.debit || 0).toLocaleString()}</td>
                            <td className="py-3 px-2 text-right font-mono text-red-400">Rs {Number(item.remote_charges || 0).toLocaleString()}</td>
                            <td className="py-3 px-2 text-right font-mono text-orange-400">Rs {Number(item.petrol || 0).toLocaleString()}</td>
                            <td className="py-3 px-2 text-right font-mono text-green-400">Rs {Number(item.credit || 0).toLocaleString()}</td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-yellow-400 bg-yellow-500/5">Rs {Number(item.runningBalance || 0).toLocaleString()}</td>
                            <td className="py-3 px-2 text-right font-mono text-emerald-400 font-bold">Rs {Number(item.profit || 0).toLocaleString()}</td>
                            <td className="py-3 px-2 text-center space-x-2">
                              <button type="button" onClick={() => handleViewLabel(item, 'customers')} className="text-blue-400 font-bold hover:underline">Label</button>
                              <button type="button" onClick={() => handleEditClick(item)} className="text-yellow-500 font-bold hover:underline">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-yellow-400 border-b border-slate-700 pb-2">✅ Approve & Setup Shipment</h3>
            <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs text-slate-400">Sender Name</label>
                <input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.sender_name} onChange={(e) => setEditFormData({...editFormData, sender_name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Receiver Name</label>
                <input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.receiver_name} onChange={(e) => setEditFormData({...editFormData, receiver_name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs text-slate-400">Destination</label>
                <input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.destination} onChange={(e) => setEditFormData({...editFormData, destination: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Weight (kg)</label>
                <input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.weight} onChange={(e) => setEditFormData({...editFormData, weight: e.target.value})} />
              </div>
              <div className="col-span-2 border-t border-slate-800 pt-3 mt-1 text-blue-400 font-bold">Forwarding & Route Vendor Details</div>
              <div>
                <label className="text-xs text-slate-400">Forward Vendor Partner</label>
                <select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.forward_vendor} onChange={(e) => setEditFormData({...editFormData, forward_vendor: e.target.value})}>
                  <option value="">Select Vendor</option>
                  <option value="DHL">DHL Forwarding</option>
                  <option value="FedEx">FedEx Express</option>
                  <option value="UPS">UPS Cargo</option>
                  <option value="Skynet">Skynet Network</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Forwarding Tracking Number (AWB)</label>
                <input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" placeholder="e.g. DHL-9832141" value={editFormData.forwarding_awb} onChange={(e) => setEditFormData({...editFormData, forwarding_awb: e.target.value})} />
              </div>
              <div className="col-span-2 border-t border-slate-800 pt-3 mt-1 text-emerald-400 font-bold">Ledger Accounts & Profit Tracking</div>
              <div>
                <label className="text-xs text-slate-400">Remote Status</label>
                <select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.remote_status} onChange={(e) => setEditFormData({...editFormData, remote_status: e.target.value})}>
                  <option value="Non-Remote">Non-Remote</option>
                  <option value="Remote">Remote Area</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Remote Charges</label>
                <input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.remote_charges} onChange={(e) => setEditFormData({...editFormData, remote_charges: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Debit Amount (Base Customer Rate)</label>
                <input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.debit} onChange={(e) => setEditFormData({...editFormData, debit: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Petrol Surcharge</label>
                <input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.petrol} onChange={(e) => setEditFormData({...editFormData, petrol: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-amber-500 font-bold">💸 Nexora Buying Cost (Cost Price)</label>
                <input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-amber-600 text-white font-mono" value={editFormData.buying_rate} onChange={(e) => setEditFormData({...editFormData, buying_rate: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-green-400 font-bold">Credit Amount (Customer Paid)</label>
                <input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-green-600 text-white font-mono" value={editFormData.credit} onChange={(e) => setEditFormData({...editFormData, credit: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400">Service Label</label>
                <select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.service} onChange={(e) => setEditFormData({...editFormData, service: e.target.value})} required>
                  <option value="DHL">DHL</option><option value="FedEx">FedEx</option><option value="UPS">UPS</option><option value="Skynet">Skynet</option><option value="Aramex">Aramex</option><option value="TCS">TCS</option><option value="Other">Other</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-green-600 py-2.5 rounded-lg font-bold hover:bg-green-500 transition-all text-white">✅ Approve & Save</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 py-2.5 rounded-lg font-bold hover:bg-slate-600 transition-all text-white">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}