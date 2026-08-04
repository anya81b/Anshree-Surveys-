import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Wallet as WalletIcon, Coins, ArrowUpRight, ArrowDownRight, Loader, Gift, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

const PROVIDERS = [
  { name: 'Amazon', color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
  { name: 'Flipkart', color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
  { name: 'Google Play', color: 'bg-green-100 text-green-600', border: 'border-green-200' },
  { name: 'Xoxoday', color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' }
];

export function Wallet() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (token) fetchWallet();
  }, [token]);

  const fetchWallet = async () => {
    const res = await fetch('/api/user/wallet', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setWallet(await res.json());
  };

  const handleRedeem = async (provider: string, amount: number) => {
    if (!confirm(`Redeem ${amount} ${provider} gift card?`)) return;
    setRedeeming(true);
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider, amount })
      });
      if (res.ok) {
        alert('Redemption requested successfully!');
        fetchWallet();
        setShowRedeem(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to redeem');
      }
    } catch (e) {
      console.error(e);
      alert('Error redeeming');
    } finally {
      setRedeeming(false);
    }
  };

  if (!wallet) return <div className="p-8 flex justify-center"><Loader className="w-8 h-8 animate-spin text-indigo-600"/></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <WalletIcon className="w-6 h-6 text-indigo-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Wallet</h1>
          <p className="text-slate-500">Manage your earnings and rewards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Coins className="w-32 h-32" />
          </div>
          <p className="text-indigo-200 font-medium mb-2">Available Balance</p>
          <div className="flex items-end gap-2 mb-8">
            <span className="text-5xl font-bold">{wallet.balance}</span>
            <span className="text-xl text-indigo-200 mb-1">pts</span>
          </div>
          <button 
            onClick={() => setShowRedeem(!showRedeem)}
            className="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold hover:bg-indigo-50 transition"
          >
            {showRedeem ? 'Cancel Redemption' : 'Redeem Rewards'}
          </button>
        </motion.div>

        <div className="grid grid-rows-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-slate-500 font-medium mb-1">Lifetime Earnings</p>
              <p className="text-2xl font-bold text-slate-900">{wallet.lifetimeEarnings} pts</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm gap-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium mb-1">Pending Surveys</p>
                <p className="text-2xl font-bold text-slate-900">{wallet.pendingPoints || 0} pts</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            {wallet.pending > 0 && (
               <div className="text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                 * {wallet.pending} pts locked in pending redemptions
               </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showRedeem && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-600" /> Choose a Gift Card
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROVIDERS.map((p, i) => (
                  <div key={i} className={`border ${p.border} rounded-2xl p-4 flex flex-col items-center text-center gap-4 hover:shadow-md transition bg-slate-50`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${p.color} font-bold text-xl`}>
                      {p.name[0]}
                    </div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <div className="w-full space-y-2">
                      <button 
                        disabled={wallet.balance < 2500 || redeeming}
                        onClick={() => handleRedeem(p.name, 250)}
                        className="w-full py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ₹250 <span className="text-xs text-slate-500 ml-1">(2,500 pts)</span>
                      </button>
                      <button 
                        disabled={wallet.balance < 5000 || redeeming}
                        onClick={() => handleRedeem(p.name, 500)}
                        className="w-full py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ₹500 <span className="text-xs text-slate-500 ml-1">(5,000 pts)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        
        {wallet.history.some((tx: any) => tx.type === 'earn' && tx.surveyType && tx.surveyType !== 'Text') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Interactive Surveys Tracking</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(
                wallet.history.filter((tx: any) => tx.type === 'earn' && tx.surveyType && tx.surveyType !== 'Text')
                  .reduce((acc: any, tx: any) => {
                    if (!acc[tx.surveyType]) acc[tx.surveyType] = { count: 0, points: 0, pending: 0 };
                    if (tx.status === 'completed' || tx.status === 'approved') {
                      acc[tx.surveyType].count += 1;
                      acc[tx.surveyType].points += tx.amount;
                    } else if (tx.status === 'pending') {
                      acc[tx.surveyType].pending += tx.amount;
                    }
                    return acc;
                  }, {})
              ).map(([type, stats]: any) => (
                <div key={type} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1 block">{type}</span>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-slate-900">{stats.count} Completed</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Earned</p>
                      <p className="font-bold text-emerald-600">+{stats.points} pts</p>
                    </div>
                    {stats.pending > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">Pending</p>
                        <p className="font-semibold text-amber-500">~{stats.pending} pts</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Reward History</h2>
          <div className="space-y-4">
            {wallet.history.filter((tx: any) => tx.type === 'earn').map((tx: any) => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition gap-4 border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600`}>
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{tx.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                        tx.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                        tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end text-left sm:text-right pl-14 sm:pl-0">
                  <span className={`font-bold text-emerald-600 ${tx.status === 'pending' ? 'opacity-50' : ''}`}>
                    +{tx.amount} pts
                  </span>
                </div>
              </div>
            ))}
            {wallet.history.filter((tx: any) => tx.type === 'earn').length === 0 && (
              <div className="text-center py-8 text-slate-500">No rewards earned yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Transaction History</h2>
          <div className="space-y-4">
            {wallet.history.filter((tx: any) => tx.type === 'redeem').map((tx: any) => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition gap-4 border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-rose-100 text-rose-600`}>
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{tx.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                        tx.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end text-left sm:text-right pl-14 sm:pl-0">
                  <span className={`font-bold text-slate-900 ${tx.status === 'pending' ? 'opacity-50' : ''}`}>
                    {tx.amount} pts
                  </span>
                  {tx.code && (
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      <span className="text-slate-500">Code:</span>
                      <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono">{tx.code}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {wallet.history.filter((tx: any) => tx.type === 'redeem').length === 0 && (
              <div className="text-center py-8 text-slate-500">No recent transactions.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
