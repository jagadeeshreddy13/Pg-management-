import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Tenant, Room } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus, 
  X,
  Upload,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logActivity } from '../lib/logger';

export default function Tenants() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'vacated'>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  const [tempAadhaarUrl, setTempAadhaarUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedTenant) {
      setTempPhotoUrl(selectedTenant.photoUrl || null);
      setTempAadhaarUrl(selectedTenant.aadhaarUrl || null);
    } else {
      setTempPhotoUrl(null);
      setTempAadhaarUrl(null);
    }
  }, [selectedTenant]);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'tenants'), orderBy('fullName')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
    }
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'rooms'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (tenantData: Partial<Tenant>) => {
      if (selectedTenant) {
        await updateDoc(doc(db, 'tenants', selectedTenant.id), tenantData);
      } else {
        await addDoc(collection(db, 'tenants'), { ...tenantData, status: 'active' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsModalOpen(false);
      logActivity(selectedTenant ? 'UPDATE_TENANT' : 'CREATE_TENANT', `Tenant: ${selectedTenant?.fullName || 'New'}`);
      setSelectedTenant(null);
      toast.success(selectedTenant ? 'Tenant updated' : 'Tenant added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (confirm('Are you sure you want to delete this tenant?')) {
        await deleteDoc(doc(db, 'tenants', id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      logActivity('DELETE_TENANT', `ID: ${selectedTenant?.id || 'Unknown'}`);
      toast.success('Tenant deleted');
    }
  });

  const handleFileUpload = async (file: File, path: string) => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `tenants/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      toast.error('File upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.mobile.includes(searchTerm) ||
                         t.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesRoom = roomFilter === 'all' || t.roomNumber === roomFilter;
    
    return matchesSearch && matchesStatus && matchesRoom;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tenants</h2>
          <p className="text-slate-500 text-sm">Manage your hostel residents</p>
        </div>
        <button 
          onClick={() => {
            setSelectedTenant(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="vacated">Vacated</option>
            </select>

            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="all">All Rooms</option>
              {rooms.map(room => (
                <option key={room.id} value={room.roomNumber}>Room {room.roomNumber}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Tenant</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Room/Bed</th>
                <th className="px-6 py-4 font-semibold">Joining Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">Loading tenants...</td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">No tenants found</td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold mr-3 overflow-hidden">
                          {tenant.photoUrl ? (
                            <img src={tenant.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            tenant.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{tenant.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Rent: ₹{tenant.monthlyRent}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-[10px] text-slate-600 font-medium">
                          <Phone className="h-3 w-3 mr-1" />
                          {tenant.mobile}
                        </div>
                        <div className="flex items-center text-[10px] text-emerald-600 font-bold">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {tenant.whatsapp}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-xs text-nowrap">Room {tenant.roomNumber}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Bed {tenant.bedNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                      {tenant.joiningDate ? format(new Date(tenant.joiningDate), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteMutation.mutate(tenant.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center tracking-tight">
                <UserPlus className="mr-3 h-6 w-6 text-blue-600" />
                {selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form className="p-6 space-y-8" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              upsertMutation.mutate({
                ...data,
                photoUrl: tempPhotoUrl || undefined,
                aadhaarUrl: tempAadhaarUrl || undefined
              } as any);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Personal Information</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input name="fullName" defaultValue={selectedTenant?.fullName} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
                      <input name="mobile" defaultValue={selectedTenant?.mobile} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp Number</label>
                      <input name="whatsapp" defaultValue={selectedTenant?.whatsapp} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhaar Number</label>
                    <input name="aadhaarNumber" defaultValue={selectedTenant?.aadhaarNumber} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Permanent Address</label>
                    <textarea name="address" defaultValue={selectedTenant?.address} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm" />
                  </div>
                </div>

                {/* Hostel Allocation */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Hostel Allocation</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Room Number</label>
                      <select name="roomNumber" defaultValue={selectedTenant?.roomNumber} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm">
                        <option value="">Select Room</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.roomNumber}>Room {room.roomNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bed Number</label>
                      <input name="bedNumber" defaultValue={selectedTenant?.bedNumber} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Joining Date</label>
                      <input type="date" name="joiningDate" defaultValue={selectedTenant?.joiningDate} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Rent</label>
                      <input type="number" name="monthlyRent" defaultValue={selectedTenant?.monthlyRent} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Security Deposit</label>
                      <input type="number" name="securityDeposit" defaultValue={selectedTenant?.securityDeposit} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Advance Amount</label>
                      <input type="number" name="advanceAmount" defaultValue={selectedTenant?.advanceAmount} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos & IDs */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Documents & Photo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`border-2 border-dashed ${tempPhotoUrl ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group`}>
                    <div className={`h-12 w-12 ${tempPhotoUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'} rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                      {tempPhotoUrl ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                    </div>
                    <p className={`text-xs font-bold uppercase ${tempPhotoUrl ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {tempPhotoUrl ? 'Photo Uploaded' : 'Profile Photo'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                    <input type="file" className="hidden" id="photo-upload" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file, 'photos');
                        if (url) {
                          setTempPhotoUrl(url);
                          toast.success('Photo uploaded');
                        }
                      }
                    }} />
                    <label htmlFor="photo-upload" className={`mt-4 ${tempPhotoUrl ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'} px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer transition-all shadow-sm`}>
                      {tempPhotoUrl ? 'Change Photo' : 'Choose File'}
                    </label>
                  </div>
                  <div className={`border-2 border-dashed ${tempAadhaarUrl ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group`}>
                    <div className={`h-12 w-12 ${tempAadhaarUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'} rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                      {tempAadhaarUrl ? <CheckCircle2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                    </div>
                    <p className={`text-xs font-bold uppercase ${tempAadhaarUrl ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {tempAadhaarUrl ? 'ID Proof Uploaded' : 'Aadhaar / ID Proof'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF or Image up to 5MB</p>
                    <input type="file" className="hidden" id="id-upload" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file, 'ids');
                        if (url) {
                          setTempAadhaarUrl(url);
                          toast.success('ID Proof uploaded');
                        }
                      }
                    }} />
                    <label htmlFor="id-upload" className={`mt-4 ${tempAadhaarUrl ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'} px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer transition-all shadow-sm`}>
                      {tempAadhaarUrl ? 'Change ID' : 'Choose File'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={upsertMutation.isPending || isUploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {upsertMutation.isPending ? 'Saving...' : 'Save Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
