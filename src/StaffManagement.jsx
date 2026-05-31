// src/StaffManagement.jsx
import React from 'react';
import { supabase } from './supabaseClient';

export default function StaffManagement({ staffList, fetchStaff }) {
  return (
    <div className="max-w-4xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Staff Management</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        await supabase.from('staff_members').insert([{ full_name: e.target.name.value, email: e.target.email.value }]);
        fetchStaff();
        e.target.reset();
      }} className="grid grid-cols-2 gap-4 mb-8">
        <input name="name" className="bg-slate-800 p-2 rounded border border-slate-700 text-white" placeholder="Full Name" required />
        <input name="email" className="bg-slate-800 p-2 rounded border border-slate-700 text-white" placeholder="Email" required />
        <button type="submit" className="col-span-2 bg-blue-600 py-2 rounded font-bold">Add Staff</button>
      </form>
      <div className="space-y-2">
        {staffList.map(s => (
          <div key={s.id} className="bg-slate-800 p-4 rounded flex justify-between items-center border border-slate-700">
            <span className="font-bold text-white">{s.full_name}</span>
            <span className="text-slate-400 text-sm">{s.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
}