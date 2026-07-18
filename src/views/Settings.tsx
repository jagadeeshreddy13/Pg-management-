import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings as SettingsType } from '../types';
import { 
  Settings as SettingsIcon, 
  Save, 
  MessageSquare, 
  CreditCard, 
  Building,
  Bell,
  Clock,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

const defaultSettings: SettingsType = {
  hostelName: 'Boys PG Hostel',
  address: '',
  contactNumber: '',
  upiId: '',
  bankDetails: {
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  },
  reminderSettings: {
    whatsappEnabled: true,
    smsEnabled: false,
    templates: {
      upcoming: 'Hi {name}, your rent for {month} is due in 3 days. Amount: ₹{amount}.',
      due: 'Hi {name}, your rent is due today. Amount: ₹{amount}.',
      overdue: 'Hi {name}, your rent is overdue by {days} days. Please pay ₹{amount} immediately.',
    },
    twilioConfig: {
      accountSid: '',
      authToken: '',
      fromNumber: '',
    }
  },
  gracePeriod: 3,
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'reminders'>('general');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'general'));
      if (docSnap.exists()) {
        return docSnap.data() as SettingsType;
      }
      return defaultSettings;
    }
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: SettingsType) => {
      await setDoc(doc(db, 'settings', 'general'), newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    }
  });

  if (isLoading) return <div className="animate-pulse space-y-6"><div className="h-12 bg-gray-100 rounded-lg"></div><div className="h-64 bg-gray-100 rounded-lg"></div></div>;

  const currentSettings = settings || defaultSettings;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-sm">Configure your hostel and system preferences</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/50">
          {[
            { id: 'general', label: 'General', icon: Building },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'reminders', label: 'Reminders', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 flex items-center text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 relative ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5 mr-2" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <form className="p-8 space-y-8" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          
          const newSettings: SettingsType = {
            ...currentSettings,
            hostelName: formData.get('hostelName') as string || currentSettings.hostelName,
            address: formData.get('address') as string || currentSettings.address,
            contactNumber: formData.get('contactNumber') as string || currentSettings.contactNumber,
            gracePeriod: parseInt(formData.get('gracePeriod') as string) || currentSettings.gracePeriod,
            upiId: formData.get('upiId') as string || currentSettings.upiId,
            bankDetails: {
              accountName: formData.get('accountName') as string || currentSettings.bankDetails.accountName,
              accountNumber: formData.get('accountNumber') as string || currentSettings.bankDetails.accountNumber,
              ifscCode: formData.get('ifscCode') as string || currentSettings.bankDetails.ifscCode,
              bankName: formData.get('bankName') as string || currentSettings.bankDetails.bankName,
            },
            reminderSettings: {
              ...currentSettings.reminderSettings,
              whatsappEnabled: formData.get('whatsappEnabled') === 'on',
              smsEnabled: formData.get('smsEnabled') === 'on',
              templates: {
                upcoming: formData.get('templateUpcoming') as string || currentSettings.reminderSettings.templates.upcoming,
                due: formData.get('templateDue') as string || currentSettings.reminderSettings.templates.due,
                overdue: formData.get('templateOverdue') as string || currentSettings.reminderSettings.templates.overdue,
              },
              twilioConfig: {
                accountSid: formData.get('twilioAccountSid') as string || currentSettings.reminderSettings.twilioConfig?.accountSid || '',
                authToken: formData.get('twilioAuthToken') as string || currentSettings.reminderSettings.twilioConfig?.authToken || '',
                fromNumber: formData.get('twilioFromNumber') as string || currentSettings.reminderSettings.twilioConfig?.fromNumber || '',
              }
            }
          };

          mutation.mutate(newSettings);
        }}>
          <div className={activeTab === 'general' ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hostel Name</label>
                  <input name="hostelName" defaultValue={currentSettings.hostelName} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                  <textarea name="address" rows={3} defaultValue={currentSettings.address} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-sm leading-relaxed" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Number</label>
                    <input name="contactNumber" defaultValue={currentSettings.contactNumber} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Grace Period (Days)
                    </label>
                    <input type="number" name="gracePeriod" defaultValue={currentSettings.gracePeriod} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === 'payments' ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">UPI ID</label>
                <input name="upiId" defaultValue={currentSettings.upiId} placeholder="e.g. yourname@upi" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Holder Name</label>
                  <input name="accountName" defaultValue={currentSettings.bankDetails.accountName} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
                  <input name="accountNumber" defaultValue={currentSettings.bankDetails.accountNumber} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">IFSC Code</label>
                  <input name="ifscCode" defaultValue={currentSettings.bankDetails.ifscCode} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bank Name</label>
                  <input name="bankName" defaultValue={currentSettings.bankDetails.bankName} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === 'reminders' ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                  <div className="flex items-center relative z-10">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 mr-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 tracking-tight">WhatsApp Alerts</p>
                      <p className="text-[10px] text-blue-600/80 font-bold uppercase tracking-wider">Automated Notifications</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    name="whatsappEnabled" 
                    defaultChecked={currentSettings.reminderSettings.whatsappEnabled ?? (currentSettings.reminderSettings as any).enabled}
                    className="h-6 w-6 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer relative z-10" 
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                    <Phone className="h-12 w-12" />
                  </div>
                  <div className="flex items-center relative z-10">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600 mr-4">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 tracking-tight">SMS Alerts</p>
                      <p className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider">Twilio Integration</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    name="smsEnabled" 
                    defaultChecked={currentSettings.reminderSettings.smsEnabled}
                    className="h-6 w-6 rounded-md border-slate-200 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer relative z-10" 
                  />
                </div>
              </div>

              {/* Twilio Configuration */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center">
                  <SettingsIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  Twilio Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account SID</label>
                    <input 
                      name="twilioAccountSid" 
                      defaultValue={currentSettings.reminderSettings.twilioConfig?.accountSid} 
                      placeholder="AC..."
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Auth Token</label>
                    <input 
                      type="password"
                      name="twilioAuthToken" 
                      defaultValue={currentSettings.reminderSettings.twilioConfig?.authToken} 
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Twilio From Number</label>
                    <input 
                      name="twilioFromNumber" 
                      defaultValue={currentSettings.reminderSettings.twilioConfig?.fromNumber} 
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Upcoming (3 days before)</label>
                  <textarea name="templateUpcoming" rows={3} defaultValue={currentSettings.reminderSettings.templates.upcoming} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none leading-relaxed transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Due (On the day)</label>
                  <textarea name="templateDue" rows={3} defaultValue={currentSettings.reminderSettings.templates.due} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none leading-relaxed transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overdue (After grace period)</label>
                  <textarea name="templateOverdue" rows={3} defaultValue={currentSettings.reminderSettings.templates.overdue} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none leading-relaxed transition-all" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start">
                  <div className="p-1.5 bg-slate-200 rounded-md mr-3 mt-0.5">
                    <MessageSquare className="h-3 w-3 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {['{name}', '{amount}', '{month}', '{days}'].map(v => (
                        <span key={v} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-blue-600 font-bold">{v}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="px-10 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold uppercase tracking-widest flex items-center hover:bg-blue-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
              ) : (
                <Save className="h-4 w-4 mr-3" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
