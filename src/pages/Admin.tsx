import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Plus, ShieldCheck, Play, CheckCircle, Gift, XCircle, Check, Users, Activity, Trash2, Ban, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export function Admin() {
  const { role, token } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'surveys' | 'responses' | 'redemptions' | 'users' | 'analytics'>('analytics');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'Text', rewardPoints: 10,
    estimatedCompletionTime: 5, status: 'draft', repeatable: false,
    eligibility: '', category: ''
  });

  useEffect(() => {
    if (role === 'admin' && token) {
      if (activeTab === 'surveys') fetchSurveys();
      if (activeTab === 'responses') fetchResponses();
      if (activeTab === 'redemptions') fetchRedemptions();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'analytics') fetchAnalytics();
    }
  }, [role, token, activeTab]);

  const fetchSurveys = async () => {
    const res = await fetch('/api/surveys', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSurveys(await res.json());
  };

  const fetchResponses = async () => {
    const res = await fetch('/api/admin/responses', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setResponses(await res.json());
  };

  const fetchRedemptions = async () => {
    const res = await fetch('/api/admin/redemptions', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setRedemptions(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
  };

  const fetchAnalytics = async () => {
    const res = await fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAnalytics(await res.json());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowCreate(false);
      fetchSurveys();
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/surveys/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchSurveys();
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this survey and all its responses?')) return;
    await fetch(`/api/surveys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchSurveys();
  };

  const handleResponseStatus = async (id: number, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/admin/responses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchResponses();
    }
  };

  const handleRedemption = async (id: number, action: 'approve' | 'reject') => {
    let code = '';
    if (action === 'approve') {
      code = prompt('Enter the gift card code to provide to the user:') || '';
      if (!code) return; // cancelled
    } else {
      if (!confirm('Are you sure you want to reject this redemption?')) return;
    }

    const res = await fetch(`/api/admin/redemptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected', code })
    });
    if (res.ok) {
      fetchRedemptions();
    }
  };

  const toggleBan = async (id: number, isBanned: boolean) => {
    if (!confirm(`Are you sure you want to ${isBanned ? 'ban' : 'unban'} this user?`)) return;
    await fetch(`/api/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isBanned })
    });
    fetchUsers();
  };

  const toggleBrand = async (id: number, role: string) => {
    const newRole = role === 'brand' ? 'user' : 'brand';
    if (!confirm(`Are you sure you want to make this user a ${newRole}?`)) return;
    await fetch(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole })
    });
    fetchUsers();
  };

  if (role !== 'admin') {
    return <div className="p-8 text-center text-rose-600 font-semibold">Access Denied: Admin Only</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Administration
          </h1>
          <p className="text-slate-600">Manage surveys, users, and redemptions.</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200 overflow-x-auto whitespace-nowrap pb-1">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Activity className="w-4 h-4"/> Analytics
        </button>
        <button 
          onClick={() => setActiveTab('surveys')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'surveys' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Surveys
        </button>
        <button 
          onClick={() => setActiveTab('responses')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'responses' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <MessageSquare className="w-4 h-4" /> Responses
          {responses.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-xs">
              {responses.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('redemptions')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'redemptions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Redemptions
          {redemptions.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-xs">
              {redemptions.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Users className="w-4 h-4"/> Users
        </button>
      </div>

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-slate-500 font-medium mb-2">Total Users</span>
            <span className="text-4xl font-bold text-slate-900">{analytics.users}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-slate-500 font-medium mb-2">Total Surveys</span>
            <span className="text-4xl font-bold text-slate-900">{analytics.surveys}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-slate-500 font-medium mb-2">Survey Completions</span>
            <span className="text-4xl font-bold text-slate-900">{analytics.responses}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-slate-500 font-medium mb-2">Gift Card Requests</span>
            <span className="text-4xl font-bold text-slate-900">{analytics.redemptions}</span>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 
                        u.role === 'brand' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      {u.isBanned ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium">Banned</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => toggleBrand(u.id, u.role)} 
                            className="font-medium text-sm text-purple-600 hover:text-purple-800"
                          >
                            {u.role === 'brand' ? 'Make User' : 'Make Brand'}
                          </button>
                          <button 
                            onClick={() => toggleBan(u.id, !u.isBanned)} 
                            className={`font-medium text-sm flex items-center gap-1 ${u.isBanned ? 'text-emerald-600 hover:text-emerald-800' : 'text-rose-600 hover:text-rose-800'}`}
                          >
                            <Ban className="w-4 h-4"/> {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Survey</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {responses.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">{format(new Date(r.completedAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{r.surveyTitle}</td>
                    <td className="px-6 py-4 text-slate-500">{r.userEmail}</td>
                    <td className="px-6 py-4">
                      <pre className="text-xs bg-slate-100 p-2 rounded-lg max-w-xs overflow-auto text-slate-700">
                        {JSON.stringify(r.responseData, null, 2)}
                      </pre>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                        r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleResponseStatus(r.id, 'approved')} 
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => handleResponseStatus(r.id, 'rejected')} 
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4"/>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {responses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No survey responses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'surveys' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
            >
              {showCreate ? 'Cancel' : <><Plus className="w-5 h-5"/> New Survey</>}
            </button>
          </div>

          {showCreate && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreate} 
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="AI Video">AI Video Surveys</option>
                    <option value="AI Image Comparison">AI Image Comparison Surveys</option>
                    <option value="Image Rating">Image Rating Surveys</option>
                    <option value="Brand Advertisement">Brand Advertisement Surveys</option>
                    <option value="Product Packaging Comparison">Product Packaging Comparison Surveys</option>
                    <option value="Logo Comparison">Logo Comparison Surveys</option>
                    <option value="Voice Response">Voice Response Surveys</option>
                    <option value="Selfie Video Response">Selfie Video Response Surveys</option>
                    <option value="Website Testing">Website Testing Surveys</option>
                    <option value="Mobile App Testing">Mobile App Testing Surveys</option>
                    <option value="Audio/Music">Audio/Music Surveys</option>
                    <option value="Movie & Trailer Review">Movie & Trailer Review Surveys</option>
                    <option value="Interactive Poll">Interactive Polls</option>
                    <option value="Personality & Psychology">Personality & Psychology Surveys</option>
                    <option value="Text">Standard Questionnaire</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reward Points</label>
                  <input type="number" required value={formData.rewardPoints} onChange={e=>setFormData({...formData, rewardPoints: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Time (mins)</label>
                  <input type="number" required value={formData.estimatedCompletionTime} onChange={e=>setFormData({...formData, estimatedCompletionTime: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none" placeholder="e.g. Technology" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility Criteria</label>
                  <input value={formData.eligibility} onChange={e=>setFormData({...formData, eligibility: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none" placeholder="e.g. Age > 18" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="repeatable" checked={formData.repeatable} onChange={e=>setFormData({...formData, repeatable: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <label htmlFor="repeatable" className="text-sm font-medium text-slate-700">Allow users to take this survey multiple times</label>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition">Save Survey</button>
              </div>
            </motion.form>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Survey</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Points</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {surveys.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{s.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{s.description}</p>
                      </td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">{s.type}</span></td>
                      <td className="px-6 py-4 font-medium text-emerald-600">+{s.rewardPoints}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          {s.status === 'draft' ? (
                            <button onClick={() => updateStatus(s.id, 'active')} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1" title="Activate">
                              <Play className="w-4 h-4"/>
                            </button>
                          ) : (
                            <button onClick={() => updateStatus(s.id, 'closed')} className="text-amber-600 hover:text-amber-800 font-medium text-sm flex items-center gap-1" title="Close">
                              <CheckCircle className="w-4 h-4"/>
                            </button>
                          )}
                          <button onClick={() => deleteSurvey(s.id)} className="text-rose-600 hover:text-rose-800 font-medium text-sm flex items-center gap-1" title="Delete">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {surveys.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No surveys found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'redemptions' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Reward</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {redemptions.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{r.userEmail}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-900">{r.provider} ₹{r.amount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{r.pointsCost} pts</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                        r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleRedemption(r.id, 'approve')} 
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => handleRedemption(r.id, 'reject')} 
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4"/>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {redemptions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No redemptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
