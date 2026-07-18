import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bed, 
  IndianRupee, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Users },
    { name: 'Rooms', href: '/rooms', icon: Bed },
    { name: 'Payments', href: '/payments', icon: IndianRupee },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-400 flex-shrink-0">
        <div className="p-6 flex items-center space-x-3 text-white">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">H</div>
          <span className="text-xl font-bold tracking-tight">HostelPro</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-slate-500 text-xs">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              {auth.currentUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex flex-col">
              <span className="text-slate-300 font-medium truncate w-32">
                {auth.currentUser?.email?.split('@')[0] || 'Admin'}
              </span>
              <span className="text-[10px]">Premium Plan</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-medium hover:text-white transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">H</div>
            <span className="text-xl font-bold tracking-tight">HostelPro</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-700 mr-4"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-64 lg:w-96">
              <span className="text-slate-400 mr-2 text-sm">🔍</span>
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" />
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="flex space-x-2">
              <button className="hidden sm:block px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">Export PDF</button>
            </div>
            <div className="relative">
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <span className="text-xl">🔔</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
