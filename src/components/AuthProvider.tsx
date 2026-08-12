import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  role: string;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, token: null, role: 'user' });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const t = await u.getIdToken();
        setToken(t);
        // Sync user
        try {
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${t}` }
          });
          if (res.ok) {
            const data = await res.json();
            setRole(data.user.role);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">{isLogin ? 'Sign In' : 'Create Account'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {authError && <p className="text-rose-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 font-medium hover:underline">
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
