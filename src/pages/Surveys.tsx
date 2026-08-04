import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { ClipboardList, Clock, Coins, Tag, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export function Surveys() {
  const { token, role } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) fetchSurveys();
  }, [token]);

  const fetchSurveys = async () => {
    const res = await fetch('/api/surveys', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSurveys(await res.json());
  };

  const surveyTypes = useMemo(() => {
    const types = new Set(surveys.map(s => s.type));
    return ['All', ...Array.from(types)].sort();
  }, [surveys]);

  const filteredSurveys = filterType === 'All' 
    ? surveys 
    : surveys.filter(s => s.type === filterType);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            Available Surveys
          </h1>
          <p className="text-slate-600">Complete surveys to earn reward points.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer"
          >
            {surveyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSurveys.map((survey, i) => (
          <motion.div
            key={survey.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                {survey.type}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4" />
                {survey.rewardPoints}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">{survey.title}</h3>
            <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-2">{survey.description}</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~{survey.estimatedCompletionTime || 5} mins</span>
                </div>
                {survey.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>{survey.category}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => navigate(`/surveys/${survey.id}`)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
              >
                Start Survey
              </button>
            </div>
          </motion.div>
        ))}

        {filteredSurveys.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl border-dashed">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No surveys available</h3>
            <p className="text-slate-500">Check back later for new opportunities to earn points.</p>
          </div>
        )}
      </div>
    </div>
  );
}
