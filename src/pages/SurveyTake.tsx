import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { ArrowLeft, CheckCircle2, Loader, Coins, Mic, Video as VideoIcon, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function SurveyTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [response, setResponse] = useState(''); 
  const [rating, setRating] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (token) fetchSurvey();
  }, [id, token]);

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`/api/surveys/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setSurvey(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          responseData: { 
            text: response,
            rating,
            selection,
            recorded
          } 
        })
      });
      if (res.ok) {
        setCompleted(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Submission failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting survey');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecord = () => {
    if (recording) {
      setRecording(false);
      setRecorded(true);
    } else {
      setRecording(true);
      setRecorded(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader className="w-8 h-8 animate-spin text-indigo-600"/></div>;
  if (!survey) return <div className="p-8 text-center text-slate-500">Survey not found</div>;

  if (completed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="max-w-xl mx-auto text-center py-16 px-4"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Survey Completed!</h2>
        <p className="text-slate-600 mb-8 text-lg">
          Thank you for your valuable feedback. You've earned <strong className="text-emerald-600">{survey.rewardPoints} points</strong>!
        </p>
        <button 
          onClick={() => navigate('/surveys')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          Back to Surveys
        </button>
      </motion.div>
    );
  }

  const isComparison = survey.type.includes('Comparison');
  const isRating = survey.type.includes('Rating');
  const isVoice = survey.type.includes('Voice');
  const isSelfie = survey.type.includes('Selfie');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate('/surveys')}
        className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-medium transition"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 inline-block">
              {survey.type}
            </span>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{survey.title}</h1>
            <p className="text-slate-600 mb-4">{survey.description}</p>
            {survey.content?.link && (
              <a href={survey.content.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition">
                Open Link <ArrowLeft className="w-4 h-4 rotate-[135deg]" />
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Reward</span>
            <span className="flex items-center gap-1 text-2xl font-bold text-emerald-600">
              <Coins className="w-6 h-6" /> {survey.rewardPoints}
            </span>
          </div>
        </div>

        {isComparison ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 mt-4">
            <div 
              onClick={() => setSelection(1)}
              className={`rounded-2xl overflow-hidden border-4 cursor-pointer transition relative ${selection === 1 ? 'border-indigo-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="bg-black flex items-center justify-center h-64">
                {survey.content?.mediaType === 'video' ? (
                  <video src={survey.content?.media} controls className="w-full h-full object-contain" />
                ) : survey.content?.mediaType === 'audio' ? (
                  <audio src={survey.content?.media} controls className="w-full" />
                ) : (
                  <img src={survey.content?.media} alt="Option 1" className="w-full h-full object-contain" />
                )}
              </div>
              {selection === 1 && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white rounded-full p-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div className="p-3 text-center font-medium bg-slate-50 border-t border-slate-200">
                Option 1
              </div>
            </div>
            
            <div 
              onClick={() => setSelection(2)}
              className={`rounded-2xl overflow-hidden border-4 cursor-pointer transition relative ${selection === 2 ? 'border-indigo-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="bg-black flex items-center justify-center h-64">
                {survey.content?.mediaType2 === 'video' ? (
                  <video src={survey.content?.media2} controls className="w-full h-full object-contain" />
                ) : survey.content?.mediaType2 === 'audio' ? (
                  <audio src={survey.content?.media2} controls className="w-full" />
                ) : (
                  <img src={survey.content?.media2} alt="Option 2" className="w-full h-full object-contain" />
                )}
              </div>
              {selection === 2 && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white rounded-full p-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div className="p-3 text-center font-medium bg-slate-50 border-t border-slate-200">
                Option 2
              </div>
            </div>
          </div>
        ) : (
          survey.content?.media && (
            <div className="mb-8 mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center max-h-[500px]">
              {survey.content.mediaType === 'video' ? (
                <video src={survey.content.media} controls className="w-full max-h-[500px] object-contain" />
              ) : survey.content.mediaType === 'audio' ? (
                <audio src={survey.content.media} controls className="w-full p-8" />
              ) : (
                <img src={survey.content.media} alt="Survey Media" className="w-full max-h-[500px] object-contain" />
              )}
            </div>
          )
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-8 pt-8 border-t border-slate-100">
          
          {isRating && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Rate this item (1-5 stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <Star className={`w-10 h-10 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isVoice || isSelfie ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
              <label className="block text-sm font-semibold text-slate-900">
                {isVoice ? 'Record your voice response' : 'Record your video response'}
              </label>
              
              <button 
                type="button"
                onClick={handleRecord}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${
                  recording ? 'bg-rose-100 text-rose-600 animate-pulse scale-110' : 
                  recorded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {isVoice ? (
                  recording ? <Mic className="w-8 h-8" /> : recorded ? <CheckCircle2 className="w-8 h-8" /> : <Mic className="w-8 h-8" />
                ) : (
                  recording ? <VideoIcon className="w-8 h-8" /> : recorded ? <CheckCircle2 className="w-8 h-8" /> : <VideoIcon className="w-8 h-8" />
                )}
              </button>
              
              <p className="text-sm font-medium">
                {recording ? 'Recording... Click to stop.' : recorded ? 'Recording saved!' : 'Click to start recording.'}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                {isComparison ? 'Explain why you chose this option:' : 'Please share your detailed feedback:'}
              </label>
              <textarea 
                required 
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Type your response here..."
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
              />
            </div>
          )}
          
          <button 
            disabled={submitting || (isComparison && !selection) || (isRating && !rating) || ((isVoice || isSelfie) && !recorded)}
            type="submit" 
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting && <Loader className="w-5 h-5 animate-spin" />}
            Submit & Claim Points
          </button>
        </form>
      </div>
    </div>
  );
}
