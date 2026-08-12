import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Wallet as WalletIcon, 
  Trophy, 
  Settings, 
  Menu,
  X,
  Bell,
  User,
  ShieldCheck,
  BarChart2,
  Loader,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthProvider';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { role, user, loading } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ClipboardList, label: 'Surveys', path: '/surveys' },
    { icon: WalletIcon, label: 'Wallet', path: '/wallet' },
    ...(role === 'admin' ? [{ icon: ShieldCheck, label: 'Admin', path: '/admin' }] : []),
    ...(role === 'brand' ? [{ icon: BarChart2, label: 'Brand Workspace', path: '/brand' }] : []),
  ];

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><Loader className="w-8 h-8 animate-spin text-indigo-600"/></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 lg:static lg:block",
          "transform lg:transform-none transition-transform duration-300 ease-in-out"
        )}
        style={{ x: sidebarOpen ? 0 : 0 }}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Anshree Surveys
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-slate-800">
                {role === 'admin' ? 'Admin Panel' : role === 'brand' ? 'Brand Workspace' : 'Participant Dashboard'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              >
                <Bell className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                    </div>
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900">No new notifications</p>
                      <p className="text-xs text-slate-500 mt-1">We'll let you know when something arrives.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 relative" ref={profileRef}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.isAnonymous ? 'Guest' : user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-700 hover:bg-indigo-200 transition-colors focus:outline-none"
              >
                <User className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut(auth);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <style>{`
        @media (min-width: 1024px) {
          aside {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
