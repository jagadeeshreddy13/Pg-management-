import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Room, Tenant } from '../types';
import { Plus, Edit2, Trash2, Home, Users, CheckCircle2, XCircle, X, LayoutGrid, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Rooms() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filter, setFilter] = useState<'All' | 'Available' | 'Full'>('All');
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'rooms'), orderBy('roomNumber')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    }
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'tenants'), where('status', '==', 'active')));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
    }
  });

  const getOccupancyForRoom = (roomNumber: string) => {
    return tenants.filter(t => t.roomNumber === roomNumber).length;
  };

  const upsertMutation = useMutation({
    mutationFn: async (roomData: any) => {
      if (selectedRoom) {
        await updateDoc(doc(db, 'rooms', selectedRoom.id), roomData);
      } else {
        await addDoc(collection(db, 'rooms'), { 
          ...roomData, 
          occupiedBeds: 0 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setIsModalOpen(false);
      setSelectedRoom(null);
      toast.success(selectedRoom ? 'Room updated successfully' : 'New room added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Something went wrong');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'rooms', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted');
    }
  });

  const filteredRooms = rooms.filter(room => {
    const occupancy = getOccupancyForRoom(room.roomNumber);
    if (filter === 'Available') return occupancy < room.totalBeds;
    if (filter === 'Full') return occupancy >= room.totalBeds;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <LayoutGrid className="mr-2 h-6 w-6 text-blue-600" />
            Room Management
          </h2>
          <p className="text-slate-500 text-sm">Configure rooms and monitor bed occupancy in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            {(['All', 'Available', 'Full'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={() => {
              setSelectedRoom(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Rooms</p>
          <p className="text-2xl font-bold text-slate-900">{rooms.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Capacity</p>
          <p className="text-2xl font-bold text-slate-900">{rooms.reduce((acc, curr) => acc + curr.totalBeds, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Occupied</p>
          <p className="text-2xl font-bold text-blue-600">{tenants.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available</p>
          <p className="text-2xl font-bold text-emerald-600">
            {rooms.reduce((acc, curr) => acc + curr.totalBeds, 0) - tenants.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {roomsLoading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse p-6 space-y-4">
              <div className="flex justify-between">
                <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                <div className="w-16 h-8 bg-slate-100 rounded-lg" />
              </div>
              <div className="w-2/3 h-6 bg-slate-100 rounded-lg" />
              <div className="w-full h-2 bg-slate-100 rounded-full" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-4 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-100 rounded" />
              </div>
            </div>
          ))
        ) : filteredRooms.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No rooms found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
              Start by adding your first room to the PG Hostel Management System.
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const occupancy = getOccupancyForRoom(room.roomNumber);
            const occupancyRate = (occupancy / room.totalBeds) * 100;
            const isFull = occupancy >= room.totalBeds;

            return (
              <div 
                key={room.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl shadow-sm transition-all duration-500 ${
                      isFull ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                      <Home className="h-6 w-6" />
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit Room"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Delete Room ${room.roomNumber}?`)) {
                            deleteMutation.mutate(room.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Room"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Room {room.roomNumber}</h3>
                  
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {occupancy} / {room.totalBeds} Beds
                    </span>
                    <span>{Math.round(occupancyRate)}% Full</span>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isFull ? 'bg-red-500' : occupancyRate > 70 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>

                  {/* Bed Grid Visual */}
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: room.totalBeds }).map((_, idx) => (
                      <div 
                        key={idx}
                        className={`aspect-square rounded-lg flex items-center justify-center border-2 transition-all duration-500 ${
                          idx < occupancy 
                            ? 'bg-blue-600 border-blue-600 shadow-sm' 
                            : 'bg-white border-slate-100'
                        }`}
                        title={idx < occupancy ? 'Occupied' : 'Vacant'}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          idx < occupancy ? 'bg-white' : 'bg-slate-200'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`px-6 py-4 border-t text-[11px] font-black uppercase flex items-center justify-center tracking-[0.2em] transition-colors ${
                  !isFull 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {!isFull ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 mr-2" /> {room.totalBeds - occupancy} Available</>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5 mr-2" /> Fully Occupied</>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedRoom ? 'Update Room' : 'Add New Room'}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">PG Hostel Configuration</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form className="p-8 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const roomNumber = formData.get('roomNumber') as string;
              const totalBeds = parseInt(formData.get('totalBeds') as string);
              upsertMutation.mutate({ roomNumber, totalBeds });
            }}>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Changes to bed counts will update room availability immediately across the dashboard and tenant assignment views.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Room Number</label>
                  <input 
                    name="roomNumber" 
                    defaultValue={selectedRoom?.roomNumber} 
                    required 
                    placeholder="e.g. 101, 204, Suite-A"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold transition-all placeholder:text-slate-300" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Bed Count</label>
                  <input 
                    type="number" 
                    name="totalBeds" 
                    defaultValue={selectedRoom?.totalBeds} 
                    required 
                    min="1"
                    max="12"
                    placeholder="Number of beds"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold transition-all" 
                  />
                  <p className="text-[10px] text-slate-400 mt-2 ml-1">* Max recommended 12 beds per room for optimal UI display.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                  {upsertMutation.isPending ? 'Processing...' : (selectedRoom ? 'Update Room' : 'Add Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
