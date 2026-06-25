import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App({ isAdmin = true, currentUserId = null }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [returnTab, setReturnTab] = useState('new_shipment');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    sender_name: '', sender_address: '', sender_phone: '', sender_email: '',
    receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '',
    destination: '', weight: '', service: '',
    shipment_date: new Date().toISOString().split('T')[0]
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
    buying_rate: 0, forwarding_awb: '', forward_vendor: ''
  });

  const [staffList, setStaffList] = useState([]);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffMsg, setStaffMsg] = useState('');

  const [trackingAwb, setTrackingAwb] = useState('');
  const [trackingUpdates, setTrackingUpdates] = useState([]);
  const [selectedAwbShipment, setSelectedAwbShipment] = useState(null);
  const [newUpdate, setNewUpdate] = useState({
    location: '', status: 'Picked Up', description: '', custom_time: ''
  });
  const [trackingMsg, setTrackingMsg] = useState('');

  const fetchLedger = async () => {
    const { data } = await supabase.from('customer_ledgers').select('*').not('status', 'eq', 'pending').order('id', { ascending: false });
    if (data) setLedgerData(data);
  };

  const fetchPending = async () => {
    const { data } = await supabase.from('customer_ledgers').select('*').eq('status', 'pending').order('id', { ascending: false });
    if (data) setPendingData(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('id', { ascending: false });
    if (data) setProfilesData(data);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('user_roles').select('*').eq('role', 'staff');
    if (data) setStaffList(data);
  };

  useEffect(() => {
    fetchLedger();
    fetchPending();
    fetchProfiles();
    if (isAdmin) fetchStaff();
  }, [isAdmin]);

  const handleAddStaffByUUID = async (uuid) => {
    const { error } = await supabase.from('user_roles').insert([{
      user_id: uuid,
      role: 'staff',
      added_by: currentUserId
    }]);
    if (!error) {
      setStaffMsg('✅ Staff member add ho gaya!');
      setStaffEmail('');
      fetchStaff();
    } else {
      setStaffMsg('❌ Error: ' + error.message);
    }
  };

  const handleRemoveStaff = async (userId) => {
    if (window.confirm('Is staff member ko remove karna chahte ho?')) {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'staff');
      fetchStaff();
      setStaffMsg('✅ Staff member remove ho gaya!');
    }
  };

  const trackingStatuses = [
    { value: 'Shipment Booked', label: '📋 Shipment Booked', color: 'bg-blue-900/40 text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
    { value: 'Picked Up', label: '🛵 Picked Up', color: 'bg-cyan-900/40 text-cyan-400 border-cyan-500/30', dot: 'bg-cyan-500' },
    { value: 'Arrived at Origin Hub', label: '🏭 Arrived at Origin Hub', color: 'bg-indigo-900/40 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-500' },
    { value: 'Departed Origin', label: '✈️ Departed Origin', color: 'bg-violet-900/40 text-violet-400 border-violet-500/30', dot: 'bg-violet-500' },
    { value: 'In Transit', label: '🚚 In Transit', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500' },
    { value: 'Arrived at Transit Hub', label: '🔄 Arrived at Transit Hub', color: 'bg-orange-900/40 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
    { value: 'Departed Transit Hub', label: '🛫 Departed Transit Hub', color: 'bg-pink-900/40 text-pink-400 border-pink-500/30', dot: 'bg-pink-500' },
    { value: 'Arrived at Destination', label: '🛬 Arrived at Destination', color: 'bg-teal-900/40 text-teal-400 border-teal-500/30', dot: 'bg-teal-500' },
    { value: 'Customs Clearance', label: '🛃 Customs Clearance', color: 'bg-purple-900/40 text-purple-400 border-purple-500/30', dot: 'bg-purple-500' },
    { value: 'Customs Released', label: '✅ Customs Released', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    { value: 'Out for Delivery', label: '🏃 Out for Delivery', color: 'bg-lime-900/40 text-lime-400 border-lime-500/30', dot: 'bg-lime-500' },
    { value: 'Delivery Attempted', label: '🔔 Delivery Attempted', color: 'bg-amber-900/40 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
    { value: 'Delivered', label: '📬 Delivered', color: 'bg-green-900/40 text-green-400 border-green-500/30', dot: 'bg-green-500' },
    { value: 'Delayed', label: '⚠️ Delayed', color: 'bg-red-900/40 text-red-400 border-red-500/30', dot: 'bg-red-500' },
    { value: 'On Hold', label: '⏸️ On Hold', color: 'bg-slate-700/60 text-slate-300 border-slate-500/30', dot: 'bg-slate-400' },
    { value: 'Exception', label: '🚨 Exception / Issue', color: 'bg-red-900/60 text-red-300 border-red-400/40', dot: 'bg-red-600' },
  ];

  const getStatusStyle = (statusValue) => trackingStatuses.find(s => s.value === statusValue) || { color: 'bg-slate-800 text-slate-400 border-slate-600', dot: 'bg-slate-500' };

  const handleSearchTracking = async (e) => {
    e.preventDefault();
    const shipment = ledgerData.find(s => s.nexora_airwaybill?.toLowerCase() === trackingAwb.toLowerCase());
    if (!shipment) { setTrackingMsg('❌ Koi shipment nahi mila is AWB se'); setSelectedAwbShipment(null); setTrackingUpdates([]); return; }
    setSelectedAwbShipment(shipment);
    setTrackingMsg('');
    const { data } = await supabase.from('tracking_updates').select('*').eq('awb', shipment.nexora_airwaybill).order('date', { ascending: false });
    if (data) setTrackingUpdates(data);
  };

  const handleAddTrackingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAwbShipment) return;
    const insertTime = newUpdate.custom_time ? new Date(newUpdate.custom_time).toISOString() : new Date().toISOString();
    const { error } = await supabase.from('tracking_updates').insert([{
      awb: selectedAwbShipment.nexora_airwaybill,
      location: newUpdate.location, status: newUpdate.status,
      description: newUpdate.description, date: insertTime
    }]);
    if (!error) {
      setTrackingMsg('✅ Tracking update add ho gaya!');
      setNewUpdate({ location: '', status: 'Picked Up', description: '', custom_time: '' });
      const { data } = await supabase.from('tracking_updates').select('*').eq('awb', selectedAwbShipment.nexora_airwaybill).order('date', { ascending: false });
      if (data) setTrackingUpdates(data);
    } else { setTrackingMsg('❌ Error: ' + error.message); }
  };

  const handleDeleteTrackingUpdate = async (id) => {
    await supabase.from('tracking_updates').delete().eq('id', id);
    const { data } = await supabase.from('tracking_updates').select('*').eq('awb', selectedAwbShipment.nexora_airwaybill).order('date', { ascending: false });
    if (data) setTrackingUpdates(data);
  };

  const getDashboardMetrics = () => {
    const totalShipments = ledgerData.length;
    const totalRevenue = ledgerData.reduce((sum, item) => sum + Number(item.debit || 0) + Number(item.petrol || 0) + Number(item.remote_charges || 0), 0);
    const totalCost = ledgerData.reduce((sum, item) => sum + Number(item.buying_rate || 0), 0);
    const totalNetProfit = totalRevenue - totalCost;
    const totalWeight = ledgerData.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const totalOutstanding = ledgerData.reduce((sum, item) => sum + Number(item.debit || 0) + Number(item.petrol || 0) + Number(item.remote_charges || 0) - Number(item.credit || 0), 0);
    return { totalShipments, totalRevenue, totalNetProfit, totalWeight, totalOutstanding };
  };

  const handleApprovePending = (item) => {
    setEditId(item.id);
    setEditFormData({
      sender_name: item.sender_name || '', sender_address: item.sender_address || '',
      sender_phone: item.sender_phone || '', sender_email: item.sender_email || '',
      receiver_name: item.receiver || '', receiver_address: item.receiver_address || '',
      receiver_phone: item.receiver_phone || '', receiver_email: item.receiver_email || '',
      destination: item.destination || '', weight: item.weight || '', service: item.service || '',
      remote_status: 'Non-Remote', debit: 0, credit: 0, petrol: 0, remote_charges: 0,
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
    profilesData.forEach(profile => {
      if (profile.full_name) {
        const nameKey = profile.full_name.trim();
        customersMap[nameKey] = { name: nameKey, phone: profile.phone || 'N/A', email: profile.email || 'N/A', totalShipments: 0, profileId: profile.id, hasProfile: true };
      }
    });
    ledgerData.forEach(item => {
      if (item.sender_name) {
        const nameKey = item.sender_name.trim();
        if (!customersMap[nameKey]) {
          customersMap[nameKey] = { name: nameKey, phone: item.sender_phone || 'N/A', email: item.sender_email || 'N/A', totalShipments: 0, hasProfile: false };
        }
        customersMap[nameKey].totalShipments += 1;
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
    const { error } = await supabase.from('customer_ledgers').insert([{
      nexora_airwaybill: nexoraTracking, receiver: formData.receiver_name, destination: formData.destination,
      weight: formData.weight, service: formData.service, sender_name: formData.sender_name,
      date: formData.shipment_date,
      sender_address: formData.sender_address, sender_phone: formData.sender_phone, sender_email: formData.sender_email,
      receiver_address: formData.receiver_address, receiver_phone: formData.receiver_phone, receiver_email: formData.receiver_email,
      remote_status: 'Non-Remote', debit: 0, credit: 0, petrol: 0, remote_charges: 0,
      buying_rate: 0, forwarding_awb: '', forward_vendor: '', status: 'approved'
    }]);
    if (!error) {
      setReturnTab('new_shipment');
      setLabelData({ ...formData, nexoraTracking });
      fetchLedger();
      setFormData({ sender_name: '', sender_address: '', sender_phone: '', sender_email: '', receiver_name: '', receiver_address: '', receiver_phone: '', receiver_email: '', destination: '', weight: '', service: '', shipment_date: new Date().toISOString().split('T')[0] });
    } else { alert("Error: " + error.message); }
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
    const { error } = await supabase.from('customer_ledgers').update({
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
    }).eq('id', editId);
    if (!error) { setIsModalOpen(false); fetchLedger(); fetchPending(); }
    else { alert("Update failed: " + error.message); }
  };

  const getCalculatedLedger = (customerName) => {
    let filtered = ledgerData.filter(item => item.sender_name && item.sender_name.trim() === customerName);
    if (searchTerm) filtered = filtered.filter(item => (item.nexora_airwaybill && item.nexora_airwaybill.toLowerCase().includes(searchTerm.toLowerCase())) || (item.receiver && item.receiver.toLowerCase().includes(searchTerm.toLowerCase())) || (item.forwarding_awb && item.forwarding_awb.toLowerCase().includes(searchTerm.toLowerCase())));
    if (startDate) filtered = filtered.filter(item => item.date && new Date(item.date) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(item => item.date && new Date(item.date) <= new Date(endDate + 'T23:59:59'));
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
            <p className="text-xs text-slate-400 mt-1">{isAdmin ? 'Admin Control' : 'Staff Portal'}</p>
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
            <button type="button" onClick={() => { setActiveTab('registered'); setLabelData(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'registered' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>🆕</span> Registered Users
              {profilesData.length > 0 && <span className="ml-auto bg-blue-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{profilesData.length}</span>}
            </button>
            {isAdmin && (
              <button type="button" onClick={() => { setActiveTab('staff'); setLabelData(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'staff' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <span>🔧</span> Staff Management
                {staffList.length > 0 && <span className="ml-auto bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{staffList.length}</span>}
              </button>
            )}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          {isAdmin ? '👑 Admin Mode' : '🔧 Staff Mode'} • v3.0
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 pl-64 p-8">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">📊 {isAdmin ? 'Admin' : 'Staff'} Dashboard</h2>
            <p className="text-slate-400 mb-6">Nexora Courier & Logistics — Overview</p>
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-900 border border-blue-500/20 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Total Shipments</p><p className="text-3xl font-black text-blue-400 mt-2">{metrics.totalShipments}</p><p className="text-xs text-slate-500 mt-1">All time</p></div>
              <div className="bg-slate-900 border border-yellow-500/20 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Total Revenue</p><p className="text-2xl font-black text-yellow-400 mt-2">Rs {metrics.totalRevenue.toLocaleString()}</p><p className="text-xs text-slate-500 mt-1">Gross billing</p></div>
              <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Net Profit</p><p className="text-2xl font-black text-emerald-400 mt-2">Rs {metrics.totalNetProfit.toLocaleString()}</p><p className="text-xs text-slate-500 mt-1">After buying cost</p></div>
              <div className="bg-slate-900 border border-purple-500/20 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Total Weight</p><p className="text-2xl font-black text-purple-400 mt-2">{Number(metrics.totalWeight).toFixed(1)} KG</p><p className="text-xs text-slate-500 mt-1">All shipments</p></div>
              <div className="bg-slate-900 border border-red-500/20 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Outstanding</p><p className="text-2xl font-black text-red-400 mt-2">Rs {metrics.totalOutstanding.toLocaleString()}</p><p className="text-xs text-slate-500 mt-1">Unpaid balance</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Pending Requests</p><p className="text-3xl font-black text-orange-400 mt-2">{pendingData.length}</p><p className="text-xs text-slate-500 mt-1">Awaiting approval</p></div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Registered Users</p><p className="text-3xl font-black text-blue-400 mt-2">{profilesData.length}</p><p className="text-xs text-slate-500 mt-1">Total signups</p></div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl"><p className="text-xs text-slate-400 font-medium">Active Customers</p><p className="text-3xl font-black text-green-400 mt-2">{getUniqueCustomers().length}</p><p className="text-xs text-slate-500 mt-1">With shipments</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-slate-300 mb-4">🕐 Recent Shipments</h3>
              <table className="w-full text-sm text-left">
                <thead><tr className="text-slate-400 border-b border-slate-700 text-xs uppercase"><th className="pb-3 px-2">AWB</th><th className="pb-3 px-2">Sender</th><th className="pb-3 px-2">Receiver</th><th className="pb-3 px-2">Destination</th><th className="pb-3 px-2">Service</th><th className="pb-3 px-2 text-right">Amount</th></tr></thead>
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

        {/* STAFF MANAGEMENT */}
        {activeTab === 'staff' && isAdmin && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">🔧 Staff Management</h2>
            <p className="text-slate-400 mb-6">Apne staff members ko manage karo — sirf tum yeh dekh sakte ho</p>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-emerald-400 mb-4">Staff Member Add Karo</h3>
              <p className="text-slate-400 text-xs mb-4">Staff member ko pehle website pe signup karna hoga — phir unka Supabase UUID yahan daalo!</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Staff Member ka Supabase UUID</label>
                  <input
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 0cb78d45-25e3-4507-8883-0ee7428c1f3a"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  UUID kahan milega: Supabase Dashboard → Authentication → Users → us user pe click karo → UID copy karo
                </p>

                {staffMsg && (
                  <div className={`text-xs p-3 rounded-lg ${staffMsg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' : staffMsg.startsWith('⚠️') ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
                    {staffMsg}
                  </div>
                )}

                <button type="button"
                  onClick={() => {
                    if (!staffEmail.trim()) { setStaffMsg('❌ UUID daalo pehle!'); return; }
                    if (window.confirm('Is UUID wale user ko staff banana chahte ho?')) {
                      handleAddStaffByUUID(staffEmail.trim());
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all">
                  ➕ Add as Staff Member
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="font-bold text-slate-300 mb-4">Current Staff Members ({staffList.length})</h3>
              {staffList.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">Abhi koi staff member nahi hai</p>
              ) : (
                <div className="space-y-3">
                  {staffList.map((staff, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">User ID</p>
                        <p className="font-mono text-sm text-blue-400">{staff.user_id}</p>
                        <p className="text-xs text-emerald-400 mt-1 font-bold">🔧 Staff</p>
                      </div>
                      <button type="button"
                        onClick={() => handleRemoveStaff(staff.user_id)}
                        className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-all">
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRACKING CONTROL */}
        {activeTab === 'tracking_control' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-2">🗺️ Tracking Control Panel</h2>
            <p className="text-slate-400 mb-6">Kisi bhi shipment ki location aur status manually update karo</p>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-slate-300 mb-4">Step 1: AWB Search Karo</h3>
              <form onSubmit={handleSearchTracking} className="flex gap-3">
                <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="Nexora AWB daalo e.g. NX-123456789" value={trackingAwb} onChange={(e) => setTrackingAwb(e.target.value)} required />
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-lg transition-all">🔍 Search</button>
              </form>
              {trackingMsg && !trackingMsg.startsWith('✅') && <p className="text-red-400 text-sm mt-3">{trackingMsg}</p>}
            </div>
            {selectedAwbShipment && (
              <>
                <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-slate-400">AWB</p><p className="font-mono font-bold text-purple-400">{selectedAwbShipment.nexora_airwaybill}</p></div>
                    <div><p className="text-xs text-slate-400">Sender</p><p className="font-bold text-white">{selectedAwbShipment.sender_name}</p></div>
                    <div><p className="text-xs text-slate-400">Receiver</p><p className="font-bold text-white">{selectedAwbShipment.receiver}</p></div>
                    <div><p className="text-xs text-slate-400">Destination</p><p className="font-bold text-blue-400">{selectedAwbShipment.destination}</p></div>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-slate-300 mb-4">Step 2: Naya Tracking Update Add Karo</h3>
                  <form onSubmit={handleAddTrackingUpdate} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Status *</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500" value={newUpdate.status} onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value})}>
                        {trackingStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location *</label>
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="e.g. Paris, France" value={newUpdate.location} onChange={(e) => setNewUpdate({...newUpdate, location: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Description / Note</label>
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500" placeholder="e.g. Package departed from airport" value={newUpdate.description} onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Date & Time (optional)</label>
                      <input type="datetime-local" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500" value={newUpdate.custom_time} onChange={(e) => setNewUpdate({...newUpdate, custom_time: e.target.value})} />
                    </div>
                    {trackingMsg && <div className={`col-span-2 text-xs p-3 rounded-lg ${trackingMsg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>{trackingMsg}</div>}
                    <div className="col-span-2"><button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all">➕ Add Tracking Update</button></div>
                  </form>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                  <h3 className="font-bold text-slate-300 mb-5">📍 Live Tracking Timeline <span className="ml-2 text-xs bg-purple-900/50 text-purple-400 border border-purple-700 px-2 py-0.5 rounded-full font-normal">{trackingUpdates.length} updates</span></h3>
                  {trackingUpdates.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">Abhi koi tracking update nahi hai</p> : (
                    <div className="relative">
                      <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-slate-700 rounded-full"></div>
                      <div className="space-y-1">
                        {trackingUpdates.map((update, idx) => {
                          const style = getStatusStyle(update.status);
                          const isLatest = idx === 0;
                          return (
                            <div key={update.id} className={`flex gap-4 relative pl-10 pb-5 ${isLatest ? '' : 'opacity-75'}`}>
                              <div className={`absolute left-[11px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${style.dot} ${isLatest ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-purple-400' : ''}`}></div>
                              <div className={`flex-1 rounded-xl p-4 border ${isLatest ? 'bg-slate-800/60 border-slate-600' : 'bg-slate-800/20 border-slate-700/50'}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <span className={`inline-block text-xs px-2 py-0.5 rounded border font-bold mb-2 ${style.color}`}>{update.status}</span>
                                    {isLatest && <span className="ml-2 text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">LATEST</span>}
                                    <p className="font-bold text-white text-sm">📍 {update.location}</p>
                                    {update.description && <p className="text-slate-400 text-xs mt-1">{update.description}</p>}
                                    <p className="text-slate-500 text-xs mt-1.5">🕐 {new Date(update.date).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <button type="button" onClick={() => handleDeleteTrackingUpdate(update.id)} className="text-red-500/50 hover:text-red-400 text-xs font-bold px-2 py-1 rounded hover:bg-red-900/20 transition-all flex-shrink-0">🗑️</button>
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
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-16 text-center"><p className="text-4xl mb-4">✅</p><p className="text-slate-400 font-medium">Koi pending request nahi hai</p></div>
            ) : (
              <div className="space-y-4">
                {pendingData.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/60 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-4 gap-6 flex-1">
                        <div><p className="text-xs text-slate-400 mb-1">Customer</p><p className="font-bold text-white">{item.sender_name}</p><p className="text-xs text-slate-400">{item.sender_email}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Receiver</p><p className="font-bold text-white">{item.receiver}</p><p className="text-xs text-slate-400">{item.receiver_phone}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Destination</p><p className="font-bold text-blue-400">{item.destination}</p><p className="text-xs text-slate-400">{item.weight} KG • {item.service}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">AWB</p><p className="font-mono text-xs text-slate-300">{item.nexora_airwaybill}</p><p className="text-xs text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</p></div>
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
                <thead><tr className="text-slate-400 border-b border-slate-700 text-xs uppercase"><th className="pb-3 px-2">Name</th><th className="pb-3 px-2">Email</th><th className="pb-3 px-2">Phone</th><th className="pb-3 px-2">Joined</th><th className="pb-3 px-2 text-center">WhatsApp</th></tr></thead>
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
                          <button type="button" onClick={() => window.open(`https://wa.me/92${profile.phone.replace(/^0/, '').replace(/\D/g, '')}`, '_blank')} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold transition-all">💬 WhatsApp</button>
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
                  <div className="relative">
                    <input 
                      className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white w-full" 
                      placeholder="Sender Name (existing customer select karo ya naya likho)" 
                      list="customer-suggestions"
                      value={formData.sender_name} 
                      onChange={(e) => {
                        const typedName = e.target.value;
                        setFormData({...formData, sender_name: typedName});
                        const matchedCustomer = getUniqueCustomers().find(c => c.name.toLowerCase() === typedName.toLowerCase());
                        if (matchedCustomer) {
                          const fullDetails = ledgerData.find(item => item.sender_name?.trim().toLowerCase() === typedName.toLowerCase());
                          setFormData(prev => ({
                            ...prev,
                            sender_name: typedName,
                            sender_phone: matchedCustomer.phone !== 'N/A' ? matchedCustomer.phone : (fullDetails?.sender_phone || ''),
                            sender_email: matchedCustomer.email !== 'N/A' ? matchedCustomer.email : (fullDetails?.sender_email || ''),
                            sender_address: fullDetails?.sender_address || ''
                          }));
                        }
                      }} 
                      required 
                    />
                    <datalist id="customer-suggestions">
                      {getUniqueCustomers().map((cust, idx) => (
                        <option key={idx} value={cust.name} />
                      ))}
                    </datalist>
                  </div>
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Name" value={formData.receiver_name} onChange={(e) => setFormData({...formData, receiver_name: e.target.value})} required />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Address" value={formData.sender_address} onChange={(e) => setFormData({...formData, sender_address: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Address" value={formData.receiver_address} onChange={(e) => setFormData({...formData, receiver_address: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Phone" value={formData.sender_phone} onChange={(e) => setFormData({...formData, sender_phone: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Phone Number" value={formData.receiver_phone} onChange={(e) => setFormData({...formData, receiver_phone: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Sender Email" value={formData.sender_email} onChange={(e) => setFormData({...formData, sender_email: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Receiver Email" value={formData.receiver_email} onChange={(e) => setFormData({...formData, receiver_email: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Destination" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                  <input className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white" placeholder="Weight (kg)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Shipment Date (default: aaj, change kar sakte ho purani date ke liye)</label>
                    <input type="date" className="bg-slate-800 p-2.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white w-full" value={formData.shipment_date} onChange={(e) => setFormData({...formData, shipment_date: e.target.value})} />
                  </div>
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
                <thead><tr className="text-slate-400 border-b border-slate-700 text-sm"><th className="pb-3 px-2">AWB / Tracking</th><th className="pb-3 px-2">Sender</th><th className="pb-3 px-2">Receiver</th><th className="pb-3 px-2">Destination</th><th className="pb-3 px-2">Service</th><th className="pb-3 px-2 text-center">Action</th></tr></thead>
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
                  <thead><tr className="text-slate-400 border-b border-slate-700 text-sm"><th className="pb-3 px-2">Customer Name</th><th className="pb-3 px-2">Phone</th><th className="pb-3 px-2">Email</th><th className="pb-3 px-2">Total Parcels</th><th className="pb-3 px-2 text-center">Action</th></tr></thead>
                  <tbody className="text-sm">
                    {getUniqueCustomers().map((cust, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-2 font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => setSelectedCustomer(cust.name)}>👤 {cust.name}</td>
                        <td className="py-3.5 px-2 text-slate-300">{cust.phone}</td>
                        <td className="py-3.5 px-2 text-slate-300">{cust.email}</td>
                        <td className="py-3.5 px-2 font-mono"><span className="bg-slate-800 px-2 py-0.5 rounded text-green-400 font-bold">{cust.totalShipments}</span></td>
                        <td className="py-3.5 px-2 text-center flex gap-2 justify-center">
                          <button type="button" onClick={() => setSelectedCustomer(cust.name)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all">View Ledger</button>
                          {isAdmin && (
                            <button type="button" onClick={async () => {
                              if(window.confirm(`"${cust.name}" ko directory se hatana chahte ho? Shipment data safe rahega.`)) {
                                if (cust.hasProfile) { await supabase.from('profiles').delete().eq('id', cust.profileId); fetchProfiles(); }
                                else { alert('Yeh customer sirf ledger mein hai — delete nahi ho sakta.'); }
                              }
                            }} className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-md text-xs font-semibold hover:bg-red-600 hover:text-white transition-all">🗑️ Del</button>
                          )}
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
                    <div><span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Premium Ledger Panel</span><h2 className="text-2xl font-black text-white mt-1">{selectedCustomer}</h2></div>
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
                            <td className="py-3 px-2 text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
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
              <div><label className="text-xs text-slate-400">Forwarding Tracking Number</label><input className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" placeholder="e.g. DHL-9832141" value={editFormData.forwarding_awb} onChange={(e) => setEditFormData({...editFormData, forwarding_awb: e.target.value})} /></div>
              <div className="col-span-2 border-t border-slate-800 pt-3 mt-1 text-emerald-400 font-bold">Ledger Accounts & Profit Tracking</div>
              <div><label className="text-xs text-slate-400">Remote Status</label><select className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white" value={editFormData.remote_status} onChange={(e) => setEditFormData({...editFormData, remote_status: e.target.value})}><option value="Non-Remote">Non-Remote</option><option value="Remote">Remote Area</option></select></div>
              <div><label className="text-xs text-slate-400">Remote Charges</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.remote_charges} onChange={(e) => setEditFormData({...editFormData, remote_charges: e.target.value})} /></div>
              <div><label className="text-xs text-slate-400">Debit Amount</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.debit} onChange={(e) => setEditFormData({...editFormData, debit: e.target.value})} /></div>
              <div><label className="text-xs text-slate-400">Petrol Surcharge</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-slate-700 text-white font-mono" value={editFormData.petrol} onChange={(e) => setEditFormData({...editFormData, petrol: e.target.value})} /></div>
              <div><label className="text-xs text-amber-500 font-bold">💸 Nexora Buying Cost</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-amber-600 text-white font-mono" value={editFormData.buying_rate} onChange={(e) => setEditFormData({...editFormData, buying_rate: e.target.value})} /></div>
              <div><label className="text-xs text-green-400 font-bold">Credit Amount</label><input type="number" className="w-full bg-slate-800 p-2 mt-1 rounded border border-green-600 text-white font-mono" value={editFormData.credit} onChange={(e) => setEditFormData({...editFormData, credit: e.target.value})} /></div>
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