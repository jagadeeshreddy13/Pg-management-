import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment, Tenant, Room, Reminder } from '../types';
import { 
  FileText, 
  Download, 
  Table as TableIcon, 
  TrendingUp, 
  Users, 
  Bed,
  BarChart3,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'payments'), orderBy('dueDate', 'desc')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    }
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'tenants'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
    }
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'reminders'), orderBy('sentTime', 'desc')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
    }
  });

  const exportReminderReport = () => {
    const data = reminders.map(r => ({
      TenantId: r.tenantId,
      'Contact Info': r.whatsappNumber || r.mobileNumber,
      Method: r.method,
      Message: r.message,
      'Sent Time': r.sentTime,
      Status: r.status
    }));
    exportToExcel(data, 'Reminder_Log');
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'ddMMyy')}.xlsx`);
  };

  const exportTenantReport = () => {
    const data = tenants.map(t => ({
      Name: t.fullName,
      Mobile: t.mobile,
      Room: t.roomNumber,
      Bed: t.bedNumber,
      'Joining Date': t.joiningDate,
      Rent: t.monthlyRent,
      Status: t.status
    }));
    exportToExcel(data, 'Tenant_Report');
  };

  const exportPaymentReport = () => {
    const data = payments.map(p => ({
      Tenant: p.tenantName,
      'Due Date': p.dueDate,
      Amount: p.rentAmount,
      Paid: p.paidAmount,
      Balance: p.balance,
      Status: p.status,
      'Payment Date': p.paymentDate || 'N/A'
    }));
    exportToExcel(data, 'Payment_Report');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h2>
        <p className="text-slate-500 text-sm">Export data and view hostel performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tenant Report Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow group">
          <div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tenant Report</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Full list of active and vacated residents with contact details.</p>
          </div>
          <div className="mt-6">
            <button 
              onClick={exportTenantReport}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
            >
              <TableIcon className="h-3.5 w-3.5 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Payment Report Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow group">
          <div>
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Payment History</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Detailed log of all rent payments, balances, and collection status.</p>
          </div>
          <div className="mt-6">
            <button 
              onClick={exportPaymentReport}
              className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <TableIcon className="h-3.5 w-3.5 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Occupancy Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow group">
          <div>
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bed className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Occupancy Report</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Room-wise bed allocation and availability statistics.</p>
          </div>
          <div className="mt-6">
            <button 
              className="w-full bg-amber-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Reminder Logs Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow group">
          <div>
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reminder Logs</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Track all WhatsApp and SMS reminders sent to tenants.</p>
          </div>
          <div className="mt-6">
            <button 
              onClick={exportReminderReport}
              className="w-full bg-rose-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center hover:bg-rose-700 transition-colors shadow-sm"
            >
              <TableIcon className="h-3.5 w-3.5 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BarChart3 className="h-32 w-32" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center tracking-tight">
          <BarChart3 className="h-5 w-5 mr-3 text-blue-600" />
          Financial Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue to Date</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">₹{payments.reduce((acc, p) => acc + p.paidAmount, 0).toLocaleString()}</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[70%] transition-all duration-1000" />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Receivables</p>
            <p className="text-3xl font-bold text-red-600 tracking-tighter">₹{payments.reduce((acc, p) => acc + p.balance, 0).toLocaleString()}</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[30%] transition-all duration-1000" />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tenants</p>
            <p className="text-3xl font-bold text-blue-600 tracking-tighter">{tenants.filter(t => t.status === 'active').length}</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[85%] transition-all duration-1000" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
