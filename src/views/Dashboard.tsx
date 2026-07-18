import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../lib/queries';
import { 
  Users, 
  Bed, 
  IndianRupee, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl shadow-sm"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white rounded-xl shadow-sm"></div>
          <div className="h-96 bg-white rounded-xl shadow-sm"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      name: 'Total Capacity', 
      value: stats?.totalBeds || 0, 
      subValue: `${stats?.totalRooms || 0} Rooms`, 
      progress: stats ? (stats.occupiedBeds / stats.totalBeds) * 100 : 0,
      label: `${stats?.occupiedBeds}/${stats?.totalBeds} Beds Occupied`,
      color: 'bg-blue-600'
    },
    { 
      name: 'Active Tenants', 
      value: stats?.activeTenants || 0, 
      subValue: '+4 this week', 
      isAvatars: true,
      color: 'bg-green-600'
    },
    { 
      name: 'Pending Rent', 
      value: `₹${stats?.totalOverdue.toLocaleString() || 0}`, 
      subValue: `${stats?.recentPayments.filter(p => p.status !== 'Paid').length || 0} Tenants`, 
      isAlert: true,
      color: 'text-red-600'
    },
    { 
      name: 'Monthly Revenue', 
      value: `₹${(stats?.monthlyCollection || 0).toLocaleString()}`, 
      subValue: '88% Collected', 
      progress: 88,
      color: 'bg-emerald-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.name}</div>
            <div className="flex items-end justify-between">
              <span className={`text-2xl font-bold ${stat.isAlert ? 'text-red-600' : 'text-slate-900'}`}>{stat.value}</span>
              <span className={`text-xs font-semibold ${stat.isAlert ? 'text-red-500' : 'text-slate-500'}`}>{stat.subValue}</span>
            </div>
            
            {stat.progress !== undefined && (
              <>
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`${stat.color} h-full transition-all duration-500`} style={{ width: `${stat.progress}%` }}></div>
                </div>
                {stat.label && <div className="mt-1 text-[10px] text-slate-400">{stat.label}</div>}
              </>
            )}

            {stat.isAvatars && (
              <div className="mt-4 flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-[8px] flex items-center justify-center text-white font-bold">
                  +{Math.max(0, (stats?.activeTenants || 0) - 3)}
                </div>
              </div>
            )}

            {stat.isAlert && (
              <div className="mt-3 flex items-center space-x-1">
                <span className="text-red-500 text-[10px]">●</span>
                <span className="text-[10px] text-slate-500 underline cursor-pointer">Review overdue list</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button className="text-blue-600 text-xs font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-3 font-semibold">Tenant</th>
                  <th className="px-6 py-3 font-semibold">Room</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {stats?.recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                          {payment.tenantName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{payment.tenantName}</p>
                          <p className="text-[10px] text-slate-400">ID: {payment.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{payment.id.split('-')[0]}</td>
                    <td className="px-6 py-4 font-medium text-xs">₹{payment.paidAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Reminders Panel</h3>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start space-x-3">
              <span className="text-xl">📢</span>
              <div>
                <p className="text-xs font-bold text-red-800">{stats?.totalOverdue > 0 ? 'Rent Overdue Alerts' : 'No Overdue Rent'}</p>
                <p className="text-[10px] text-red-600">System will send auto WhatsApp reminders in 2 hours.</p>
                <button className="mt-2 px-3 py-1 bg-red-600 text-white text-[10px] rounded font-semibold hover:bg-red-700 transition-colors">
                  Send Manual Now
                </button>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-2">Recent Tenants</p>
                {stats?.recentTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded group cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <p className="text-xs font-medium text-slate-700">{tenant.fullName}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">View</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-2">Collection Goal</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-600">₹2.1L / ₹2.4L</span>
                  <span className="text-[10px] font-bold text-blue-600">87%</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '87%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-between items-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> System Live
            </span>
            <span>v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
