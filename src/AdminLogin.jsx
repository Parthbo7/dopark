import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error("Invalid admin credentials");
      }

      // Success - set some sort of admin session (like localStorage)
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminEmail', data.email);
      
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-4 font-body">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden shadow-[#4a40e0]/10 border border-[#4a40e0]/5">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4a40e0] to-[#5D50D6] p-8 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-4">
               <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">Luminous Navigator</h1>
            <p className="text-indigo-100 text-sm mt-1 font-medium tracking-widest uppercase">Smart Parking Admin</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              
              {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100">
                     <span className="material-symbols-outlined">error</span>
                     {error}
                  </div>
              )}

              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-2 px-1">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <span className="material-symbols-outlined text-on-surface-variant/50">mail</span>
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#4a40e0] focus:ring-4 focus:ring-[#4a40e0]/10 transition-all font-semibold"
                    placeholder="admin@doparking.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-2 px-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <span className="material-symbols-outlined text-on-surface-variant/50">lock</span>
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#4a40e0] focus:ring-4 focus:ring-[#4a40e0]/10 transition-all font-semibold"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 mt-4 text-white font-extrabold text-[15px] rounded-2xl border-2 border-white/10 tracking-wide uppercase transition-all shadow-lg shadow-[#4a40e0]/30 active:scale-95 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-[#4a40e0] hover:bg-[#382ec2]'}`}
              >
                {loading ? 'Authenticating...' : 'Secure Login'}
              </button>
            </form>
            
            <div className="mt-8 text-center text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest">
                Authorized Personnel Only
            </div>
        </div>
      </div>
    </div>
  );
}
