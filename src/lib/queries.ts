import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Room, Tenant, Payment } from '../types';

export const getDashboardStats = async () => {
  const roomsSnap = await getDocs(collection(db, 'rooms'));
  const tenantsSnap = await getDocs(query(collection(db, 'tenants'), where('status', '==', 'active')));
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const paymentsSnap = await getDocs(collection(db, 'payments'));
  
  const rooms = roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  const activeTenants = tenantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
  const allPayments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));

  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((acc, room) => acc + (room.totalBeds || 0), 0);
  const occupiedBeds = activeTenants.length;
  const vacantBeds = totalBeds - occupiedBeds;

  const overduePayments = allPayments.filter(p => p.status === 'Overdue');
  const totalOverdue = overduePayments.reduce((acc, p) => acc + p.balance, 0);

  const monthlyCollection = allPayments.filter(p => {
    if (!p.paymentDate) return false;
    const date = new Date(p.paymentDate);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((acc, p) => acc + p.paidAmount, 0);

  return {
    totalRooms,
    totalBeds,
    occupiedBeds,
    vacantBeds,
    activeTenants: activeTenants.length,
    totalOverdue,
    monthlyCollection,
    recentPayments: allPayments.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || '')).slice(0, 5),
    recentTenants: activeTenants.sort((a, b) => b.joiningDate.localeCompare(a.joiningDate)).slice(0, 5)
  };
};
