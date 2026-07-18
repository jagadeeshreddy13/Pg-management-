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
  const allTenantsSnap = await getDocs(collection(db, 'tenants'));
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const paymentsSnap = await getDocs(collection(db, 'payments'));
  
  const rooms = roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  const allTenants = allTenantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
  const activeTenants = allTenants.filter(t => t.status === 'active');
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

  // Calculate trends for the last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: d.toLocaleString('default', { month: 'short' }),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      occupancy: 0
    });
  }

  months.forEach(month => {
    const monthStart = new Date(month.year, month.monthIndex, 1);
    const monthEnd = new Date(month.year, month.monthIndex + 1, 0);

    const count = allTenants.filter(t => {
      const joining = new Date(t.joiningDate);
      const vacated = t.vacatedDate ? new Date(t.vacatedDate) : null;
      
      // Tenant was active if joined before end of month AND (not vacated OR vacated after start of month)
      return joining <= monthEnd && (!vacated || vacated >= monthStart);
    }).length;
    
    month.occupancy = count;
  });

  return {
    totalRooms,
    totalBeds,
    occupiedBeds,
    vacantBeds,
    activeTenants: activeTenants.length,
    totalOverdue,
    monthlyCollection,
    recentPayments: allPayments.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || '')).slice(0, 5),
    recentTenants: activeTenants.sort((a, b) => b.joiningDate.localeCompare(a.joiningDate)).slice(0, 5),
    occupancyTrend: months.map(({ name, occupancy }) => ({ name, occupancy }))
  };
};
