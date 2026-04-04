import { useState } from 'react';
import { supabase } from './supabase';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [isUserRole, setIsUserRole] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ text: 'Logged in successfully!', type: 'success' });
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err) {
      setMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="flex-grow flex items-center justify-center px-6 py-12 liquid-gradient relative overflow-hidden min-h-screen">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-container/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-tertiary-container/20 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3"></div>
        
        {/* Login Card */}
        <div className="w-full max-w-[440px] bg-surface-bright rounded-[2rem] shadow-[0px_20px_60px_rgba(26,0,153,0.12)] border border-white/40 overflow-hidden relative z-10 block">
          
          {/* Header Section */}
          <div className="pt-10 pb-6 px-10 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_parking</span>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface">Do Parking</h1>
            <p className="text-on-surface-variant font-medium mt-1">User Login</p>
            <div className="w-full h-px bg-outline-variant/15 mt-8"></div>
          </div>
          
          <div className="px-10 pb-10">
            {/* Toggle Switch */}
            <div className="p-1 bg-surface-container-low rounded-full flex mb-8">
              <button 
                type="button"
                onClick={() => setIsUserRole(true)} 
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${isUserRole ? 'liquid-gradient text-on-primary shadow-lg shadow-primary/20' : 'font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer'}`}
              >
                User
              </button>
              <button 
                type="button"
                onClick={() => navigate('/admin/login')} 
                className={`flex-1 py-2.5 rounded-full text-sm transition-colors ${!isUserRole ? 'liquid-gradient text-on-primary shadow-lg shadow-primary/20 font-bold' : 'font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer'}`}
              >
                Admin
              </button>
            </div>
            
            {/* Form Section */}
            <form className="space-y-5" onSubmit={handleLogin}>
              {message.text && (
                <div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-100 text-green-700'}`}>
                  {message.text}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 ml-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">mail</span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none placeholder:text-outline/50 text-on-surface" 
                    placeholder="name@company.com" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">Password</label>
                  <a className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-dim transition-colors" href="#">Forgot?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">lock</span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none placeholder:text-outline/50 text-on-surface" 
                    placeholder="••••••••" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3 pt-1">
                <div className="relative flex items-center">
                  <input 
                    className="w-5 h-5 rounded border-outline-variant/50 text-primary focus:ring-primary/20 cursor-pointer" 
                    id="remember" 
                    type="checkbox" 
                    defaultChecked 
                  />
                </div>
                <label className="text-sm font-medium text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Remember Me</label>
              </div>
              
              {/* CTA Button */}
              <button 
                className="w-full py-4 mt-4 liquid-gradient text-on-primary font-bold rounded-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:scale-100" 
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Logging in...' : 'Login'}</span>
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>
            
            {/* Footer Link */}
            {isUserRole && (
              <div className="mt-8 text-center">
                <p className="text-sm text-on-surface-variant font-medium">
                  Don’t have an account? 
                  <Link to="/signup" className="text-primary font-bold hover:underline ml-1">Sign Up</Link>
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* System Tagline */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-0 hidden md:block">
          <p className="text-on-primary/60 text-xs font-semibold uppercase tracking-[0.2em]">The Luminous Navigator of Smart City Parking</p>
        </div>
      </main>
      
      {/* Footer Component */}
      <footer className="bg-[#f3f7fb] dark:bg-slate-950 border-t border-slate-200/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full max-w-7xl mx-auto space-y-4 md:space-y-0">
          <p className="font-plus-jakarta text-xs uppercase tracking-widest font-semibold text-slate-400">© 2024 Do Parking. All rights reserved.</p>
          <div className="flex space-x-8">
            <a className="font-plus-jakarta text-xs uppercase tracking-widest font-semibold text-slate-400 hover:text-indigo-500 transition-colors opacity-100 hover:opacity-70" href="#">Privacy Policy</a>
            <a className="font-plus-jakarta text-xs uppercase tracking-widest font-semibold text-slate-400 hover:text-indigo-500 transition-colors opacity-100 hover:opacity-70" href="#">Terms of Service</a>
            <a className="font-plus-jakarta text-xs uppercase tracking-widest font-semibold text-slate-400 hover:text-indigo-500 transition-colors opacity-100 hover:opacity-70" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </>
  );
}
