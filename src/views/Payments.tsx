import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment, Tenant, PaymentStatus, Settings } from '../types';
import { 
  IndianRupee, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Download,
  Plus,
  X,
  MessageSquare,
  ChevronRight,
  Phone
} from 'lucide-react';
import { format, addDays, isAfter, subDays } from 'date-fns';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'payments'), orderBy('dueDate', 'desc')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    }
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'tenants'), where('status', '==', 'active')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (paymentData: Partial<Payment>) => {
      if (selectedPayment) {
        const balance = paymentData.rentAmount! - paymentData.paidAmount!;
        const status: PaymentStatus = balance <= 0 ? 'Paid' : (paymentData.paidAmount! > 0 ? 'Partial' : 'Due');
        
        await updateDoc(doc(db, 'payments', selectedPayment.id), {
          ...paymentData,
          balance,
          status,
          paymentDate: new Date().toISOString()
        });

        // If fully paid, optionally generate next due record
        if (status === 'Paid') {
          const nextDueDate = addDays(new Date(paymentData.dueDate!), 30).toISOString();
          // Check if already exists to avoid duplicates
          const existing = payments.find(p => p.tenantId === paymentData.tenantId && p.dueDate === nextDueDate);
          if (!existing) {
            await addDoc(collection(db, 'payments'), {
              tenantId: paymentData.tenantId,
              tenantName: paymentData.tenantName,
              dueDate: nextDueDate,
              rentAmount: paymentData.rentAmount,
              paidAmount: 0,
              balance: paymentData.rentAmount,
              status: 'Due'
            });
          }
        }
      } else {
        // Manual addition
        await addDoc(collection(db, 'payments'), {
          ...paymentData,
          balance: paymentData.rentAmount! - paymentData.paidAmount!,
          status: paymentData.paidAmount! >= paymentData.rentAmount! ? 'Paid' : 'Due'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsModalOpen(false);
      setSelectedPayment(null);
      toast.success('Payment updated');
    }
  });

  const generateReceipt = (payment: Payment) => {
    const doc = new jsPDF() as any;
    const hostelName = settings?.hostelName || 'PG HOSTEL';
    const address = settings?.address || '';
    const contact = settings?.contactNumber || '';
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(hostelName.toUpperCase(), 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (address) doc.text(address, 105, 27, { align: 'center' });
    if (contact) doc.text(`Contact: ${contact}`, 105, 32, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('PAYMENT RECEIPT', 105, 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Receipt ID: ${payment.id.substring(0, 8).toUpperCase()}`, 20, 55);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 190, 55, { align: 'right' });

    // Divider
    doc.setDrawColor(241, 245, 249); // Slate-100
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);
    
    // Tenant Info
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text('RECEIVED FROM:', 20, 70);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.text(payment.tenantName, 20, 78);
    doc.setFont('helvetica', 'normal');
    
    const tenant = tenants.find(t => t.id === payment.tenantId);
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (tenant) {
      doc.text(`Mobile: ${tenant.mobile}`, 20, 85);
      doc.text(`Room: ${tenant.roomNumber} - Bed: ${tenant.bedNumber}`, 20, 91);
    }

    // Payment Table
    doc.autoTable({
      startY: 100,
      head: [['DESCRIPTION', 'AMOUNT']],
      body: [
        ['Monthly Rent', `INR ${payment.rentAmount.toLocaleString()}`],
        ['Paid Amount', `INR ${payment.paidAmount.toLocaleString()}`],
        ['Current Balance', `INR ${payment.balance.toLocaleString()}`],
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 41, 59], // Slate-800
        fontSize: 10,
        halign: 'center'
      },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 6
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;
    
    // Total Summary
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(130, finalY + 5, 60, 15, 'F');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PAID: ₹${payment.paidAmount.toLocaleString()}`, 185, finalY + 15, { align: 'right' });
    
    // Payment Details
    if (payment.paymentMode) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Mode: ${payment.paymentMode}`, 20, finalY + 15);
      if (payment.transactionRef) {
        doc.text(`Reference: ${payment.transactionRef}`, 20, finalY + 22);
      }
    }

    // Signature Placeholder
    doc.setDrawColor(200);
    doc.line(140, finalY + 50, 190, finalY + 50);
    doc.setFontSize(9);
    doc.text('Authorized Signature', 165, finalY + 55, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for your stay!', 105, 275, { align: 'center' });
    doc.text('This is a computer generated receipt and does not require a physical signature.', 105, 280, { align: 'center' });
    
    doc.save(`Receipt_${payment.tenantName}_${format(new Date(), 'ddMMyy')}.pdf`);
  };

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      return snap.data() as Settings;
    }
  });

  const getFormattedMessage = (template: string, tenant: Tenant, payment: Payment) => {
    return template
      .replace('{name}', tenant.fullName)
      .replace('{amount}', payment.balance.toString())
      .replace('{month}', format(new Date(payment.dueDate), 'MMMM'))
      .replace('{room}', tenant.roomNumber)
      .replace('{dueDate}', format(new Date(payment.dueDate), 'MMM d, yyyy'));
  };

  const sendWhatsAppReminder = async (payment: Payment) => {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    if (!tenant || !settings) return;

    const template = payment.status === 'Overdue' 
      ? settings.reminderSettings.templates.overdue 
      : settings.reminderSettings.templates.upcoming;
    
    const message = getFormattedMessage(template, tenant, payment);
    
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: tenant.whatsapp,
          message,
          tenantId: tenant.id,
          type: 'manual'
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('WhatsApp reminder sent!');
        
        // Log the reminder
        await addDoc(collection(db, 'reminders'), {
          tenantId: tenant.id,
          whatsappNumber: tenant.whatsapp,
          reminderType: 'manual',
          message,
          sentTime: new Date().toISOString(),
          method: 'whatsapp',
          status: 'sent'
        });
      }
    } catch (error) {
      toast.error('Failed to send WhatsApp reminder');
    }
  };

  const sendSMSReminder = async (payment: Payment) => {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    if (!tenant || !settings?.reminderSettings.twilioConfig) {
      toast.error('SMS configuration missing');
      return;
    }

    const template = payment.status === 'Overdue' 
      ? settings.reminderSettings.templates.overdue 
      : settings.reminderSettings.templates.upcoming;
    
    const message = getFormattedMessage(template, tenant, payment);
    
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: tenant.mobile,
          message,
          accountSid: settings.reminderSettings.twilioConfig.accountSid,
          authToken: settings.reminderSettings.twilioConfig.authToken,
          from: settings.reminderSettings.twilioConfig.fromNumber
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('SMS reminder sent!');
        
        // Log the reminder
        await addDoc(collection(db, 'reminders'), {
          tenantId: tenant.id,
          mobileNumber: tenant.mobile,
          reminderType: 'manual',
          message,
          sentTime: new Date().toISOString(),
          method: 'sms',
          status: 'sent'
        });
      } else {
        toast.error(data.error || 'Failed to send SMS');
      }
    } catch (error) {
      toast.error('Failed to send SMS reminder');
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sendBulkReminders = async () => {
    const overduePayments = payments.filter(p => p.status === 'Overdue');
    if (overduePayments.length === 0) {
      toast.info('No overdue payments found.');
      return;
    }

    if (!settings?.reminderSettings.whatsappEnabled && !settings?.reminderSettings.smsEnabled) {
      toast.error('Both WhatsApp and SMS reminders are disabled in settings.');
      return;
    }

    toast.info(`Sending reminders to ${overduePayments.length} overdue tenants...`);
    
    let sentCount = 0;
    for (const payment of overduePayments) {
      if (settings?.reminderSettings.whatsappEnabled) {
        await sendWhatsAppReminder(payment);
      }
      if (settings?.reminderSettings.smsEnabled) {
        await sendSMSReminder(payment);
      }
      sentCount++;
    }
    
    toast.success(`Sent ${sentCount} sets of reminders.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rent & Payments</h2>
          <p className="text-slate-500 text-sm">Track collections and overdue rent</p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-emerald-700 transition-colors shadow-sm"
            onClick={sendBulkReminders}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Bulk Reminders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Due', value: `₹${payments.filter(p => p.status !== 'Paid').reduce((acc, p) => acc + p.balance, 0).toLocaleString()}`, color: 'bg-white text-slate-900 border-slate-200', icon: IndianRupee, iconColor: 'text-blue-600' },
          { label: 'Overdue', value: `₹${payments.filter(p => p.status === 'Overdue').reduce((acc, p) => acc + p.balance, 0).toLocaleString()}`, color: 'bg-white text-red-600 border-slate-200', icon: AlertTriangle, iconColor: 'text-red-500' },
          { label: 'Today Due', value: `₹${payments.filter(p => format(new Date(p.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).reduce((acc, p) => acc + p.balance, 0).toLocaleString()}`, color: 'bg-white text-yellow-600 border-slate-200', icon: Clock, iconColor: 'text-yellow-500' },
          { label: 'Collected', value: `₹${payments.filter(p => p.paidAmount > 0).reduce((acc, p) => acc + p.paidAmount, 0).toLocaleString()}`, color: 'bg-white text-emerald-600 border-slate-200', icon: CheckCircle, iconColor: 'text-emerald-500' },
        ].map((card) => (
          <div key={card.label} className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 ${card.color}`}>
            <div className={`p-2 rounded-lg bg-slate-50 ${card.iconColor}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="text-xl font-bold tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenant name..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <select 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-bold uppercase tracking-wider text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Due">Due</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Tenant</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold text-right">Rent Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Paid</th>
                <th className="px-6 py-4 font-semibold text-right">Balance</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading payments...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No payments records found</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{payment.tenantName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-500 text-xs font-medium">
                        <Calendar className="h-3 w-3 mr-1.5 text-slate-400" />
                        {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600 text-xs">₹{payment.rentAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-right text-xs">₹{payment.paidAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600 font-bold text-right text-xs">₹{payment.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                        payment.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="Record Payment"
                        >
                          <IndianRupee className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => sendWhatsAppReminder(payment)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                          title="WhatsApp Reminder"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => sendSMSReminder(payment)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                          title="SMS Reminder"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => generateReceipt(payment)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                          title="Download Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Record Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form className="p-6 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const paidAmount = parseInt(formData.get('paidAmount') as string);
              const paymentMode = formData.get('paymentMode') as any;
              const transactionRef = formData.get('transactionRef') as string;
              
              upsertMutation.mutate({
                ...selectedPayment,
                paidAmount: selectedPayment.paidAmount + paidAmount,
                paymentMode,
                transactionRef
              });
            }}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tenant</p>
                <p className="font-bold text-lg text-slate-900">{selectedPayment.tenantName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-[10px] text-red-500 uppercase font-bold tracking-tight">Total Due</p>
                  <p className="font-bold text-red-600 text-xl">₹{selectedPayment.balance.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Due Date</p>
                  <p className="font-bold text-slate-700 text-sm">{format(new Date(selectedPayment.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Amount (INR)</label>
                <input 
                  type="number" 
                  name="paidAmount" 
                  max={selectedPayment.balance}
                  required 
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-bold text-slate-900 transition-all" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Mode</label>
                <select 
                  name="paymentMode" 
                  required 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction Ref (Optional)</label>
                <input 
                  name="transactionRef" 
                  placeholder="e.g. TXN123456"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>

              <button 
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {upsertMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
