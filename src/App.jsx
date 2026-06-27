import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [profilesData, setProfilesData] = useState([]);
  const [labelData, setLabelData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sender_name: '', sender_address: '', sender_phone: '', sender_email: '',
    receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '',
    destination: '', weight: '', service: '',
    remote_status: 'Non-Remote',
    debit: 0, credit: 0, petrol: 0, remote_charges: 0,
    buying_rate: 0, vendor_paid: 0, forwarding_awb: '', forward_vendor: ''
  });

  // TRACKING STATES
  const [trackingAwb, setTrackingAwb] = useState('');
  const [trackingUpdates, setTrackingUpdates] = useState([]);
  const [selectedAwbShipment, setSelectedAwbShipment] = useState(null);
  const [newUpdate, setNewUpdate] = useState({
    location: '', status: 'Picked Up', description: '', custom_time: ''
  });
  const [trackingMsg, setTrackingMsg] = useState('');

  // VENDOR STATES
  const [vendors, setVendors] = useState([]);
  const [vendorForm, setVendorForm] = useState({ name: '', total_due: 0, total_paid: 0, notes: '', payment_date: todayStr() });
  const [vendorMsg, setVendorMsg] = useState('');
  const [editVendorId, setEditVendorId] = useState(null);
  const [editVendorForm, setEditVendorForm] = useState({ name: '', total_due: 0, total_paid: 0, notes: '' });
  const [showAddVendor, setShowAddVendor] = useState(false);

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

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false });
    if (data) setProfilesData(data);
  };

  // VENDOR FUNCTIONS
  const fetchVendors = async () => {
    const { data } = await supabase.from('vendors').select('*').order('id', { ascending: false });
    if (data) setVendors(data);
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('vendors').insert([{
      name: vendorForm.name,
      total_due: Number(vendorForm.total_due),
      total_paid: Number(vendorForm.total_paid),
      notes: vendorForm.notes,
      created_at: vendorForm.payment_date ? new Date(vendorForm.payment_date + 'T12:00:00').toISOString() : new Date().toISOString()
    }]);
    if (!error) {
      setVendorMsg('✅ Payment add ho gayi!');
      setVendorForm({ name: '', total_due: 0, total_paid: 0, notes: '', payment_date: todayStr() });
      setShowAddVendor(false);
      fetchVendors();
      setTimeout(() => setVendorMsg(''), 3000);
    } else {
      setVendorMsg('❌ Error: ' + error.message);
    }
  };

  const handleEditVendor = (v) => {
    setEditVendorId(v.id);
    setEditVendorForm({ name: v.name, total_due: v.total_due || 0, total_paid: v.total_paid || 0, notes: v.notes || '' });
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('vendors').update({
      name: editVendorForm.name,
      total_due: Number(editVendorForm.total_due),
      total_paid: Number(editVendorForm.total_paid),
      notes: editVendorForm.notes
    }).eq('id', editVendorId);
    if (!error) { setEditVendorId(null); fetchVendors(); }
    else alert('Update failed: ' + error.message);
  };

  const handleDeleteVendor = async (id) => {
    if (window.confirm('Is vendor ko delete karein?')) {
      await supabase.from('vendors').delete().eq('id', id);
      fetchVendors();
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchPending();
    fetchProfiles();
    fetchVendors();
  }, []);

  // ─── TRACKING STATUS OPTIONS ───────────────────────────────────────────────
  const trackingStatuses = [
    { value: 'Shipment Booked',         label: '📋 Shipment Booked',           color: 'bg-blue-900/40 text-blue-400 border-blue-500/30',     dot: 'bg-blue-500' },
    { value: 'Picked Up',               label: '🛵 Picked Up',                  color: 'bg-cyan-900/40 text-cyan-400 border-cyan-500/30',     dot: 'bg-cyan-500' },
    { value: 'Arrived at Origin Hub',   label: '🏭 Arrived at Origin Hub',      color: 'bg-indigo-900/40 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-500' },
    { value: 'Departed Origin',         label: '✈️ Departed Origin',            color: 'bg-violet-900/40 text-violet-400 border-violet-500/30', dot: 'bg-violet-500' },
    { value: 'In Transit',              label: '🚚 In Transit',                  color: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500' },
    { value: 'Arrived at Transit Hub',  label: '🔄 Arrived at Transit Hub',     color: 'bg-orange-900/40 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
    { value: 'Departed Transit Hub',    label: '🛫 Departed Transit Hub',       color: 'bg-pink-900/40 text-pink-400 border-pink-500/30',     dot: 'bg-pink-500' },
    { value: 'Arrived at Destination',  label: '🛬 Arrived at Destination',     color: 'bg-teal-900/40 text-teal-400 border-teal-500/30',     dot: 'bg-teal-500' },
    { value: 'Customs Clearance',       label: '🛃 Customs Clearance',          color: 'bg-purple-900/40 text-purple-400 border-purple-500/30', dot: 'bg-purple-500' },
    { value: 'Customs Released',        label: '✅ Customs Released',           color: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    { value: 'Out for Delivery',        label: '🏃 Out for Delivery',           color: 'bg-lime-900/40 text-lime-400 border-lime-500/30',     dot: 'bg-lime-500' },
    { value: 'Delivery Attempted',      label: '🔔 Delivery Attempted',         color: 'bg-amber-900/40 text-amber-400 border-amber-500/30',  dot: 'bg-amber-500' },
    { value: 'Delivered',               label: '📬 Delivered',                  color: 'bg-green-900/40 text-green-400 border-green-500/30',  dot: 'bg-green-500' },
    { value: 'Delayed',                 label: '⚠️ Delayed',                    color: 'bg-red-900/40 text-red-400 border-red-500/30',        dot: 'bg-red-500' },
    { value: 'On Hold',                 label: '⏸️ On Hold',                    color: 'bg-slate-700/60 text-slate-300 border-slate-500/30',  dot: 'bg-slate-400' },
    { value: 'Exception',               label: '🚨 Exception / Issue',          color: 'bg-red-900/60 text-red-300 border-red-400/40',        dot: 'bg-red-600' },
  ];

  const getStatusStyle = (statusValue) => {
    return trackingStatuses.find(s => s.value === statusValue) || {
      color: 'bg-slate-800 text-slate-400 border-slate-600',
      dot: 'bg-slate-500'
    };
  };

  // TRACKING FUNCTIONS
  const handleSearchTracking = async (e) => {
    e.preventDefault();
    const shipment = ledgerData.find(s => s.nexora_airwaybill?.toLowerCase() === trackingAwb.toLowerCase());
    if (!shipment) {
      setTrackingMsg('❌ Koi shipment nahi mila is AWB se');
      setSelectedAwbShipment(null);
      setTrackingUpdates([]);
      return;
    }
    setSelectedAwbShipment(shipment);
    setTrackingMsg('');
    const { data } = await supabase
      .from('tracking_updates')
      .select('*')
      .eq('awb', shipment.nexora_airwaybill)
      .order('created_at', { ascending: false });
    if (data) setTrackingUpdates(data);
  };

  const handleAddTrackingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAwbShipment) return;
    const insertTime = newUpdate.custom_time
      ? new Date(newUpdate.custom_time).toISOString()
      : new Date().toISOString();
    const { error } = await supabase.from('tracking_updates').insert([{
      awb: selectedAwbShipment.nexora_airwaybill,
      location: newUpdate.location,
      status: newUpdate.status,
      description: newUpdate.description,
      created_at: insertTime
    }]);
    if (!error) {
      setTrackingMsg('✅ Tracking update add ho gaya!');
      setNewUpdate({ location: '', status: 'Picked Up', description: '', custom_time: '' });
      const { data } = await supabase
        .from('tracking_updates')
        .select('*')
        .eq('awb', selectedAwbShipment.nexora_airwaybill)
        .order('created_at', { ascending: false });
      if (data) setTrackingUpdates(data);
    } else {
      setTrackingMsg('❌ Error: ' + error.message);
    }
  };

  const handleDeleteTrackingUpdate = async (id) => {
    await supabase.from('tracking_updates').delete().eq('id', id);
    const { data } = await supabase
      .from('tracking_updates')
      .select('*')
      .eq('awb', selectedAwbShipment.nexora_airwaybill)
      .order('created_at', { ascending: false });
    if (data) setTrackingUpdates(data);
  };

  // DASHBOARD METRICS
  const getDashboardMetrics = () => {
    const totalShipments = ledgerData.length;
    const totalRevenue = ledgerData.reduce((sum, item) =>
      sum + Number(item.debit || 0) + Number(item.petrol || 0) + Number(item.remote_charges || 0), 0);
    const totalCost = ledgerData.reduce((sum, item) => sum + Number(item.buying_rate || 0), 0);
    const totalNetProfit = totalRevenue - totalCost;
    const totalWeight = ledgerData.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const totalOutstanding = ledgerData.reduce((sum, item) =>
      sum + Number(item.debit || 0) + Number(item.petrol || 0) + Number(item.remote_charges || 0) - Number(item.credit || 0), 0);
    // Vendor paid/baaki from vendors table
    const totalVendorPaid = vendors.reduce((sum, v) => sum + Number(v.total_paid || 0), 0);
    const totalVendorBaaki = totalCost - totalVendorPaid;
    return { totalShipments, totalRevenue, totalNetProfit, totalWeight, totalOutstanding, totalCost, totalVendorPaid, totalVendorBaaki };
  };

  const handleApprovePending = (item) => {
    setEditId(item.id);
    setEditFormData({
      sender_name: item.sender_name || '', sender_address: item.sender_address || '',
      sender_phone: item.sender_phone || '', sender_email: item.sender_email || '',
      receiver_name: item.receiver || '', receiver_address: item.receiver_address || '',
      receiver_phone: item.receiver_phone || '', receiver_email: item.receiver_email || '',
      destination: item.destination || '', weight: item.weight || '', service: item.service || '',
      remote_status: 'Non-Remote',
      debit: 0, credit: 0, petrol: 0, remote_charges: 0,
      buying_rate: 0, vendor_paid: 0, forwarding_awb: '', forward_vendor: ''
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
          customersMap[nameKey] = { name: nameKey, phone: item.sender_phone || 'N/A', email: item.sender_email || 'N/A', totalShipments: 0 };
        }
        customersMap[nameKey].totalShipments += 1;
      }
    });
    profilesData.forEach(profile => {
      if (profile.full_name && !customersMap[profile.full_name.trim()]) {
        customersMap[profile.full_name.trim()] = { name: profile.full_name.trim(), phone: profile.phone || 'N/A', email: profile.email || 'N/A', totalShipments: 0 };
      }
    });
    return Object.values(customersMap);
  };

  const handleViewLabel = (item, fromTab) => {
    setLabelData({ nexoraTracking: item.nexora_airwaybill, receiver_name: item.receiver, destination: item.destination, service: item.service });
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
      setFormData({ sender_name: '', sender_address: '', sender_phone: '', sender_email: '', receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '', destination: '', weight: '', service: '' });
    } else { alert("Error saving data: " + error.message); }
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
      vendor_paid: item.vendor_paid || 0,
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
        vendor_paid: Number(editFormData.vendor_paid),
        forwarding_awb: editFormData.forwarding_awb, forward_vendor: editFormData.forward_vendor,
        status: 'approved'
      })
      .eq('id', editId);
    if (!error) { setIsModalOpen(false); fetchLedger(); fetchPending(); }
    else { alert("Update failed: " + error.message); }
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
      const d = Number(item.debit || 0), c = Number(item.credit || 0), p = Number(item.petrol || 0), rc = Number(item.remote_charges || 0), buy = Number(item.buying_rate || 0);
      runningSum = runningSum + d + p + rc - c;
      const totalSale = d + p + rc;
      return { ...item, runningBalance: runningSum, profit: totalSale > 0 ? (totalSale - buy) : 0 };
    });
    return withBalance.reverse();
  };

  const getLedgerMetrics = (customerName) => {
    const list = getCalculatedLedger(customerName);
    return {
      totalOutstanding: list.length > 0 ? list[0].runningBalance : 0,
      totalPaid: list.reduce((sum, item) => sum + Number(item.credit || 0), 0),
      totalProfit: list.reduce((sum, item) => sum + Number(item.profit || 0), 0),
      totalCount: list.length
    };
  };

  const shareLedgerWhatsApp = (customerName) => {
    const metrics = getLedgerMetrics(customerName);
    const text = `Dear Customer, here is your statement summary for *${customerName}* from *Nexora Courier & Logistics*:\n\n📦 *Total Shipments:* ${metrics.totalCount}\n💳 *Total Amount Paid:* Rs ${metrics.totalPaid.toLocaleString()}\n⚠️ *Current Outstanding Balance:* Rs ${metrics.totalOutstanding.toLocaleString()}\n\nThank you for choosing Nexora!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const metrics = getDashboardMetrics();

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
            <button type="button" onClick={() => { setActiveTab('dashboard'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>📊</span> Dashboard
            </button>
            <button type="button" onClick={() => { setActiveTab('pending'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'pending' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>🔔</span> Pending Requests
              {pendingData.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{pendingData.length}</span>}
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
            <button type="button" onClick={() => { setActiveTab('tracking_control'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'tracking_control' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>🗺️</span> Tracking Control
            </button>
            <button type="button" onClick={() => { setActiveTab('vendors'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'vendors' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>🏢</span> Vendors
            </button>
            <button type="button" onClick={() => { setActiveTab('registered'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'registered' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>🆕</span> Registered Users
              {profilesData.length > 0 && <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{profilesData.length}</span>}
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">v3.0 • Premium ERP Suite</div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 pl-64 p-8">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">📊 Admin Dashboard</h2>
            <p className="text-slate-400 mb-6">Nexora Courier & Logistics — Overview</p>
            {/* ROW 1 — 3 cards */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 border border-blue-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Total Shipments</p>
                <p className="text-3xl font-black text-blue-400 mt-2">{metrics.totalShipments}</p>
                <p className="text-xs text-slate-500 mt-1">All time</p>
              </div>
              <div className="bg-slate-900 border border-yellow-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Total Revenue</p>
                <p className="text-2xl font-black text-yellow-400 mt-2">Rs {metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Gross billing</p>
              </div>
              <div className="bg-slate-900 border border-orange-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">💸 Total Buying Cost</p>
                <p className="text-2xl font-black text-orange-400 mt-2">Rs {metrics.totalCost.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Vendor ko diye gaye</p>
              </div>
            </div>
            {/* ROW 2 — 5 cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Net Profit</p>
                <p className="text-2xl font-black text-emerald-400 mt-2">Rs {metrics.totalNetProfit.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">After buying cost</p>
              </div>
              <div className="bg-slate-900 border border-purple-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Total Weight</p>
                <p className="text-2xl font-black text-purple-400 mt-2">{Number(metrics.totalWeight).toFixed(1)} KG</p>
                <p className="text-xs text-slate-500 mt-1">All shipments</p>
              </div>
              <div className="bg-slate-900 border border-red-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Outstanding</p>
                <p className="text-2xl font-black text-red-400 mt-2">Rs {metrics.totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Unpaid balance</p>
              </div>
              <div className="bg-slate-900 border border-green-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">✅ Vendor Paid</p>
                <p className="text-2xl font-black text-green-400 mt-2">Rs {metrics.totalVendorPaid.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Vendor ko de diye</p>
              </div>
              <div className="bg-slate-900 border border-rose-500/20 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">🔴 Vendor Baaki</p>
                <p className="text-2xl font-black text-rose-400 mt-2">Rs {metrics.totalVendorBaaki.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Vendor ko dene hain</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Pending Requests</p>
                <p className="text-3xl font-black text-orange-400 mt-2">{pendingData.length}</p>
                <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Registered Users</p>
                <p className="text-3xl font-black text-blue-400 mt-2">{profilesData.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total signups</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">Active Customers</p>
                <p className="text-3xl font-black text-green-400 mt-2">{getUniqueCustomers().length}</p>
                <p className="text-xs text-slate-500 mt-1">With shipments</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-slate-300 mb-4">🕐 Recent Shipments</h3>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase">
                    <th className="pb-3 px-2">AWB</th><th className="pb-3 px-2">Sender</th><th className="pb-3 px-2">Receiver</th><th className="pb-3 px-2">Destination</th><th className="pb-3 px-2">Service</th><th className="pb-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.slice(0, 8).map(s => (
                    <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 px-2 font-mono text-blue-400 text-xs">{s.nexora_airwaybill}</td>
                      <td className="py-3 px-2 text-slate-300">{s.sender_name || 'N/A'}</td>
                      <td className="py-3 px-2 text-white font-medium">{s.receiver}</td>
                      <td className="py-3 px-2 text-slate-300">{s.destination}</td>
                      <td className="py-3 px-2"><span className="bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-300">{s.service}</span></td>
                      <td className="py-3 px-2 text-right font-mono text-yellow-400">Rs {Number(s.debit || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TRACKING CONTROL TAB ──────────────────────────────────────────── */}
        {activeTab === 'tracking_control' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">🗺️ Tracking Control Panel</h2>
            <p className="text-slate-400 mb-6">Kisi bhi shipment ki location aur status manually update karo</p>

            {/* SEARCH AWB */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-slate-300 mb-4">Step 1: AWB Search Karo</h3>
              <form onSubmit={handleSearchTracking} className="flex gap-3">
                <input
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Nexora AWB daalo e.g. NX-123456789"
                  value={trackingAwb}
                  onChange={(e) => setTrackingAwb(e.target.value)}
                  required
                />
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-lg transition-all">
                  🔍 Search
                </button>
              </form>
              {trackingMsg && !trackingMsg.startsWith('✅') && (
                <p className="text-red-400 text-sm mt-3">{trackingMsg}</p>
              )}
            </div>

            {selectedAwbShipment && (
              <>
                {/* SHIPMENT INFO */}
                <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-slate-400">AWB</p><p className="font-mono font-bold text-purple-400">{selectedAwbShipment.nexora_airwaybill}</p></div>
                    <div><p className="text-xs text-slate-400">Sender</p><p className="font-bold text-white">{selectedAwbShipment.sender_name}</p></div>
                    <div><p className="text-xs text-slate-400">Receiver</p><p className="font-bold text-white">{selectedAwbShipment.receiver}</p></div>
                    <div><p className="text-xs text-slate-400">Destination</p><p className="font-bold text-blue-400">{selectedAwbShipment.destination}</p></div>
                  </div>
                </div>

                {/* ADD NEW UPDATE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-slate-300 mb-4">Step 2: Naya Tracking Update Add Karo</h3>
                  <form onSubmit={handleAddTrackingUpdate} className="grid grid-cols-2 gap-4">

                    {/* Status Dropdown */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Status *</label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                        value={newUpdate.status}
                        onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value})}
                      >
                        {trackingStatuses.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location *</label>
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Paris, France"
                        value={newUpdate.location}
                        onChange={(e) => setNewUpdate({...newUpdate, location: e.target.value})}
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Description / Note</label>
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Package has arrived at Charles de Gaulle Airport"
                        value={newUpdate.description}
                        onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                      />
                    </div>

                    {/* Custom Date/Time */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Date & Time (optional — default: now)</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                        value={newUpdate.custom_time}
                        onChange={(e) => setNewUpdate({...newUpdate, custom_time: e.target.value})}
                      />
                    </div>

                    {trackingMsg && (
                      <div className={`col-span-2 text-xs p-3 rounded-lg ${trackingMsg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
                        {trackingMsg}
                      </div>
                    )}
                    <div className="col-span-2">
                      <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all">
                        ➕ Add Tracking Update
                      </button>
                    </div>
                  </form>
                </div>

                {/* TIMELINE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                  <h3 className="font-bold text-slate-300 mb-5">
                    📍 Live Tracking Timeline
                    <span className="ml-2 text-xs bg-purple-900/50 text-purple-400 border border-purple-700 px-2 py-0.5 rounded-full font-normal">
                      {trackingUpdates.length} updates
                    </span>
                  </h3>

                  {trackingUpdates.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">Abhi koi tracking update nahi hai</p>
                  ) : (
                    <div className="relative">
                      {/* vertical line */}
                      <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-slate-700 rounded-full"></div>

                      <div className="space-y-1">
                        {trackingUpdates.map((update, idx) => {
                          const style = getStatusStyle(update.status);
                          const isLatest = idx === 0;
                          return (
                            <div key={update.id} className={`flex gap-4 relative pl-10 pb-5 ${isLatest ? '' : 'opacity-75'}`}>
                              {/* dot */}
                              <div className={`absolute left-[11px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${style.dot} ${isLatest ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-purple-400' : ''}`}></div>

                              <div className={`flex-1 rounded-xl p-4 border ${isLatest ? 'bg-slate-800/60 border-slate-600' : 'bg-slate-800/20 border-slate-700/50'}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    {/* Status badge */}
                                    <span className={`inline-block text-xs px-2 py-0.5 rounded border font-bold mb-2 ${style.color}`}>
                                      {update.status}
                                    </span>
                                    {isLatest && (
                                      <span className="ml-2 text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">LATEST</span>
                                    )}
                                    {/* Location */}
                                    <p className="font-bold text-white text-sm">📍 {update.location}</p>
                                    {/* Description */}
                                    {update.description && (
                                      <p className="text-slate-400 text-xs mt-1">{update.description}</p>
                                    )}
                                    {/* Time */}
                                    <p className="text-slate-500 text-xs mt-1.5">
                                      🕐 {new Date(update.created_at).toLocaleString('en-PK', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTrackingUpdate(update.id)}
                                    className="text-red-500/50 hover:text-red-400 text-xs font-bold px-2 py-1 rounded hover:bg-red-900/20 transition-all flex-shrink-0"
                                    title="Delete this update"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* PENDING REQUESTS */}
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
                        <div><p className="text-xs text-slate-400 mb-1">Customer</p><p className="font-bold text-white">{item.sender_name}</p><p className="text-xs text-slate-400">{item.sender_email}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Receiver</p><p className="font-bold text-white">{item.receiver}</p><p className="text-xs text-slate-400">{item.receiver_phone}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Destination</p><p className="font-bold text-blue-400">{item.destination}</p><p className="text-xs text-slate-400">{item.weight} KG • {item.service}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">AWB</p><p className="font-mono text-xs text-slate-300">{item.nexora_airwaybill}</p><p className="text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</p></div>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <button type="button" onClick={() => handleApprovePending(item)} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all">✅ Approve</button>
                        <button type="button" onClick={() => handleRejectPending(item.id)} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-all">❌ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REGISTERED USERS */}
        {activeTab === 'registered' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">🆕 Registered Users</h2>
            <p className="text-slate-400 mb-6">Website pe signup karne wale tamam users</p>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase">
                    <th className="pb-3 px-2">Name</th><th className="pb-3 px-2">Email</th><th className="pb-3 px-2">Phone</th><th className="pb-3 px-2">Joined</th><th className="pb-3 px-2 text-center">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {profilesData.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">Abhi tak koi signup nahi hua</td></tr>
                  ) : profilesData.map((profile, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30 transition-all">
                      <td className="py-3.5 px-2 font-bold text-white">👤 {profile.full_name || 'N/A'}</td>
                      <td className="py-3.5 px-2 text-slate-300">{profile.email || 'N/A'}</td>
                      <td className="py-3.5 px-2 text-slate-300 font-mono">{profile.phone || 'N/A'}</td>
                      <td className="py-3.5 px-2 text-slate-400 text-xs">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3.5 px-2 text-center">
                        {profile.phone && profile.phone !== 'N/A' ? (
                          <button type="button" onClick={() => window.open(`https://wa.me/92${profile.phone.replace(/^0/, '').replace(/\D/g, '')}`, '_blank')}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold transition-all">
                            💬 WhatsApp
                          </button>
                        ) : <span className="text-slate-600 text-xs">No phone</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NEW SHIPMENT */}
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

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400">All Shipments History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-sm">
                    <th className="pb-3 px-2">AWB / Tracking</th><th className="pb-3 px-2">Sender</th><th className="pb-3 px-2">Receiver</th><th className="pb-3 px-2">Destination</th><th className="pb-3 px-2">Service</th><th className="pb-3 px-2 text-center">Action</th>
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

        {/* CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="max-w-7xl mx-auto">
            {!selectedCustomer ? (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Customer Directory</h2>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700 text-sm">
                      <th className="pb-3 px-2">Customer Name</th><th className="pb-3 px-2">Phone</th><th className="pb-3 px-2">Email</th><th className="pb-3 px-2">Total Parcels</th><th className="pb-3 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {getUniqueCustomers().map((cust, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-2 font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => setSelectedCustomer(cust.name)}>👤 {cust.name}</td>
                        <td className="py-3.5 px-2 text-slate-300">{cust.phone}</td>
                        <td className="py-3.5 px-2 text-slate-300">{cust.email}</td>
                        <td className="py-3.5 px-2 font-mono"><span className="bg-slate-800 px-2 py-0.5 rounded text-green-400 font-bold">{cust.totalShipments}</span></td>
                        <td className="py-3.5 px-2 text-center">
                          <button type="button" onClick={() => setSelectedCustomer(cust.name)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all">View Ledger</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {(() => {
                  const m = getLedgerMetrics(selectedCustomer);
                  return (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400 font-medium">Outstanding Balance</p><p className="text-xl font-black text-yellow-400 mt-1">Rs {m.totalOutstanding.toLocaleString()}</p></div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400 font-medium">Total Amount Paid</p><p className="text-xl font-black text-green-400 mt-1">Rs {m.totalPaid.toLocaleString()}</p></div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400 font-medium">Net Profit</p><p className="text-xl font-black text-emerald-400 mt-1">Rs {m.totalProfit.toLocaleString()}</p></div>
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400 font-medium">Total Shipments</p><p className="text-xl font-black text-blue-400 mt-1">{m.totalCount} Parcels</p></div>
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
                    <div className="flex items-center gap-2 text-xs"><span className="text-slate-400">From:</span><input type="date" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                    <div className="flex items-center gap-2 text-xs"><span className="text-slate-400">To:</span><input type="date" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[1500px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700 uppercase tracking-wider font-semibold">
                          <th className="pb-3 px-2">S.No</th><th className="pb-3 px-2">Date</th><th className="pb-3 px-2">Service</th><th className="pb-3 px-2">Nexora AWB</th><th className="pb-3 px-2">Forwarding AWB</th><th className="pb-3 px-2">Receiver</th><th className="pb-3 px-2">Weight</th><th className="pb-3 px-2">Destination</th><th className="pb-3 px-2">Remote</th><th className="pb-3 px-2 text-right">Debit</th><th className="pb-3 px-2 text-right text-red-300">Remote Chg</th><th className="pb-3 px-2 text-right text-orange-400">Petrol</th><th className="pb-3 px-2 text-right text-green-400">Credit</th><th className="pb-3 px-2 text-right text-yellow-400">Balance</th><th className="pb-3 px-2 text-right text-emerald-400">Profit</th><th className="pb-3 px-2 text-center">Action</th>
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
                            <td className="py-3 px-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.remote_status === 'Remote' ? 'bg-red-900/50 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>{item.remote_status || 'Non-Remote'}</span></td>
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
        {/* ─── VENDORS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'vendors' && (() => {
          // Total buying cost from ALL shipments (automatic)
          const totalDue = ledgerData.reduce((sum, item) => sum + Number(item.buying_rate || 0), 0);

          return (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-black text-white mb-2">🏢 Vendor Payment</h2>
              <p className="text-slate-400 text-sm mb-6">Vendor ko kitna dena tha, diya, aur baaki hai</p>

              {/* SUMMARY CARD */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Overall Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Total Due — automatic from ledger */}
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-amber-400 font-bold mb-1">💸 Total Due</p>
                    <p className="text-2xl font-black text-amber-400">Rs {totalDue.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Sab shipments ka buying cost</p>
                  </div>
                  {/* Total Paid — from vendors table */}
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-400 font-bold mb-1">✅ Total Paid</p>
                    <p className="text-2xl font-black text-green-400">
                      Rs {vendors.reduce((s, v) => s + Number(v.total_paid || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Vendor ko de diye</p>
                  </div>
                  {/* Baaki — automatic */}
                  {(() => {
                    const paid = vendors.reduce((s, v) => s + Number(v.total_paid || 0), 0);
                    const baaki = totalDue - paid;
                    return (
                      <div className={`border rounded-xl p-4 text-center ${baaki > 0 ? 'bg-rose-900/20 border-rose-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
                        <p className={`text-xs font-bold mb-1 ${baaki > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                          {baaki > 0 ? '🔴 Baaki' : '✅ Clear'}
                        </p>
                        <p className={`text-2xl font-black ${baaki > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                          Rs {Math.abs(baaki).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{baaki > 0 ? 'Abhi dena hai' : 'Sab clear!'}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Progress bar */}
                {totalDue > 0 && (() => {
                  const paid = vendors.reduce((s, v) => s + Number(v.total_paid || 0), 0);
                  const pct = Math.min(100, Math.round((paid / totalDue) * 100));
                  return (
                    <div className="mt-5">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Payment Progress</span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* PAYMENT ENTRIES */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-300">💳 Payment History</h3>
                  <button type="button"
                    onClick={() => setShowAddVendor(!showAddVendor)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg transition-all text-sm">
                    {showAddVendor ? '✕ Cancel' : '➕ Payment Add Karo'}
                  </button>
                </div>

                {/* ADD PAYMENT FORM */}
                {showAddVendor && (
                  <form onSubmit={handleAddVendor} className="bg-slate-800/50 rounded-xl p-4 mb-4 space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Payment Note / Label *</label>
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500"
                        placeholder="e.g. 1st installment, June payment..."
                        value={vendorForm.name}
                        onChange={(e) => setVendorForm({...vendorForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-green-400 font-bold block mb-1">✅ Amount Paid (Rs)</label>
                      <input type="number"
                        className="w-full bg-slate-800 border border-green-500/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500"
                        placeholder="e.g. 10000"
                        value={vendorForm.total_paid}
                        onChange={(e) => setVendorForm({...vendorForm, total_paid: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-blue-400 font-bold block mb-1">📅 Payment Date</label>
                      <input type="date"
                        className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500"
                        value={vendorForm.payment_date}
                        onChange={(e) => setVendorForm({...vendorForm, payment_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Notes (optional)</label>
                      <input
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm"
                        placeholder="Koi note..."
                        value={vendorForm.notes}
                        onChange={(e) => setVendorForm({...vendorForm, notes: e.target.value})}
                      />
                    </div>
                    {vendorMsg && (
                      <div className={`text-xs p-3 rounded-lg ${vendorMsg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
                        {vendorMsg}
                      </div>
                    )}
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all">
                      ✅ Payment Save Karo
                    </button>
                  </form>
                )}

                {/* PAYMENTS LIST */}
                {vendors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">💳</p>
                    <p className="text-slate-400 text-sm">Abhi koi payment entry nahi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendors.map((v) => {
                      const isEditing = editVendorId === v.id;
                      return (
                        <div key={v.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                          {!isEditing ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-white">{v.name}</p>
                                {v.notes && <p className="text-xs text-slate-400 mt-0.5">{v.notes}</p>}
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {v.created_at ? new Date(v.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-xl font-black text-green-400">Rs {Number(v.total_paid || 0).toLocaleString()}</p>
                                <button type="button" onClick={() => handleEditVendor(v)}
                                  className="text-yellow-400 hover:text-yellow-300 text-xs font-bold px-2 py-1 rounded hover:bg-yellow-900/20 transition-all">✏️</button>
                                <button type="button" onClick={() => handleDeleteVendor(v.id)}
                                  className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded hover:bg-red-900/20 transition-all">🗑️</button>
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleUpdateVendor} className="space-y-3">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Payment Label *</label>
                                <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                                  value={editVendorForm.name}
                                  onChange={(e) => setEditVendorForm({...editVendorForm, name: e.target.value})} required />
                              </div>
                              <div>
                                <label className="text-xs text-green-400 font-bold block mb-1">✅ Amount Paid</label>
                                <input type="number" className="w-full bg-slate-800 border border-green-500/50 rounded-lg p-2.5 text-white text-sm"
                                  value={editVendorForm.total_paid}
                                  onChange={(e) => setEditVendorForm({...editVendorForm, total_paid: e.target.value})} />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Notes</label>
                                <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
                                  value={editVendorForm.notes}
                                  onChange={(e) => setEditVendorForm({...editVendorForm, notes: e.target.value})} />
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-all text-sm">✅ Save</button>
                                <button type="button" onClick={() => setEditVendorId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-all text-sm">Cancel</button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}



      </div>

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-yellow-400 border-b border-slate-700 pb-2">✅ Approve & Setup Shipment</h3>
            <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="text-xs text-slate-400">Sender Name</label><input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.sender_name} onChange={(e) => setEditFormData({...editFormData, sender_name: e.target.value})} /></div>
              <div><label className="text-xs text-slate-400">Receiver Name</label><input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.receiver_name} onChange={(e) => setEditFormData({...editFormData, receiver_name: e.target.value})} required /></div>
              <div><label className="text-xs text-slate-400">Destination</label><input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.destination} onChange={(e) => setEditFormData({...editFormData, destination: e.target.value})} /></div>
              <div><label className="text-xs text-slate-400">Weight (kg)</label><input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.weight} onChange={(e) => setEditFormData({...editFormData, weight: e.target.value})} /></div>
              <div className="col-span-2 border-t border-slate-800 pt-3 mt-1 text-blue-400 font-bold">Forwarding & Route Vendor Details</div>
              <div><label className="text-xs text-slate-400">Forward Vendor Partner</label><select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.forward_vendor} onChange={(e) => setEditFormData({...editFormData, forward_vendor: e.target.value})}><option value="">Select Vendor</option><option value="DHL">DHL Forwarding</option><option value="FedEx">FedEx Express</option><option value="UPS">UPS Cargo</option><option value="Skynet">Skynet Network</option></select></div>
              <div><label className="text-xs text-slate-400">Forwarding Tracking Number (AWB)</label><input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" placeholder="e.g. DHL-9832141" value={editFormData.forwarding_awb} onChange={(e) => setEditFormData({...editFormData, forwarding_awb: e.target.value})} /></div>
              <div className="col-span-2 border-t border-slate-800 pt-3 mt-1 text-emerald-400 font-bold">Ledger Accounts & Profit Tracking</div>
              <div><label className="text-xs text-slate-400">Remote Status</label><select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.remote_status} onChange={(e) => setEditFormData({...editFormData, remote_status: e.target.value})}><option value="Non-Remote">Non-Remote</option><option value="Remote">Remote Area</option></select></div>
              <div><label className="text-xs text-slate-400">Remote Charges</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.remote_charges} onChange={(e) => setEditFormData({...editFormData, remote_charges: e.target.value})} /></div>
              <div><label className="text-xs text-slate-400">Debit Amount</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.debit} onChange={(e) => setEditFormData({...editFormData, debit: e.target.value})} /></div>
              <div><label className="text-xs text-slate-400">Petrol Surcharge</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.petrol} onChange={(e) => setEditFormData({...editFormData, petrol: e.target.value})} /></div>
              <div><label className="text-xs text-amber-500 font-bold">💸 Nexora Buying Cost</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-amber-600 text-white font-mono" value={editFormData.buying_rate} onChange={(e) => setEditFormData({...editFormData, buying_rate: e.target.value})} /></div>
              <div><label className="text-xs text-green-400 font-bold">Credit Amount</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-green-600 text-white font-mono" value={editFormData.credit} onChange={(e) => setEditFormData({...editFormData, credit: e.target.value})} /></div>
              <div className="col-span-2 border border-rose-500/30 bg-rose-900/10 rounded-lg p-3">
                <label className="text-xs text-rose-400 font-bold block mb-1">🔴 Vendor Ko Diye Gaye (Vendor Paid)</label>
                <input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-rose-500 text-white font-mono text-lg" placeholder="0" value={editFormData.vendor_paid} onChange={(e) => setEditFormData({...editFormData, vendor_paid: e.target.value})} />
                <p className="text-xs text-slate-500 mt-1">Vendor Baaki: Rs {Math.max(0, Number(editFormData.buying_rate || 0) - Number(editFormData.vendor_paid || 0)).toLocaleString()}</p>
              </div>
              <div className="col-span-2"><label className="text-xs text-slate-400">Service Label</label><select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.service} onChange={(e) => setEditFormData({...editFormData, service: e.target.value})} required><option value="DHL">DHL</option><option value="FedEx">FedEx</option><option value="UPS">UPS</option><option value="Skynet">Skynet</option><option value="Aramex">Aramex</option><option value="TCS">TCS</option><option value="Other">Other</option></select></div>
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
