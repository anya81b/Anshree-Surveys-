import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ClipboardList, Wallet as WalletIcon, TrendingUp, Award, Play, Loader } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ surveysAvailable: 0, pointsEarned: 0, successRate: "100%", currentRank: "Bronze" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-lg shadow-indigo-200"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome to Anshree Surveys.</h1>
          <p className="text-indigo-100 text-lg md:text-xl mb-8">
            Your trusted platform for valuable insights. Participate in our curated surveys, share your unique perspective, and earn rewards effortlessly.
          </p>
          <button 
            onClick={() => navigate('/surveys')}
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition"
          >
            <Play className="w-5 h-5" /> Start Earning Now
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-indigo-600"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Surveys Available", value: stats.surveysAvailable.toString(), icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-100" },
            { title: "Points Earned", value: stats.pointsEarned.toLocaleString(), icon: WalletIcon, color: "text-emerald-600", bg: "bg-emerald-100" },
            { title: "Success Rate", value: stats.successRate, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
            { title: "Current Rank", value: stats.currentRank, icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
