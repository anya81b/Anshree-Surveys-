import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Plus, BarChart2, Video, Image as ImageIcon, Users, Clock, Download, FileText, CheckCircle, Activity, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function BrandDashboard() {
  const { role, token } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'surveys' | 'create'>('overview');
  
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'Text', rewardPoints: 10,
    estimatedCompletionTime: 5, status: 'draft', repeatable: false,
    eligibility: '', category: '', content: {}
  });

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile2, setMediaFile2] = useState<File | null>(null);
  const [mediaPreview2, setMediaPreview2] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (role === 'brand' && token) {
      fetchSurveys();
      fetchAnalytics();
    }
  }, [role, token]);

  const fetchSurveys = async () => {
    const res = await fetch('/api/brand/surveys', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSurveys(await res.json());
  };

  const fetchAnalytics = async () => {
    const res = await fetch('/api/brand/analytics', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAnalytics(await res.json());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile2(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app we'd upload the file to cloud storage (e.g. Firebase Storage/S3)
    // Here we'll just embed it as a base64 string for simplicity since it's a prototype
    const surveyContent = {
      ...formData.content,
      media: mediaPreview,
      mediaType: mediaFile?.type.startsWith('video') ? 'video' : mediaFile?.type.startsWith('audio') ? 'audio' : (mediaFile ? 'image' : null),
      media2: mediaPreview2,
      mediaType2: mediaFile2?.type.startsWith('video') ? 'video' : mediaFile2?.type.startsWith('audio') ? 'audio' : (mediaFile2 ? 'image' : null),
    };

    const res = await fetch('/api/brand/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...formData, content: surveyContent })
    });
    if (res.ok) {
      setActiveTab('surveys');
      fetchSurveys();
      setFormData({
        title: '', description: '', type: 'Text', rewardPoints: 10,
        estimatedCompletionTime: 5, status: 'draft', repeatable: false,
        eligibility: '', category: '', content: {}
      });
      setMediaFile(null);
      setMediaPreview(null);
      setMediaFile2(null);
      setMediaPreview2(null);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/brand/surveys/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    fetchSurveys();
  };

  const downloadReport = async (id: number, title: string) => {
    const res = await fetch(`/api/brand/surveys/${id}/responses`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      
      // Convert to CSV
      if (data.length === 0) {
        alert('No responses yet to download.');
        return;
      }

      const headers = ['Response ID', 'User ID', 'Status', 'Completed At', 'Data'];
      const csvContent = [
        headers.join(','),
        ...data.map((r: any) => [
          r.id, 
          r.userId, 
          r.status, 
          new Date(r.completedAt).toISOString(),
          `"${JSON.stringify(r.responseData).replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${id}_${title.replace(/\s+/g, '_')}_report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  if (role !== 'brand') {
    return <div className="p-8 text-center text-rose-600 font-semibold">Access Denied: Brand Accounts Only</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            Brand Workspace
          </h1>
          <p className="text-slate-600">Create surveys, upload media, and view analytics.</p>
        </div>
        <button 
          onClick={() => setActiveTab('create')}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5"/> Create Survey
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-200 overflow-x-auto whitespace-nowrap pb-1">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Activity className="w-4 h-4"/> Overview
        </button>
        <button 
          onClick={() => setActiveTab('surveys')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'surveys' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <FileText className="w-4 h-4" /> My Surveys
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`pb-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      {activeTab === 'overview' && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-slate-500 font-medium">Total Surveys</span>
              <span className="text-4xl font-bold text-slate-900">{analytics.totalSurveys}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-slate-500 font-medium">Total Responses</span>
              <span className="text-4xl font-bold text-slate-900">{analytics.totalResponses}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-2">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-slate-500 font-medium">Avg. Completion Rate</span>
              <span className="text-4xl font-bold text-slate-900">{analytics.completionRate}%</span>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Performance</h3>
            <div className="h-64 flex items-end gap-2">
              {/* Fake chart bars based on response activity - in a real app use Recharts */}
              {analytics.recentActivity && analytics.recentActivity.map((day: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                  <div 
                    className="w-full bg-indigo-100 group-hover:bg-indigo-200 rounded-t-lg transition-all relative"
                    style={{ height: `${Math.max(10, (day.count / (Math.max(...analytics.recentActivity.map((d: any) => d.count)) || 1)) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition">
                      {day.count}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{format(new Date(day.date), 'MMM d')}</span>
                </div>
              ))}
              {(!analytics.recentActivity || analytics.recentActivity.length === 0) && (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  Not enough data for chart
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-4xl"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Campaign</h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Title</label>
                <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g. Q3 Brand Awareness Video Survey" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 transition" placeholder="Describe what the users will be evaluating..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Survey Type</label>
                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reward Points per User</label>
                <input type="number" required value={formData.rewardPoints} onChange={e=>setFormData({...formData, rewardPoints: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none transition" />
              </div>
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-4 text-center ${!formData.type.includes('Comparison') ? 'md:col-span-2' : ''}`}>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*,video/*,audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {mediaPreview ? (
                    <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center mx-auto">
                      {mediaFile?.type.startsWith('video') ? (
                        <video src={mediaPreview} controls className="w-full h-full object-contain" />
                      ) : mediaFile?.type.startsWith('audio') ? (
                        <audio src={mediaPreview} controls className="w-full h-full" />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" />
                      )}
                      <button 
                        type="button" 
                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 backdrop-blur-sm transition"
                      >
                        <Plus className="w-4 h-4 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Upload Media {formData.type.includes('Comparison') ? '1' : ''}</p>
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition shadow-sm"
                        >
                          Browse Files
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {formData.type.includes('Comparison') && (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-4 text-center">
                    <input 
                      type="file" 
                      ref={fileInputRef2}
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileChange2}
                    />
                    
                    {mediaPreview2 ? (
                      <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center mx-auto">
                        {mediaFile2?.type.startsWith('video') ? (
                          <video src={mediaPreview2} controls className="w-full h-full object-contain" />
                        ) : (
                          <img src={mediaPreview2} alt="Preview 2" className="w-full h-full object-contain" />
                        )}
                        <button 
                          type="button" 
                          onClick={() => { setMediaFile2(null); setMediaPreview2(null); }}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 backdrop-blur-sm transition"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Upload Media 2</p>
                          <button 
                            type="button"
                            onClick={() => fileInputRef2.current?.click()}
                            className="mt-4 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition shadow-sm"
                          >
                            Browse Files
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {(formData.type === 'Website Testing' || formData.type === 'Mobile App Testing' || formData.type === 'Movie & Trailer Review') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">External Link (Optional)</label>
                  <input type="url" value={formData.content?.link || ''} onChange={e=>setFormData({...formData, content: {...formData.content, link: e.target.value}})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none transition" placeholder="https://..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Category (Optional)</label>
                <input value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none transition" placeholder="e.g. Technology, Fashion" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Demographics (Optional)</label>
                <input value={formData.eligibility} onChange={e=>setFormData({...formData, eligibility: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none transition" placeholder="e.g. Age 18-35" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="repeatable" checked={formData.repeatable} onChange={e=>setFormData({...formData, repeatable: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
              <label htmlFor="repeatable" className="text-sm font-medium text-slate-700">Allow users to take this survey multiple times</label>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
                Launch Campaign
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'surveys' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Responses</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {surveys.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{s.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(s.createdAt), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                        s.status === 'closed' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{s.responseCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => downloadReport(s.id, s.title)} 
                          className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 p-2 rounded-lg transition" 
                          title="Download Report"
                        >
                          <Download className="w-4 h-4"/>
                        </button>
                        
                        {s.status === 'draft' ? (
                          <button 
                            onClick={() => updateStatus(s.id, 'active')} 
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-2 rounded-lg transition" 
                            title="Activate"
                          >
                            <Play className="w-4 h-4"/>
                          </button>
                        ) : s.status === 'active' ? (
                          <button 
                            onClick={() => updateStatus(s.id, 'closed')} 
                            className="bg-amber-50 text-amber-600 hover:bg-amber-100 p-2 rounded-lg transition" 
                            title="Close Campaign"
                          >
                            <CheckCircle className="w-4 h-4"/>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {surveys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <p>No campaigns found.</p>
                        <button onClick={() => setActiveTab('create')} className="text-indigo-600 font-medium hover:underline">
                          Create your first campaign
                        </button>
                      </div>
                    </td>
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
